---
title: Unity地形三轴纹理映射(Triplanar)
date: 2016-11-05 17:57:58
categories:
- Unity
tags:
- Unity
- Shader
---

使用 `Unity` 自带地形制作悬崖峭壁时会遇到贴图拉伸的问题，之前一直没有解决这个问题的需求，最近策划突然要解决这个问题，于是研究了一下。
<!--more-->

### 定位问题
之前我一直不知道这个问题怎么描述，通过搜索贴图拉伸找到了一个参考 [没有贴图拉伸的陡峭悬崖](http://www.cnblogs.com/cproom/archive/2006/08/07/470066.html) ,原理很清楚但是要是有代码就更好了(懒癌晚期)。


### 调研问题
依照经验，你遇到的问题有绝大多数的人好多年前就遇到了，并且给出了完善的解决方案，所以我们不准备从头造轮子，借助搜索引擎,我找到了以下参考：

>  [Realtime Volume Rendering Aimed at Terrain](https://www.volume-gfx.com/volume-rendering/triplanar-texturing/)

>  [Use Tri-Planar Texture Mapping for Better Terrain](https://gamedevelopment.tutsplus.com/articles/use-tri-planar-texture-mapping-for-better-terrain--gamedev-13821)

>  [How-to improve Unity terrain texturing tutorial](https://ravingbots.com/2015/09/02/how-to-improve-unity-terrain-texturing-tutorial/)

至此，问题已经全部解决。我们借用几张图来回顾一下问题和解决方式：

问题描述

![问题描述](triPlanar-regularTerrain.jpg)

产生原因

![产生原因](triPlanar-terrainUnwrap.png)

解决方式

![解决方式](triPlanar-angles.png) 

解决结果

![解决结果](triPlanar-Terrain.jpg)

### 解决问题
 1. 先去官网下载内置 `Shader` 源码包
 2. 阅读源码，定位关键 `Shader` 为以下三个:

	> Standard-AddPass.shader

  	> Standard-FirstPass.shader
  	
  	> TerrainSplatmapCommon.cginc

 3. 复制一份出来改名修改，加入 `Triplanar` 算法
 4. 新建材质替换地形默认的内置材质

### 效果展示
![效果展示](Unity_Terrain_Triplanar_result.jpg)

### 源码修改

`TerrainSplatmapCommon.cginc` 基于5.4.2

```cpp
#ifndef TERRAIN_SPLATMAP_COMMON_CGINC_INCLUDED
#define TERRAIN_SPLATMAP_COMMON_CGINC_INCLUDED

struct Input
{
	float2 uv_Splat0 : TEXCOORD0;
	float2 uv_Splat1 : TEXCOORD1;
	float2 uv_Splat2 : TEXCOORD2;
	float2 uv_Splat3 : TEXCOORD3;
	float2 tc_Control : TEXCOORD4;	// Not prefixing '_Contorl' with 'uv' allows a tighter packing of interpolators, which is necessary to support directional lightmap.
	UNITY_FOG_COORDS(5)

		//>>> Triplanar
#ifdef _TERRAIN_NORMAL_MAP
		float3 vertNormal;
#endif
	float3 worldPos;
	//<<< Triplanar
};

//>>> Triplanar
fixed3 normal;
float3 worldPos;
uniform float4 _WorldS, _WorldT;
uniform float4 _Splat0_ST, _Splat1_ST, _Splat2_ST, _Splat3_ST;
//<<< Triplanar

sampler2D _Control;
float4 _Control_ST;
sampler2D _Splat0, _Splat1, _Splat2, _Splat3;

#ifdef _TERRAIN_NORMAL_MAP
sampler2D _Normal0, _Normal1, _Normal2, _Normal3;
#endif

void SplatmapVert(inout appdata_full v, out Input data)
{
	UNITY_INITIALIZE_OUTPUT(Input, data);
	data.tc_Control = TRANSFORM_TEX(v.texcoord, _Control);	// Need to manually transform uv here, as we choose not to use 'uv' prefix for this texcoord.
	float4 pos = UnityObjectToClipPos(v.vertex);
	UNITY_TRANSFER_FOG(data, pos);

#ifdef _TERRAIN_NORMAL_MAP
	v.tangent.xyz = cross(v.normal, float3(0, 0, 1));
	v.tangent.w = -1;
	//>>> Triplanar
	data.vertNormal = v.normal;
	//<<< Triplanar

#endif
}

inline fixed4 Triplanar(float3 wp, fixed3 n, float4 st, sampler2D s)
{
	return 	n.x * tex2D(s, st.xy * wp.yz + st.zw) +
		n.y * tex2D(s, st.xy * wp.xz + st.zw) +
		n.z * tex2D(s, st.xy * wp.xy + st.zw);
}

#ifdef TERRAIN_STANDARD_SHADER
void SplatmapMix(Input IN, half4 defaultAlpha, out half4 splat_control, out half weight, out fixed4 mixedDiffuse, inout fixed3 mixedNormal)
#else
void SplatmapMix(Input IN, out half4 splat_control, out half weight, out fixed4 mixedDiffuse, inout fixed3 mixedNormal)
#endif
{
	splat_control = tex2D(_Control, IN.tc_Control);
	weight = dot(splat_control, half4(1, 1, 1, 1));

#if !defined(SHADER_API_MOBILE) && defined(TERRAIN_SPLAT_ADDPASS)
	clip(weight == 0.0f ? -1 : 1);
#endif

	// Normalize weights before lighting and restore weights in final modifier functions so that the overal
	// lighting result can be correctly weighted.
	splat_control /= (weight + 1e-3f);

	mixedDiffuse = 0.0f;
	//>>> Triplanar
	worldPos = IN.worldPos * _WorldS.xyz + _WorldT.xyz;
#ifdef _TERRAIN_NORMAL_MAP
	normal = abs(IN.vertNormal);
#else
	normal = abs(mixedNormal);
#endif
	normal /= normal.x + normal.y + normal.z + 1e-3f;
	//<<< Triplanar

#ifdef TERRAIN_STANDARD_SHADER
	/* Unity
	mixedDiffuse += splat_control.r * tex2D(_Splat0, IN.uv_Splat0) * half4(1.0, 1.0, 1.0, defaultAlpha.r);
	mixedDiffuse += splat_control.g * tex2D(_Splat1, IN.uv_Splat1) * half4(1.0, 1.0, 1.0, defaultAlpha.g);
	mixedDiffuse += splat_control.b * tex2D(_Splat2, IN.uv_Splat2) * half4(1.0, 1.0, 1.0, defaultAlpha.b);
	mixedDiffuse += splat_control.a * tex2D(_Splat3, IN.uv_Splat3) * half4(1.0, 1.0, 1.0, defaultAlpha.a);
	*/

	//>>> Triplanar
	mixedDiffuse += splat_control.r * Triplanar(worldPos, normal, _Splat0_ST, _Splat0) * half4(1.0, 1.0, 1.0, defaultAlpha.r);
	mixedDiffuse += splat_control.g * Triplanar(worldPos, normal, _Splat1_ST, _Splat1) * half4(1.0, 1.0, 1.0, defaultAlpha.g);
	mixedDiffuse += splat_control.b * Triplanar(worldPos, normal, _Splat2_ST, _Splat2) * half4(1.0, 1.0, 1.0, defaultAlpha.b);
	mixedDiffuse += splat_control.a * Triplanar(worldPos, normal, _Splat3_ST, _Splat3) * half4(1.0, 1.0, 1.0, defaultAlpha.a);
	//<<< Triplanar

#else
	/* Unity
	mixedDiffuse += splat_control.r * tex2D(_Splat0, IN.uv_Splat0);
	mixedDiffuse += splat_control.g * tex2D(_Splat1, IN.uv_Splat1);
	mixedDiffuse += splat_control.b * tex2D(_Splat2, IN.uv_Splat2);
	mixedDiffuse += splat_control.a * tex2D(_Splat3, IN.uv_Splat3);
	*/
	mixedDiffuse += splat_control.r * Triplanar(worldPos, normal, _Splat0_ST, _Splat0);
	mixedDiffuse += splat_control.g * Triplanar(worldPos, normal, _Splat1_ST, _Splat1);
	mixedDiffuse += splat_control.b * Triplanar(worldPos, normal, _Splat2_ST, _Splat2);
	mixedDiffuse += splat_control.a * Triplanar(worldPos, normal, _Splat3_ST, _Splat3);
#endif

#ifdef _TERRAIN_NORMAL_MAP
	fixed4 nrm = 0.0f;

	/* Unity
	nrm += splat_control.r * tex2D(_Normal0, IN.uv_Splat0);
	nrm += splat_control.g * tex2D(_Normal1, IN.uv_Splat1);
	nrm += splat_control.b * tex2D(_Normal2, IN.uv_Splat2);
	nrm += splat_control.a * tex2D(_Normal3, IN.uv_Splat3);
	*/
	nrm += splat_control.r * Triplanar(worldPos, normal, _Splat0_ST, _Normal0);
	nrm += splat_control.g * Triplanar(worldPos, normal, _Splat1_ST, _Normal1);
	nrm += splat_control.b * Triplanar(worldPos, normal, _Splat2_ST, _Normal2);
	nrm += splat_control.a * Triplanar(worldPos, normal, _Splat3_ST, _Normal3);

	mixedNormal = UnpackNormal(nrm);
#endif
}

#ifndef TERRAIN_SURFACE_OUTPUT
#define TERRAIN_SURFACE_OUTPUT SurfaceOutput
#endif

void SplatmapFinalColor(Input IN, TERRAIN_SURFACE_OUTPUT o, inout fixed4 color)
{
	color *= o.Alpha;
#ifdef TERRAIN_SPLAT_ADDPASS
	UNITY_APPLY_FOG_COLOR(IN.fogCoord, color, fixed4(0, 0, 0, 0));
#else
	UNITY_APPLY_FOG(IN.fogCoord, color);
#endif
}

void SplatmapFinalPrepass(Input IN, TERRAIN_SURFACE_OUTPUT o, inout fixed4 normalSpec)
{
	normalSpec *= o.Alpha;
}

void SplatmapFinalGBuffer(Input IN, TERRAIN_SURFACE_OUTPUT o, inout half4 diffuse, inout half4 specSmoothness, inout half4 normal, inout half4 emission)
{
	diffuse.rgb *= o.Alpha;
	specSmoothness *= o.Alpha;
	normal.rgb *= o.Alpha;
	emission *= o.Alpha;
}

#endif // TERRAIN_SPLATMAP_COMMON_CGINC_INCLUDED

```
 