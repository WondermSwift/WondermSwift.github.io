title: Unity发布WP8遇到的坑
date: 2015-06-30 10:24:36
categories: Unity
tags:  
- Unity
- WindowsPhone
description: 总结发布WP8时遇到的各种坑
---


<!--more-->

# 1. 程序进入后台字体释放

目前项目用的NGUI的为3.0.2，版本较低，在发布后出现程序进入后台再切回来动态字体全部消失的问题，据说新版本修正了这个Bug，百度了一下有人遇到过且完美解决，于是抄了一下。
原文链接[unity ngui wp8上使用动态字体消失或碎片化的问题](http://blog.csdn.net/chrisfxs/article/details/44102993)
在`UIWidget`中加入以下代码即可:
```
#if !UNITY_EDITOR    
/// <summary>    
/// Mark the UI as changed when returning from paused state.    
/// </summary>       
void OnApplicationPause (bool paused) { if (!paused) MarkAsChanged(); }    
#endif    
```

# 2. Unity与WP通信

WP与Unity的通讯时一个坑,只能通过WP去找Unity的方法,而Unity无法获取到WP的方法。
根据Unity[官方文档的方法](http://docs.unity3d.com/Manual/wp8-unity-interaction.html),总是报空指针，也就是说在WP里无法直接去取到Unity场景中的GameObject(这里比较诡异的是，文档底部给出的参考工程却可以取到,我只能猜测是Unity版本不一致的问题)。
最终采取的方法是在Unity里构建一个用于管理WP的SDK的单例类,提供委托函数,由WP来注册,在此又造成了一个新的坑**只有在主线程中才可以操控UI**,不管是Unity中的UGUI、NGUI还是WP自己的UI，此时需要将代码注入主线程中执行,方式如下:
```
  Dispatcher.BeginInvoke(() =>
            {
                //此处添加需要的代码
            });
```

具体SDK的接入:[WP8接入爱应用SDK](../../../../../2015/06/30/Unity-wp8-SDK-aiYingYong)
 

# 3. Build报错问题

WP最大的坑就是Unity中跑的好好的在Build的时候报了一堆`方法在目标平台不存在`的问题。经过查阅资料,发现WP平台在Build是使用的.NET API for Windows Phone,并不像其他平台一样使用的Mono，找到问题所在便开始修复。虽然报错信息量很大,但基本原因都是方法缺失，对照API修改方法即可,但改一个错误往往就能少几十行,所以过程并不复杂，只是耗费时间比较多。
API参考:<a href="https://msdn.microsoft.com/en-us/library/windows/apps/jj207211(v=vs.105).aspx"> .NET API for Windows Phone</a>

目前遇到的以下问题:
* Timer类缺少方法
* Socket类缺少方法
* sqlite无解,改为excel转xml
* 流光shader中的Flash方法不支持
* File.GetFiles方法缺失
















