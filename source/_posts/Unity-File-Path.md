title: Unity中相对路径和绝对路径
date: 2015-06-28 15:01:14
categories: Unity
tags: 
- Unity
description: File,Directory,XML,AssetDataBase等方法读取文件的路径问题
---
* `File.Exists()`方法,相对路径和绝对路径都可以
```
if(File.Exists("Assets/PopList.zip")){
	Debug.Log ("File 相对");
}
if(File.Exists(Application.dataPath+"/PopList.zip")){
	Debug.Log ("File 绝对");
}
```

* `Directory.Exists()`方法,相对路径和绝对路径都可以
```
if(Directory.Exists("Assets/Test")){
	Debug.Log ("Directory 相对");
}
if(Directory.Exists(Application.dataPath+"/Test")){
	Debug.Log ("Directory 绝对");
}
```
* `XmlDocument.Save()`方法,相对路径和绝对路径都可以
```
XmlDocument xml = new XmlDocument ();
xml.Save ("Assets/Test/xml_1");
xml.Save (Application.dataPath+"/Test/xml_2");
```
* `AssetDatabase.LoadAssetAtPath()`方法,只能读取相对路径
```
Texture texture  = AssetDatabase.LoadAssetAtPath("Assets/Textures/texture.jpg",typeof(Texture)) as Texture;
```
