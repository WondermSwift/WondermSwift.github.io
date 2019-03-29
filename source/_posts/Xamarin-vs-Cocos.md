title: Cocos Studio引起的Xamarin Studio闪退问题
date: 2015-07-09 17:09:30
categories: Software Compatible
tags:
description:
---

一直使用`Xamarin Studio`作为代码编辑器配合Unity做开发,之前有过一次`Xamarin Studio`无法打开,各种重装后无果，最后格盘重装系统才解决,今天同事偶然重现了。
查找了一下最后发现是`Cocos Studio`的问题，纪录一下。

<!--more-->
Bug重现方法为
1. 安装`Xamarin Studio`依赖包`
	MonoFramework-MRE-3.12.0.macos10.xamarin.x86.pkg`
2. 安装`Xamarin Studio`,任意版本,此时一切正常
3. 安装`CocosForMac`，任意版本，此时`Xamarin`打开情况下一切正常
4. 一旦关闭了`Xamarin`就再也打不开了,表现为无限闪退

经过尝试在重装了`MonoFramework-MRE-3.12.0.macos10.xamarin.x86.pkg`之后便可正常使用,于是再次安装`CocosForMac`
安装时查看包内容`Contents`->`Resources`->`Mono-MRE-For-CCS.pkg`,基本可以推断就是`Mono-MRE-For-CCS.pkg`覆盖了`MonoFramework-MRE-3.12.0.macos10.xamarin.x86.pkg`导致了这个问题,然而为什么`CocosForMac`需要`Mono`,暂时不得而知。
