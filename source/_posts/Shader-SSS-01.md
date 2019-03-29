---
title: 皮肤材质(一)
date: 2017-07-06 23:00:52
categories: Shader
tags: 
 - Shader
 - Unity
 - Shader Forge
---

前段时间我所在的项目终于上线了 Steam , 修复了无数 Bug 之后 , 终于开始有时间进行画面效果优化了 , 本次优化主要针对三个方面 :屏幕特效 , 角色材质和天气系统

昨天开始进行角色材质效果优化 , 效果挺好的记录一下。

<!--more-->

### 皮肤次表面散射效果

角色 Shader 经历的多次修改 ：

1. Standard 最开始直接使用标准 Shader ，粗劣调了下参数，达到塑料感
2. Default_Standard 手抄了Unity的Standard Shader , 并修改了部分参数，添加Rimlignt , 更加橡胶 , 高光更强
3. Default_Standard__Actor 修改了大部分计算方法 , 加入透明度调节防止相机穿插 ，提高光照明暗对比 , 橡胶感变弱 
4. StandardDithering 使用 ShderForge 重构 Shader , 细部调节 ，半透明采用 AlphaClip 挖洞方式
5. StandardDithering_CustomActor 加入多通道 Mask , 允许玩家调节皮肤颜色、亮度、饱和度, 增强自定义功能
6. StandardDithering_CustomActor__3S 加入 FakeSSS 使得表现更通透 ，模拟皮肤的散射效果

最终没有使用真正的次表面散射 , 而是采用在论坛上看到的一个类似效果的 FakeShader ，插入之后效果提升明显,
效率高更容易理解就直接使用了, 修改了参数搭配游戏风格 , 由于需要PBR 效果 所以自定义光照被 Shader Forge 禁用了，但 Shader Forge 开放了 `Light Wrapping` 、 `Diffuse Ambient Light` 、 `Specular Ambient Light` 等参数 ，将原本的输入拆分成多个通道到对应参数即可达到一样的效果

参考源码

![Code](Shader-sss.png)


效果对比

![Show](Shader_3S_Test.jpg)


### 眼球高光、折射、反射

未完成...



### 游戏中效果
![Show](NM_Test.gif)
![Show](3S_Test.gif)

### 参考


[某大大实现的SSS大腿](http://www.element3ds.com/thread-97468-1-1.html?_dsign=99de245f)

[Unity论坛分享](https://forum.unity3d.com/threads/shader-forge-a-visual-node-based-shader-editor.222049/page-54)
 