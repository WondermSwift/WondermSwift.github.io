---
title: Unity默认管线置换贴图与曲面细分
date: 2019-03-30 20:03:06
categories:
 - Unity
tags:
 - Tessellation
 - Unity
---
尝试了下默认管线下的曲面细分
<!--more-->

### 效果对比
![Final_Pic](Final_Pic.jpg)


### 概念和基本用法
[Surface Shaders with DX11 / OpenGL Core Tessellation](https://docs.unity3d.com/Manual/SL-SurfaceShaderTessellation.html)

在细分后采样置换贴图，对顶点进行偏移
需要注意的是在 surf 和 frag 以外采样贴图只能使用 tex2Dlod

扩展代码

```
	#pragma surface surf Standard fullforwardshadows vertex:disp  addshadow  tessellate:tessDistance 
	#pragma require tessellation tessHW

	#include "Tessellation.cginc"

	void disp(inout appdata v)
	{
		float d = tex2Dlod(_DispTex, float4(v.texcoord.xy * _UVScale, 0, 0)).r * _Displacement;
		v.vertex.xyz += v.normal * d;
	}

	float4 tessDistance(appdata v0, appdata v1, appdata v2) {
		float minDist = 10.0;
		float maxDist = 150.0;

		return UnityDistanceBasedTess(v0.vertex, v1.vertex, v2.vertex, minDist, maxDist, _Tess);
	}

```

效果如下

![Unity_Tess](Unity_Tess.jpg)

### 存在的问题

关掉网格显示之后清晰的看到法线错误
同时切线也没有随着顶点的移动被修改
立体的网格用的还是平面的法线和切线

![Unity_Tess_Error](Unity_Tess_Error.jpg)

### 重新计算法线和切线

商店里搜索 `Advance Tessellation Shader`
发现了 [Beast](https://assetstore.unity.com/packages/vfx/shaders/directx-11/beast-82066) 内部有现成的计算法线和切线的方法 
直接抄过来 插入置换之后
或者使用 [chengkehan博客](https://chengkehan.github.io/DisplacementMapping.html) 中的计算方法

此时 `SurfShader` 的问题已经基本解决
效果如下

![Tess_Surf](Tess_Surf.jpg)
![Tess_Surf_Wire](Tess_Surf_Wire.jpg)

### 片元着色器扩展

frag Shader 的扩展要更为复杂
置换和 Surface 一样
细分需要自己实现细节

```
	#pragma vertex tessvert
	#pragma fragment frag
	#pragma hull hs
	#pragma domain ds


	#include "Tessellation.cginc"
	#include "Lighting.cginc"

	float _Tess;
 
	struct InternalTessInterp_appdata {
		float4 vertex : INTERNALTESSPOS;
		float4 tangent : TANGENT;
		float3 normal : NORMAL;
		float2 texcoord : TEXCOORD0;
	};

	InternalTessInterp_appdata tessvert (appdata v) {
		InternalTessInterp_appdata o;
		o.vertex = v.vertex;
		o.tangent = v.tangent;
		o.normal = v.normal;
		o.texcoord = v.texcoord;
		return o;
	}

	float Tessellation(InternalTessInterp_appdata v){
		return _Tess;
	}

	float4 Tessellation(InternalTessInterp_appdata v, InternalTessInterp_appdata v1, InternalTessInterp_appdata v2){
		float minDist = 10.0;
		float maxDist = 150.0;
		return UnityDistanceBasedTess(v.vertex, v1.vertex, v2.vertex, minDist, maxDist, _Tess);
	}

	UnityTessellationFactors hsconst (InputPatch<InternalTessInterp_appdata,3> v) {
		UnityTessellationFactors o;
		float4 tf;
		tf = Tessellation( v[0], v[1], v[2] );
		o.edge[0] = tf.x; 
		o.edge[1] = tf.y; 
		o.edge[2] = tf.z; 
		o.inside = tf.w;
		return o;
	}

	[UNITY_domain("tri")]
	[UNITY_partitioning("fractional_odd")]
	[UNITY_outputtopology("triangle_cw")]
	[UNITY_patchconstantfunc("hsconst")]
	[UNITY_outputcontrolpoints(3)]
	InternalTessInterp_appdata hs (InputPatch<InternalTessInterp_appdata,3> v, uint id : SV_OutputControlPointID) {
		return v[id];
	}
 

	[UNITY_domain("tri")]
	v2f ds (UnityTessellationFactors tessFactors, 
			const OutputPatch<InternalTessInterp_appdata,3> vi, 
			float3 bary : SV_DomainLocation) {

		appdata v;

		v.vertex = vi[0].vertex*bary.x + vi[1].vertex*bary.y + vi[2].vertex*bary.z;
		v.tangent = vi[0].tangent*bary.x + vi[1].tangent*bary.y + vi[2].tangent*bary.z;
		v.normal = vi[0].normal*bary.x + vi[1].normal*bary.y + vi[2].normal*bary.z;
		v.texcoord = vi[0].texcoord*bary.x + vi[1].texcoord*bary.y + vi[2].texcoord*bary.z;
 
		v2f o = vert (v);
		 
		return o;
	}
```

### 最终效果对比

![Final_Tess](Final_Tess.jpg)
![Final_Tess_Wire](Final_Tess_Wire.jpg)


### 素材
[Organic 2](https://sketchfab.com/3d-models/organic-2-71dc67bf4c7f4d14a596edf92d31eca0)
[Stylized Organic Red](https://sketchfab.com/3d-models/stylized-organic-red-a188289568e6491aaf8dddb10dbb1677?ref=related)
[Stylized Lava Material Blue](https://sketchfab.com/3d-models/stylized-lava-material-blue-a3799d3d111243cd9c30f25f5616f6c3)