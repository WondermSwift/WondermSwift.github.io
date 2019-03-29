title: Unity编辑器绘制错乱Bug修正
date: 2015-07-12 21:38:43
categories: Unity
tags: Unity
description:
---

之前用Unity自定义绘制编辑器时有时会出现界面错乱,需要关掉错乱界面重新编译编辑器代码,
我以为是实例化的对象未销毁的原因,今天白猫也遇到了,不错重现方式是改变窗口大小。同时白猫给出了解决方法,把下面脚本添加在Unity工程中的Editor目录下即可。
<!--more-->
![编辑器修正代码](Unity-Draw-Inspector.png)

 