---
title: 全息地图
date: 2019-06-09 23:17:09
categories: 
	- Shader

tags: 
	- Shader 
	- HUD 

description: 
---
尝试了下全息地图的制作

<!--more-->
`HUD_Compass_3d`

在知乎上看到了一篇 [动态全息地图](https://zhuanlan.zhihu.com/p/67458879) 的文章
作者用的虚幻，思考了一下似乎并没有技术难度，也就不用去看蓝图了

之前在 [Artstation](https://www.artstation.com/artwork/NbVrJ) 上收藏过一个这样的效果图, 作为参考目标

### 效果预览
参考目标
![Refrence](Refrence.gif)

实现效果
![Final](Final.jpg)
![Final_1](Final_1.jpg)
![HUD_3D_Compass](HUD_3D_Compass.gif)
![HUD_3D_Compass_Move](HUD_3D_Compass_Move.gif)

### 效果分析

全息地图的实现类似于模型切片
对于动态的场景则选取高度图作为切片依据
效果的关键在于实现高度分层
基本步骤：
1. 添加俯视正交相机，获取高度图
2. 解析高度图转化为高度
3. 绘制依据层高采样高度图进行Alpha裁剪
4. 复制层进行Y轴偏移

### 基本实现

![Test](TestTexMap.jpg)

准备好测试用的素材


#### 分层 Shader

我希望在 Shader 中通过多 Pass 来实现偏移，场景中只用到一个 Quad
所以把代码写在 cginc 中，通过在每个 Pass 中定义偏移数值来实现分层


HUD_Building.cginc
```c

v2f vert(appdata v)
{
	v2f o;

	o.uv = v.uv;

	float scale = pow(0.5, _Scale) / MAXLAYER;

	float3 pos = v.vertex.xyz + v.normal * _OFFSET * scale  ;
	o.vertex = UnityObjectToClipPos(float4(pos, 1.0));
	o.uv_HeightTex = TRANSFORM_TEX(v.uv, _HeightTex);
	return o;
}

fixed4 frag(v2f i) : SV_Target
{
	float4 col =   _Color;
	float4 map = tex2D(_HeightTex, uv);

	float scale = pow(0.5, _Scale) / MAXLAYER;
	float curHight = _OFFSET * scale;

	float h = map.r > curHight;
	col.a = _Color.a* dis* h ;

	return col;
}

```

复制 Pass 修改偏移数值 
我这里用了20层，具体层数的选取根据场景建筑的效果来调整

```c
CGINCLUDE
		#define MAXLAYER 20
		ENDCG

		Pass{
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			#define _OFFSET 1
			#include "HUD_Building.cginc"
			ENDCG
		}

		Pass{
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			#define _OFFSET 2
			#include "HUD_Building.cginc"
			ENDCG
		}

		//重复上面的操作

```

看下效果

![MultiLayer](MultiLayer.jpg)

加上测试用的高度图看下

![TestTex](TestTex.jpg)

Shader 部分已经没有问题 

#### 场景模型

到 Sketchfab 下载一个方块城市的场景
[City of Future](https://sketchfab.com/3d-models/city-of-future-eb65cc45885d40adbd4d1eb95dda8981)

![City](City.jpg)



#### 获取高度图

在相机上挂载脚本，获取到高度图，传到全局变量中


HeightMapCamCtr.cs
```csharp
 private void Init()
{
        var cam = GetComponent<Camera>();
        cam.orthographic = true;
        cam.renderingPath = RenderingPath.Forward;

        cam.depth = -99;
        cam.depthTextureMode = DepthTextureMode.Depth;

        if(rt == null){
            rt = new RenderTexture(TexSize, TexSize, 16, RenderTextureFormat.Depth, RenderTextureReadWrite.Linear);
            rt.name = "Wonderm_TopDownDepth";
        }
        cam.targetTexture = rt;
 
        Shader.SetGlobalTexture("_HeightTex", rt);
}
```

查看下高度图
![RenderTexture](RenderTexture.jpg)
![HeightTex](HeightTex.jpg)
 
将各部分组合，调整参数达到好的显示效果

采样高度图
![BaseHeightMap](BaseHeightMap.jpg)

添加分层
![TestLayer](TestLayer.jpg)

调整间距
![HeightOffset_NoOutline](HeightOffset_NoOutline.jpg)

糊的一匹 ， 直接眩晕了要
调了半天都没解决，查看参考图
作者是加了描边来增强轮廓感，避免模糊

#### 添加描边

描边这里粗暴的进行纹理偏移采样
只要上下左右有一个像素是不透明的并且当前像素不透明
将 Alpha 改为当前的两倍

添加描边
![EdgeOutline](EdgeOutline.jpg)

添加分层
![HeightOffset](HeightOffset.jpg)

调整间距
![HeightOffset_Outline](HeightOffset_Outline.jpg)

形状在加了描边之后很鲜明

#### 优化效果

按照原图，制作一些装饰用的小物件
三棱锥用来标记
LineRenderer 分级连线
添加几个导航圆环
添加距离遮罩 让地图在边缘淡出

![Tips](Tips.jpg)


### 参考资料

[Unreal-TrickTech_动态全息地图](https://zhuanlan.zhihu.com/p/67458879)
[3D Futuristic Map](https://www.artstation.com/artwork/NbVrJ)
[City of Future](https://sketchfab.com/3d-models/city-of-future-eb65cc45885d40adbd4d1eb95dda8981)