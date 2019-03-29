---
title: 贝尔矩阵和后期模糊实现半透明
date: 2018-03-04 07:52:32
categories: Unity
tags: 
 - Unity
 - Shader
 - Toon
---
延时渲染下的半透明排序一直是个问题，性能和Shader的书写都不是很好，于是我们在各大AAA游戏中看到半透明时的网格，这次终于抽出时间来自己实现一下

<!--more-->

之前在玩MGS时就看到了明显的网格效果，尤其当相机穿过角色脑袋时，当时才刚刚接触3D游戏开发不久 Shader 水平也仅停留在看过一本 Shader 入门的快餐书籍上，并不能理解是怎么做到的，前段时间又读了一次Unity的文档，有了基本思路

----
### 解决问题步骤

1. 生成`Dither`矩阵
2. 编写剔除 Shader
3. 标记透明区域
4. 后期区域模糊
5. 优化最终效果

----
### Ordered Dithering

最早了解到这个名词是在 [allenchou](http://allenchou.net/2016/05/a-brain-dump-of-what-i-worked-on-for-uncharted-4-chinese/) 的博客上，[贝尔矩阵](https://en.wikipedia.org/wiki/Ordered_dithering) 的原理也被揭示出来

矩阵的生成Wiki上给了公式，可以从二阶矩阵生成任意阶

~~直接套用~~ 作为程序员，除非逼不得已所有造轮子的行为都应该制止，面向Github编程的我花了两分钟就得到通项公式，顺带的到了挖洞Shader，验证了下程序的正确性可以放心食用

[别人的轮子 ( lifangjie/BayerDistanceDither )](https://github.com/lifangjie/BayerDistanceDither)


```Csharp
private static void BayerMatrix(ref float[] output, int n)
{
    Assert.IsTrue(Mathf.IsPowerOfTwo(n) && n > 1);
    {
        int log2N = Mathf.RoundToInt(Mathf.Log(n, 2));
        int[,] temp = new int[n, n];
        temp[0, 0] = 0;
        temp[0, 1] = 3;
        temp[1, 0] = 2;
        temp[1, 1] = 1;
        int currentSize = 2;
        for (int i = 1; i < log2N; i++)
        {
            for (int row = 0; row < currentSize; row++)
            {
                for (int col = 0; col < currentSize; col++)
                {
                    temp[row, col + currentSize] = temp[row, col] * 4 + 3;
                }
            }
            for (int row = 0; row < currentSize; row++)
            {
                for (int col = 0; col < currentSize; col++)
                {
                    temp[row + currentSize, col] = temp[row, col] * 4 + 2;
                }
            }
            for (int row = 0; row < currentSize; row++)
            {
                for (int col = 0; col < currentSize; col++)
                {
                    temp[row + currentSize, col + currentSize] = temp[row, col] * 4 + 1;
                }
            }
            for (int row = 0; row < currentSize; row++)
            {
                for (int col = 0; col < currentSize; col++)
                {
                    temp[row, col] = temp[row, col] * 4;
                }
            }

            currentSize *= 2;
        }
        for (int i = 0; i < n * n; i++)
        {
            output[i] = 1f + temp[i / n, i % n];
        }
    }
}
```
----
### Dither Shader

将上面项目的 Shader 改为自己的习惯

#### Frag Shader

```GLSL
V2F:
float4 screenPos :   SV_POSITION;

VERT:
o.screenPos = UnityObjectToClipPos(v.vertex);

FRAG:
ClipDither(_Dither, i.screenPos.xy );

ClipDither:
int index = (int(screenPos.x) % Size) * Size + int(screenPos.y) % Size;
return (depth - DitherMatrix[index]/(Size * Size+ 1));

```

#### Surface Shader

```
Surface:
ClipDither(_Dither, IN.screenPos);

ClipDither:
float2 pos = screenPos.xy /screenPos.w * _ScreenParams.xy;
```



### 区域标记

到了最麻烦的一个步骤，本身思路很清晰，标记了就好，但是几种标记方案都有各种坑需要踩

#### Stencil

这个是最容易想到的方法

1. 对象Shader
```
Stencil 
{
    Ref 2
    Comp Always
    Pass Replace
}
```
2. 后期Shader
```
Stencil 
{
    Ref 2
    Comp Equal
}
```

如果你以为这么个就成了说明你肯定没有自己尝试过Unity在`OnRenderImage`之前会清除`Z+Stancil`，通过`FrameDebug`可以清楚的看到，在[Twitter](https://twitter.com/desolusdev/status/776283681312956416)上看到有人说把深度改成24就可以保留，文档上和RT上确实是这么写的，但是实际测试的结果并不是这样的，被清除的干干净净，也许我的姿势不对，但是据我多方查证搜索，还没有一个姿势对的

#### Stencil + CommandBuffer

既然被提前清理了，那我只要开个`CommandBuffer`把它保留下来就Ok了，然后到`OnRenderImage`里把 RT 拿到就好了

```
cmdBuffer = new CommandBuffer();
cmdBuffer.name = "DitherMaskBuffer";
cmdBuffer.Blit(BuiltinRenderTextureType.None, BuiltinRenderTextureType.CurrentActive, stencilMat);
cam.AddCommandBuffer(CameraEvent.BeforeImageEffectsOpaque, cmdBuffer);
```

如果你以为这么个就成了说明你肯定没有自己尝试过x2
被挖过洞的对象拿到的标记区域也是挖了洞的，这个是小事，就跟屏幕描边一样平移四次就可以解决，`Forward`下一切正常，但是`Deferred`模式下`Surface Shader`的标记区域又没有了x2，只剩下`Frag Shader`，开启帧调试，发现`Stencil Clear`这次发生在`Shadow Collection`时，我看了下`CommandBuffer`的`CameraEvent`，只有一句`花Q`可以说

#### Replacement Shader

突然想起前几天Unity的微信公众号推了一篇文章 [Unity 着色器训练营(3) - 替换着色器方法](http://forum.china.unity3d.com/thread-30958-1-1.html)

也是个不错的思路，直接替换掉所有的Shader，分为非模糊和要模糊两种，区分黑白标记就好了,透明的也要注意不透明和全透明时不要模糊

1. Shader
```
RenderType = Dither

float4 black =0;
float4 white =1;
int a = _Dither>0 && _Dither <1;
return lerp(black,white,a);
```

2. ImageEffect
```
cam.SetReplacementShader(replace, "RenderType");
```

如果你以为这么个就成了说明你肯定没有自己尝试过x3
事情总是一波三折，`Forward`下一切正常，但是`Deferred`模式下`ReplacementShader`效果全都没有了x3
我翻看了文档，关于`ReplacementShader`的部分连`RenderPath`一个字都没有提及，暂且使用"Forward"模式出效果吧

至此我们生成了模糊区域的Mask图，三种方法都得开启另外一个相机来生成RT，并且都只能在`RenderPath=Forward`模式下完美工作
有朋友说有插件能在`Deferred`下使用`ReplacementShader`，~~暂且等他的回复~~插件已经收到还没有看

#### Draw Mesh  

其实有第四中方法，来源是 [利用Stencil来优化局部后处理特效](http://www.u3dnotes.com/archives/1397)
链接中给的项目确实在`Deferred下`也能正常工作，但是我并没有去尝试，原因是每个Mesh额外单独Draw一次，而且有多次绘制Quad，远不如另外一个相机用`Forward`出RT方便使用
```
 foreach (MeshFilter r in glowTargets)
{
    Graphics.DrawMeshNow(r.sharedMesh, r.transform.localToWorldMatrix);//绘制发光物体
}
```

同事使用的方法应该类似于这一种，以前大概扫了一眼代码，有时间需要交流下，他的分享

[让角色半透明：从 Ordered Dithering 说起（一）](https://cowlevel.net/article/1917657)

[让角色半透明：后期模糊（二）](https://cowlevel.net/article/1917881)

[让角色半透明：树形结构（三）](https://cowlevel.net/article/1918399)



### 后期模糊

至此我们已经拿到了标记需要模糊区域的遮罩贴图了，在以前的屏幕模糊上加入遮罩，平时只模糊遮罩部分，开启模糊时模糊全屏，这个非常的简单

屏幕模糊效果
[Shader 屏幕后期特效-02](../../../../../2017/07/07/Shader-Image-Effect-02/)


### 最终效果

你可能会注意到边缘的部分有像素的颜色比较高，其实在Shader中对Mask先模糊一次就可以解决，但我没有这么做的原因是这是放大五倍之后看到的效果，正常缩放是没有这么明显的

#### 待优化

现在看到的透明度和真正的透明比起来其实不透明度是更高的，可以选一个对照来矫正不透明变化曲线来达到更加接近的效果

挖洞 
Scale=5x 
Alpha=0.368

![挖洞细节](Dither_01.png)


挖洞 + 屏幕AA 
Scale=5x 
Alpha=0.368

![屏幕AA](Dither_AA_01.png)

挖洞 + 屏幕AA + 屏幕模糊
Scale=5x 
Alpha=0.368 
BlurSample=3 
BlurRadius=0.075

![屏幕模糊采样三次](Dither_AA_Blur_x3_01.png)

挖洞 + 屏幕AA + 屏幕模糊
Scale=5x 
Alpha=0.368 
BlurSample=8 
BlurRadius=0.075

![屏幕模糊采样八次](Dither_AA_Blur_x8_01.png)


挖洞 + 屏幕AA + 屏幕模糊
Scale=1x 
Alpha=0.368 
BlurSample=3 
BlurRadius=0.075

![正常效果](Dither_AA_Blur_x3_02.png)


### 参考文章

1. [Leveraging Stencil buffers for masked post effects](https://forum.unity.com/threads/leveraging-stencil-buffers-for-masked-post-effects.313466/)
2. [Take advantage of Stencil buffer in Post Process](http://qiankanglai.me/2015/03/07/unity-posteffect-stencil/)
3. [Stencil Buffer in Image Effect not updating](https://answers.unity.com/questions/1255829/stencil-buffer-in-image-effect-not-updating.html)
4. [CommandBuffer.Blit() isn't stencil buffer friendly](https://forum.unity.com/threads/commandbuffer-blit-isnt-stencil-buffer-friendly.432776/)
5. [[Unity 5.6.0f3] empty stencil buffer OnRenderImage](https://forum.unity.com/threads/unity-5-6-0f3-empty-stencil-buffer-onrenderimage.473444/)
6. [关于unity shader的StencilBuffer](http://lib.csdn.net/article/unity3d/36757)
7. [ShaderLab: Stencil](https://docs.unity3d.com/Manual/SL-Stencil.html)
 