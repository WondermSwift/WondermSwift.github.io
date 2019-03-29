---
title: Unity 卡通渲染（一）
date: 2017-04-03 00:28:51
categories: Unity
tags: 
 - Unity
 - Shader
 - Toon
---
今天在知乎上看到一篇文章 [《塞尔达风之杖技术分析-角色渲染和面部表情》](https://zhuanlan.zhihu.com/p/26140321)，
想起自己虽然也看了不少卡通渲染的文章，却还没有手动撸过，决定练习一下。
<!--more-->

风之杖的渲染其实非常简单，贴图只画色彩，不画光影和明暗，将法线方向和光线方向做点乘再和纹理相乘得到暗部强度，过渡方式实用 Smoothstep 或者通关渐变纹理指定。


### Unlit Shader

先撸个无光照的架子往里面填东西
```
Shader "Wonderm/Unlit/Texture"
{
	Properties
	{
		_MainTex("Texture", 2D) = "white" {}
	}
		SubShader
	{
		Tags { "RenderType" = "Opaque" }
		LOD 100
		 
		Pass
		{
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			#pragma multi_compile_fog

			#include "UnityCG.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				float2 uv : TEXCOORD0;
			};

			struct v2f
			{
				float2 uv : TEXCOORD0;
				UNITY_FOG_COORDS(1)
				float4 vertex : SV_POSITION;
			};

			sampler2D _MainTex;
			float4 _MainTex_ST;

			v2f vert(appdata v)
			{
				v2f o;
				o.vertex = UnityObjectToClipPos(v.vertex);
				o.uv = TRANSFORM_TEX(v.uv, _MainTex);
				UNITY_TRANSFER_FOG(o,o.vertex);
				return o;
			}

			fixed4 frag(v2f i) : SV_Target
			{
				fixed4 col = tex2D(_MainTex, i.uv);
				UNITY_APPLY_FOG(i.fogCoord, col);
			
				return col;
			}
		ENDCG
		}
	}
}
```

### Dark

移除雾效，添加暗部，公式如下
```
 shadow = dot(worldNormal,normalize(lightDir)) ;
 color *= smoothstep(0.0, 0.1, shadow) * 0.4 + 0.6; 
 ```

### Shadow

添加一个 Pass 使用 `Shadow Caster` 即可
```
UsePass "VertexLit/SHADOWCASTER"
```

### Alpha

直接实用Cutout

```
_Cutoff("Cutoff",Range(0,1))=0.4

clip(color.a-_Cutoff);
```

### Bug Fix

打工搞成丢进游戏角色里，发现在相机和光线平行的位置，影子会闪烁，而且渲染效果锯齿很差，看了下相机是 `Defered`，查看代码发现没有设置 `LightMode` 

````
	Tags{ "LightMode" = "ForwardBase"  }
```

### Extension

之前有看过卡通渲染的文章会选用一张 `RampMap` 来做过渡的渐变
扩展一下

```
	fixed toon = tex2D(_ToonMap, float2(1-shadow,0.5)).r ;
	shadow = smoothstep(0.0, 0.1, shadow) * 0.4 + 0.6;
	toon *= shadow ;
	col *=  lerp(shadow,toon,_ToonEffect) ;
```

### Show

对比下渲染效果

![Result](Unity-Shader-ToonShading_result.png)

 