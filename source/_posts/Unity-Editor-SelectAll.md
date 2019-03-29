title: Unity获取当前场景中的所有GameObject
date: 2015-08-31 22:18:14
categories: Unity
tags: Unity
description:
---

Unity在某个版本之后加入了`Scene.GetRootGameObjects`来获取所有根节点，
所以文章不用看了

Unity2017 2018.3.4
<!--more-->

---
在使用Unity的过程中，经常会有获取场景中物体的需求
Unity提供了以下方法供我们使用：

1. `GameObject.Find`
2. `GameObject.FindWithTag`   
3. `Object.FindObjectOfType`
4. `Transform.Find`

虽然还有其他方法，但是在使用和功能上和这几种基本没有区别
其中 1、2、3都是只能获取到Active的物体，4只能获取Active物体的(Active/inActive)子物体
然而这些对于要开发编辑器插件的我们来说**并没有什么卵用**
<!--more-->
常见的需求是获取到场景中所有的物体

在各种搜索未果后，我企图获取`Hierarchy`的Root节点，依旧未果
在`Selection`中，是可以获取到所有选择到的对象的，Unity同时提供了`Editor/Select All`菜单
蛋疼的是这个`SelectAll`的方法是`private`的，类`SceneHierarchyWindow`是`internal`的
这能忍！！！想到之前代码更换`IconForObject`的原理于是果断反射搞起
和预想的一样，搞了反射之后，Unity的编辑器方法在你面前已经没有什么秘密了，随你**OOXX**

代码如下:
```
using System;
using System.Reflection;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

public class GetComp 
{

	[MenuItem ("My/GetComp")]
	static void GetComp ()
	{
		Assembly asm = Assembly.GetAssembly (typeof(UnityEditor.EditorWindow));

		Type publishingType = asm.GetType ("UnityEditor.SceneHierarchyWindow");
		MethodInfo rInfo = publishingType.GetMethod ("SelectAll", BindingFlags.NonPublic | BindingFlags.Instance);
		 
		ConstructorInfo t1Constructor = publishingType.GetConstructor (Type.EmptyTypes);
		System.Object oPubClass =  (System.Object)ScriptableObject.CreateInstance("SceneHierarchyWindow");
		 
 
		if (rInfo.Name == "SelectAll") {
			rInfo.Invoke (oPubClass, null);
		}

		UnityEngine.Object[] objs = Selection.objects;
		for (int i = 0; i < objs.Length; i++) {
			Debug.Log (objs [i].name);
		}
	}

}
```