---
title: Shader 屏幕后期特效-02
date: 2017-07-07 23:47:48
categories: Shader
tags: 
 - Shader
 - Image Effect
description:
---

之前老大一直吐槽我从网上抄的高斯模糊 Shader 太渣 , 隔壁项目今天也要做屏幕模糊 , 交流时提供给了我个思路 , 趁着今天停电下班早 , 屏幕模糊效果升级一下

<!--more-->

原理基本还是一样，提升效果的思路在于对图片先缩放再模糊，多次迭代后，模糊效果指数上升，实测再烂的模糊迭代三次也基本上相当可以了，标准高斯模糊迭代六次以上差不多可以赶上 iOS 的效果

在参考网上代码的时候看到好多人把水平和垂直的模糊分别放在不同的 Pass 中去做 , 同样的迭代次数 , DrawCall是要 Double 的 , 并不理解他们的思路

核心代码：


```CSharp
		int renderWidth = sourceTexture.width >> Mathf.CeilToInt(sampleNum * blurRadius);
    int renderHeight = sourceTexture.height >> Mathf.CeilToInt(sampleNum * blurRadius);

    renderBuffer = sourceTexture;

    for (int i = 0; i < step - 1; i++)
    {
        RenderTexture tempBuffer = RenderTexture.GetTemporary(renderWidth, renderHeight, 0, sourceTexture.format);
        Graphics.Blit(renderBuffer, tempBuffer, material);
        if (i != 0)
        {
            RenderTexture.ReleaseTemporary(renderBuffer);
        }
        renderBuffer = tempBuffer;
    }
    if (step > 1)
        RenderTexture.ReleaseTemporary(renderBuffer);

    Graphics.Blit(renderBuffer, destTexture, material);
```

测试用模糊算法:
```HLSL
	color.rgb *= 0.2f;

	// 模糊 -------

	float yOffset = _BlurRadius * 0.05f;
	float xOffset = _MainTex_TexelSize.x / _MainTex_TexelSize.y * yOffset;

	// 上
	float2 uvOffset = float2(0, yOffset);
	color.rgb += tex2D(_MainTex,  i.uv + uvOffset).rgb * 0.1;

	// 下
	uvOffset.y = -yOffset;
	color.rgb += tex2D(_MainTex   , i.uv + uvOffset).rgb * 0.1;

	// 左
	uvOffset.x = -xOffset;
	uvOffset.y = 0;
	color.rgb += tex2D(_MainTex, i.uv + uvOffset).rgb * 0.1;

	// 右
	uvOffset.x = xOffset;
	color.rgb += tex2D(_MainTex,   i.uv + uvOffset).rgb * 0.1;

	// 右上
	uvOffset.x = xOffset * 0.707;
	uvOffset.y = yOffset * 0.707;
	color.rgb += tex2D(_MainTex , i.uv + uvOffset).rgb * 0.1;

	// 右下
	uvOffset.y = -uvOffset.y;
	color.rgb += tex2D(_MainTex , i.uv + uvOffset).rgb * 0.1;


	// 左下
	uvOffset.x = -uvOffset.x;
	color.rgb += tex2D(_MainTex , i.uv + uvOffset).rgb * 0.1;

	// 左上
	uvOffset.y = -uvOffset.y;
	color.rgb += tex2D(_MainTex , i.uv + uvOffset).rgb * 0.1;
```

最终效果(模糊半径1、缩放2^6、迭代3次):

![Preview](Shader_Blur_2.jpg)

PS: 说留着以后做的事情，如果没有合适契机的话真的会没有以后...
 