title: Unity判断网络连接状况和类型
date: 2015-03-16 01:38:36
categories: Unity
tags: Unity
description:
---

`NotReachable` 网络不可达
`ReachableViaCarrierDataNetwork` 网络通过运营商数据网络是可达的。
`ReachableViaLocalAreaNetwork` 网络通过WiFi或有线网络是可达的。

<!--more-->
```cpp
if(Application.internetReachability == NetworkReachability.NotReachable){
	Debug.LogError("网络不可用");
	return 0;
}else if(Application.internetReachability == NetworkReachability.ReachableViaCarrierDataNetwork) {
	Debug.LogError("网络net可用");
	return 1;
}else if(Application.internetReachability == NetworkReachability.ReachableViaLocalAreaNetwork) {
	Debug.LogError("网络wifi可用");
	return 2;
}else{
	return -1;
}
```