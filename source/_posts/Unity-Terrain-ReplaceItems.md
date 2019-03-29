---
title: Unity季节切换实现总结 
date: 2016-12-05 21:49:26
categories:
- Unity
tags:
- Unity
- Terrain
---
在运行时替换地形贴图、树木和花草，用于季节变化，天气变化等效果
<!--more-->
最近策划想要实现季节变化，晴朗和雨天的变化，大致研究了一下，目前实现地形和模型的贴图切换，角色本身具有变装，不在这个系统的考虑范围内。

季节的变化需要体现在很多方面，场景中的模型建筑，植被，地面，角色衣着等。


一、方案选择

 1. 只求效果的话可采取两套贴图，通过切换Alpha即可实现切换，但是内存占用以及Unity地形贴图的限制，以及PS4的弱鸡性能，要求尽可能消耗少的方案

 2. 使用SubstanceDesigner通过程序化在运行时动态生成，此方案比较优秀，可快速生成大量素材且参数可控，生成过程为异步，不会造成游戏卡钝，但是对于美术要求较高，公司美术目前还不能高效使用，所以目前只是作为程序辅助工具使用，来生成一部分贴图，

 3. 美术绘制多套贴图，程序在运行时动态切换对应的贴图或材质，足够灵活性能有把握，目前项目采用此方案

二、建筑模型

由于当前项目重写了StandardShader所以可以很方便的在shader中添加额外贴图和控制参数，对外暴露参数通过`Shader.SetGlobalXXX()`系列方法来全局传参实现切换

三、地形

地形切换需要分别切换地面贴图、树木、花草,运行时通过代码分别替换以下内容

`terrain.terrainData.splatPrototypes`
`terrainData.treePrototypes`
`terrainData.detailPrototypes`

替换完成后调用` terrain.Flush()`即可实现切换。

四、效果

SubstanceDesigner动态切换效果
![]()

地形季节切换工具
![](Unity-Terrain-PaintSwitcher.jpg)
 




