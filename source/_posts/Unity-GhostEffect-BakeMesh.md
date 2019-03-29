---
title: Unity残影制作 
date: 2016-11-04 23:49:44
categories:
- Unity
tags:
- Unity
- Shader
---

今天有个需求制作残影效果，要求能够实时生成残影，残影Shader很容易撸出来，实时获取并生成Mesh通过查询API得到`SkinnedMeshRenderer.BakeMesh`,可以在运行时生成Mesh快照，写好测试运行成功。

<!--more-->

在动画上K好事件进行测试时，发现Mesh快照居然全是T-Pos的，直接调用是OK的，只有动画事件触发的是T-Pos，经同事提醒想到了动画事件的更新时机问题，于是收到动画事件等待到LateUpdate中再`BakeMesh`，发现没有问题了。

诡异的是，在写博客时，我又写了测试例子，这一次通过动画调用事件的残影也是OK的。公司用的版本是5.3.4，测试用的是5.4.2，Bug原因不明待测。

和同事交流，听闻之前的游戏中角色的胖瘦会发生变化，也是通过此方法更新Mesh实现的。

### 效果图
![效果](Unity_BakeMesh_GhostEffect.png)

### 残影Shader
```
Shader "Wonderm/Ghost" {
	Properties{
	  _MainTex("Texture", 2D) = "white" {}
	  _BumpMap("Bumpmap", 2D) = "bump" {}
	  _RimColor("Rim Color", Color) = (0.46,0.0,1.0,0.0)
	  _RimPower("Rim Power", Range(0.2,2.0)) = 0.5
	  _Brightness("Brightness",Range(0.0,3.0)) = 1.0
	}
		SubShader{
		  Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "IgnoreProjector" = "True"}

		  // extra pass that renders to depth buffer only
		   Pass {
			  ZWrite On
			  ColorMask 0
			 }

			CGPROGRAM
			#pragma surface surf Lambert alpha noambient nolightmap nodirlightmap  novertexlights
			struct Input {
				float2 uv_MainTex;
				float2 uv_BumpMap;
				float3 viewDir;
			};
			sampler2D _MainTex;
			sampler2D _BumpMap;
			float4 _RimColor;
			float _RimPower;
			float _Brightness;

			void surf(Input IN, inout SurfaceOutput o) {
			  half4 basecol = tex2D(_MainTex, IN.uv_MainTex);
				  half3 graycol = dot(basecol.rgb,float3(0.3,0.59,0.11));
				o.Albedo = graycol;
				o.Normal = UnpackNormal(tex2D(_BumpMap, IN.uv_BumpMap));
				half rim = 1.0 - saturate(dot(normalize(IN.viewDir), o.Normal));
				o.Emission = _RimColor.rgb * pow(rim, _RimPower) * _Brightness;
				o.Alpha = (o.Emission.r + o.Emission.g + o.Emission.b) / 3.0;
			}
			ENDCG
	  }
		  Fallback "Diffuse"
}
```


### 代码
```csharp
 public static void ShowGhost(SkinnedMeshRenderer render, Color color, Vector3 pos, Quaternion rot, float fadeOutTime)
    {
        if (fadeOutTime == 0 || render == null) return;

        var ghostMat = new Material(Shader.Find("Wonderm/Ghost"));
        ghostMat.SetColor("_RimColor", color);

        var newMesh = new Mesh();
        render.BakeMesh(newMesh);

        var newMats = new Material[render.sharedMaterials.Length];
        for (int i = 0; i < newMats.Length; i++) { newMats[i] = ghostMat; }

        var obj = new GameObject("Ghost");
        obj.transform.position = pos;
        obj.transform.rotation = rot;

        var newFilter = obj.AddComponent<MeshFilter>();
        newFilter.sharedMesh = newMesh;

        var newRender = obj.AddComponent<MeshRenderer>();
        newRender.sharedMaterials = newMats;
        newRender.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        newRender.receiveShadows = false;
        /*
        	此处添加淡出代码
        */
        if (fadeOutTime > 0)
            GameObject.Destroy(obj, fadeOutTime);
    }
```
 