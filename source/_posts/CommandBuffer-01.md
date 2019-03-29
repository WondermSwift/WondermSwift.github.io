---
title: CommandBuffer_01 标记特殊区域
date: 2019-03-04 23:53:59
categories:  Unity

tags: 
- Shader 
- Image Effect 
- CommandBuffer

description:
---
之前贝尔矩阵模糊的问题一直没有解决，最近有时间看了一下 `CommandBuffer` 的内容实现了一下比我想像的要简单的多

<!--more-->
# 概念

[命令缓冲区](https://docs.unity3d.com/ScriptReference/Rendering.CommandBuffer.html) 是预先写好的一系列渲染指令，可以在给定的时机插入到相机的渲染过程中
由于 `GrabPass` 效率感人，基本上毛玻璃Bloom标记之类的常使用 `CommandBuffer` 来实现

# 需求
这次我们改造之前使用相机拍摄的半透明矩阵模糊区域，彻底告别额外相机和 `Stencil`
做一个清爽的实现
模糊和 `Dither` 已经实现了直接用现成的，现在只要把模糊区域在 `RT` 中标记出来放入 `Mask` 即可

# API

- DrawRenderer ( render，mat )  类似之前使用过的 ShaderReplace 
- SetRenderTarget ( RenderTargetIdentifier rt ) 指定接收的 RT
- ClearRenderTarget  清空内容
- GetTemporaryRT  获取 RT
- SetGlobalTexture 通过 RTId 来传递 Mask 给材质球

值得在意的是，这些方法都在没有内容变更时均只需要调用一次


# Code

创建 `Buffer` , 由于我们并不希望Buffer被绘制为可见，所以把时机放在 `AfterLighting` ，并且我们需要深度来进行遮挡剔除

```csharp
buffer = new CommandBuffer();
buffer.name = "Dither CommandBuffer";

cam.depthTextureMode = DepthTextureMode.Depth;
cam.AddCommandBuffer(CameraEvent.AfterLighting, buffer);
```

获取 `RT`，使用 `GetRT` 和 `SetRT` 

```csharp
	 if (target != selectObj.obj.GetComponent<Renderer>())
		{
		            ditherTexId = Shader.PropertyToID("_Temp1");
		            buffer.GetTemporaryRT(ditherTexId, -1, -1, 24, FilterMode.Bilinear);
		            buffer.SetRenderTarget(ditherTexId);
		            buffer.ClearRenderTarget(true, true, Color.black);

		            target = selectObj.obj.GetComponent<Renderer>();
		            buffer.DrawRenderer(target, ditherMat);
           			buffer.SetGlobalTexture(maskTexId, ditherTexId);
		}
```

绘制用的 Shader 需要能够进行深度裁剪，需要特殊处理

```C
	vertexOutput vert(vertexInput input)
	{
		vertexOutput output;
		output.pos = UnityObjectToClipPos(input.vertex);
        output.texCoord = input.texCoord;
        
        output.screenPos = ComputeScreenPos(output.pos);
        output.linearDepth = -(UnityObjectToViewPos(input.vertex).z * _ProjectionParams.w);

        return output;
	}

	float4 frag(vertexOutput input) : COLOR
	{
        float4 c = float4(0, 0, 0, 1);

		float2 uv = input.screenPos.xy / input.screenPos.w; 
		float camDepth = SAMPLE_DEPTH_TEXTURE(_CameraDepthTexture, uv);
		camDepth = Linear01Depth (camDepth); 

       float diff = saturate(input.linearDepth - camDepth);
        c =lerp(c, float4(1, 0, 0, 1),diff  < 1);

        return c;
     
	}
```

# 效果

如此我们就可以实现了想要的效果 切换选择发现边缘也没有瑕疵
![Blur_1](Blur_1.png)
![Blur_2](Blur_2.png)

在 FrameDebug 里查看  Mask 输出
![FrameDebug](Final.png)

# 改进

1. 可影通过 Mask 传递Alpha值选择最终的混合强度
2. 目前是背景模糊了，如果是只有半透明则需要两个 `Buffer` ，第一个绘制挖洞的模型，第二个模糊区域混合后在后期进行叠加，模型本身不需要相机渲染


 