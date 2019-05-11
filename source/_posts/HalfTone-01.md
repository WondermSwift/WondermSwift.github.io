---
title: Halftone (半调)
date: 2019-05-11 20:50:52
categories: Shader
tags: 
- Shader 
- Image Effect 
description: 
---
今天在群里看到了一张图，似乎在知乎上看到过叫做半调，于是决定自己思考动手实践下
<!--more-->

### 参考效果

参考图

![Example](Example.png)

效果很常见，可以肯定是后期效果，[Return of the Obra Dinn](https://store.steampowered.com/app/653530/Return_of_the_Obra_Dinn/) 中也有用到，并且提供了非常特殊的美术效果，那么以还原为目标

### 最终效果

图片来自微博上购买的指环王主题明信片
一套八张 这是第一张, 作者 `Veronica Hsu` 
最后有曲阜图片

![输入](Pre.jpg)
![输出](Final.jpg)


### 制作思路

分析下基本处理流程

1. 像素化
2. 灰化->深度增强
3. 色阶分离
4. Dither->混合

基本都是做过的
翻出过去的代码拼凑一番就有效果了

### 实现步骤

#### 像素化

之前的代码 {% post_link Shader-Image-Effect-01 %}
半径为8

```
	float2 block = _MainTex_TexelSize.xy * _BlockSize;
	float2 uv = trunc(i.uv / block) * block;
```

![Pixel](Pixel.jpg)

#### 灰化
只是灰化效果不好
把三通道加起来求平均
然后平方增强对比

```
	float vall = (col.r + col.g + col.b) / 3;
	vall = pow(vall, 2);
```

![GrayScale](GrayScale.jpg)

#### 色阶分离

一般这里会使用一张 `LookupTex` 
这里由于还不知道什么样的范围比较合适
直接手写了, 按照参考图分三级
一波参数调节

```
	float step1 = step(_Step_1, vall);
	color = lerp(color, _Color_1, 1 - step1);
```

![Splite](Splite.jpg)

#### Dither

是时候祭出贝尔矩阵了 
{% post_link Unity-Shader-Dithering-Transparent %}
这次选取8x8的 ，可以看下不同细分的表现如何

```
	float2 uv2 = i.uv.xy / i.uv.w * _ScreenParams.xy;
	float dither = ClipByDither8x8(1, uv2/ scale);
	color = 1 - (1 - color)  * dither;;
```
![Dither](Dither.jpg)

#### Mask

为了风格化， 每个像素点的形状希望可以控制
加入 Mask 可以做一些拼接的效果
选择 `Default-Particle` 做个测试
由于希望圆形的尺寸一致直接x12

```
	float2 uv3 = uv2  / scale;
	fixed4 mask = tex2D(_MaskTex, uv3 );
	mask =  clamp( mask * 12 ,0,1);
	mask = lerp(1-dither, mask, mask >= 0);
	color =1-(1-color)* mask * dither;
```

![Mask](Mask.jpg)

#### 天空盒剔除

简单取下深度接近1的 输出白色

#### 效果

![Example_1_0](Example_1_0.jpg)
![Example_1_1](Example_1_1.jpg)
![Example_2_0](Example_2_0.jpg)
![Example_2_1](Example_2_1.jpg)
![Example_3_0](Example_3_0.jpg)
![Example_3_1](Example_3_1.jpg)
![Example_4_0](Example_4_0.jpg)
![Example_4_1](Example_4_1.jpg)

修改参数更换 Mask 可以产生不同的风格

### 原图

![Pic_01](Pic_01.jpg)
![Pic_02](Pic_02.jpg)
![Pic_03](Pic_03.jpg)
![Pic_04](Pic_04.jpg)
![Pic_05](Pic_05.jpg)
![Pic_06](Pic_06.jpg)
![Pic_07](Pic_07.jpg)
![Pic_08](Pic_08.jpg)