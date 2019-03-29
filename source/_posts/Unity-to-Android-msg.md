title: Unity与安卓交互
date: 2015-03-24 22:51:38
categories: 
- Unity
tags:
- Unity
- Android
description:
---


一、安卓调用Unity方法

Unity 代码
第一种
```
using (AndroidJavaClass jc = new AndroidJavaClass("com.unity3d.player.UnityPlayer")){
	using (AndroidJavaObject jo = jc.GetStatic("currentActivity"))
	{
		jo.Call(apiName,args);
	}	
}
```
<!--more-->

第二种
```
using (AndroidJavaClass cls = new AndroidJavaClass("com.unity3d.player.UnityPlayer")) {
	cls.CallStatic (apiName, args);
}
```
Android代码，添加在UnityPlayerNativeActivity.java中
```
public void openUrl(String url){
	Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse(url));
	intent.addCategory(Intent.CATEGORY_BROWSABLE);
	intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
	startActivity(intent);
}
```
二、安卓调用Unity方法
```
UnityPlayer.UnitySendMessage(gameObjectName,apiName, args);
```