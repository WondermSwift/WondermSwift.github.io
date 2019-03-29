---
title: 不同底色下显示不同内容的图片
date: 2017-08-09 22:05:14
categories: Shader
tags:
 - Shader
 - Math
---
前几天看到有人在群里发的图片,不同背景下显示内容不一样，了解了下原理，用Shader简单实现了一下
<!--more-->

如下图所示，黑色背景和白色背景显示的内容不一样
![PicBlend](PictureSwitchByBG.png)

原理非常简单

*	要求：两张图片
*	每个上下图层对应的通道内 且 每个上下图层对应像素内，亮图B的明度值都要大于暗图A
*	原理（每个通道、每个像素）：
*	要制作的图片为X ，X的蒙版(不透明度)为P，暗图为A，亮图为B
*	白底：X*P + 1*(1-P) = B
*	黑底：X*P + 0*(1-P) = A
*	简化：
*	X*P + 1-P = B ①
*	X*P = A ②
*	②-①得：
*	A-B = P-1，即：A-B+1 = P
*	得到了P，代入②
*	X = A/P

Shader实现
```cg
	float b =( bright.r + bright.g +bright.b )/3   ;
	float d =( dark.r + dark.g +dark.b )/3   ;
	float f = d - b + 1 + _Offset;
	 
	final.r = dark.r / f ;
	final.g = dark.g / f;
	final.b = dark.b / f ;
	final.a =  f ;
```

参考:
[制作不同底色下显示不同内容](https://tieba.baidu.com/p/4482067338)
