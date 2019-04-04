---
title: 基于 CustomRenderTexture 的画板
date: 2019-04-04 21:11:54
categories: Unity
tags:
- Unity
- CustomRenderTexture
---
之前项目需要制作一些场景互动如压草之类的都是通过另外一个相机渲染到 RenderTexture 来实现的，性能压力比较大，最近做沙子交互想起之前看到的 CustomRenderTexture 动手实践了一下
<!--more-->

### 概念和文档

[CustomRenderTexture](https://docs.unity3d.com/ScriptReference/CustomRenderTexture.html)

CRT 是在 Unity 中创建的一种资源，可以像 RT 一样使用
区别是可以通过脚本和材质配合进行内容更新 


勾选 `DoubleBuffered` 保证我们可以在运行时采样上一帧的图像
Shader 添加更新用的 Pass 和 几个笔刷 Pass
C# 脚本添加基本的更新和 UV 获取逻辑 
多通道混合需要在对应Pass里采样贴图 笔刷的实现也一样

### Shader 实现

```
Shader "Wonderm/CRT_Shader"
{
	Properties
	{
		_Brush_R("Brush_R", 2D) = "black" {}
		_Brush_G("Brush_G", 2D) = "black" {}
		_Brush_RGB("Brush_RGB", 2D) = "black" {}
	}

	CGINCLUDE

		#include "UnityCustomRenderTexture.cginc"
 

		float4 frag(v2f_customrendertexture i) : SV_Target
		{
			float2 uv = i.globalTexcoord;
			float4 c = tex2D(_SelfTexture2D, uv);

			return c;
		}

		sampler2D _Brush_R;
		float4 _Brush_R_ST;

		float4 frag_Brush_R(v2f_customrendertexture i) : SV_Target
		{
			float2 uv = i.globalTexcoord;
			float4 c = tex2D(_SelfTexture2D, uv);

			float2 brushUV = i.localTexcoord*_Brush_R_ST.xy+ _Brush_R_ST.zw;
			float4 r = tex2D(_Brush_R, brushUV);

			float f = saturate( r.r +c.r);

			return float4(f, c.g, c.b, max(f, c.a));
		}

		sampler2D _Brush_G;
		float4 _Brush_G_ST;

		float4 frag_Brush_G(v2f_customrendertexture i) : SV_Target
		{
			float2 uv = i.globalTexcoord;
			float4 c = tex2D(_SelfTexture2D, uv);

			float2 brushUV = i.localTexcoord*_Brush_G_ST.xy + _Brush_G_ST.zw;
			float4 g = tex2D(_Brush_G, brushUV);

			float f = saturate(g.r + c.g);
			 
			return  float4(c.r, f, c.b, max(f,c.a));
		}

		sampler2D _Brush_RGB;
		float4 _Brush_RGB_ST;

		float4 frag_Brush_RGB(v2f_customrendertexture i) : SV_Target
		{
			float2 uv = i.globalTexcoord;
			float4 c = tex2D(_SelfTexture2D, uv);

			float2 brushUV = i.localTexcoord*_Brush_RGB_ST.xy + _Brush_RGB_ST.zw;
			float4 g = tex2D(_Brush_RGB, brushUV);

			float4 f = lerp(c,g,g.a);
			return f;
		}
	
	ENDCG

			SubShader
		{
			Cull Off ZWrite Off ZTest Always

			Pass
			{
				Name "Update"
				CGPROGRAM
				#pragma vertex CustomRenderTextureVertexShader
				#pragma fragment frag
				ENDCG
			}

			Pass
			{
				Name "Brush_R"
				CGPROGRAM
				#pragma vertex CustomRenderTextureVertexShader
				#pragma fragment frag_Brush_R
				ENDCG
			}

			Pass
			{
				Name "Brush_G"
				CGPROGRAM
				#pragma vertex CustomRenderTextureVertexShader
				#pragma fragment frag_Brush_G
				ENDCG
			}

			Pass
			{
				Name "Brush_RGB"
				CGPROGRAM
				#pragma vertex CustomRenderTextureVertexShader
				#pragma fragment frag_Brush_RGB
				ENDCG
			}
		}
}

```

### 脚本实现

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class CanvasPainterCtr : MonoBehaviour
{

    [SerializeField]
    private Renderer targetRender;

    [SerializeField]
    CustomRenderTexture source_CRT;

    [SerializeField]
    int iterationPerFrame = 5;

    [SerializeField, Range(0.01f, 0.5f)]
    private float paintRadius;

    [SerializeField]
    CustomRenderTexture crt;

    [SerializeField]
    private bool sharemat;

    [SerializeField]
    string propName = "_MainTex";

    CustomRenderTextureUpdateZone updateZone = new CustomRenderTextureUpdateZone();
    CustomRenderTextureUpdateZone painterZone = new CustomRenderTextureUpdateZone();
    CustomRenderTextureUpdateZone[] list  ;


    void OnEnable()
    {
        crt = CustomRenderTexture.Instantiate(source_CRT);
        crt.Initialize();
        if (sharemat)
        {
            targetRender.sharedMaterial.SetTexture(propName, crt);
        }
        else
        {
            targetRender.material.SetTexture(propName, crt);
        }

        list = new CustomRenderTextureUpdateZone[] { updateZone, painterZone };

    }

    private void OnDisable()
    {
        crt.ClearUpdateZones();
        Destroy(crt);
    }


    private void LateUpdate()
    {
        ApplyUpdate();
    }
 
    void ApplyUpdate()
    {
        crt.ClearUpdateZones();
        UpdateZones();
        crt.Update(iterationPerFrame);
    }

    RaycastHit[] hits = new RaycastHit[4];

    void UpdateZones()
    {
        bool leftClick = Input.GetMouseButton(0);
        bool rightClick = Input.GetMouseButton(1);
        bool middleClick = Input.GetMouseButton(2);

        int index = leftClick ? 1 : rightClick ? 2 : middleClick ? 3 : -1;
        if (index < 0) return;


        var ray = Camera.main.ScreenPointToRay(Input.mousePosition);
        var count = Physics.RaycastNonAlloc(ray,   hits);
 

        for (int i = 0; i < count; i++)
        {

            list[0].needSwap = true;
            list[0].passIndex = 0;
            list[0].rotation = 0f;
            list[0].updateZoneCenter = new Vector2(0.5f, 0.5f);
            list[0].updateZoneSize = new Vector2(1f, 1f);

            list[1].needSwap = true;
            list[1].passIndex = index;
            list[1].rotation = 0f;
            list[1].updateZoneCenter = new Vector2(hits[i].textureCoord.x,  1- hits[i].textureCoord.y);
            list[1].updateZoneSize = new Vector2(paintRadius, paintRadius);

            crt.SetUpdateZones(list);
        }
    }
}

```

### 丑陋的效果图等待更新
![CRT_1](CRT_1.jpg)
![CRT_2](CRT_2.jpg)

### 参考

[hecomi/UnityWaterSurface](https://github.com/hecomi/UnityWaterSurface)