title: Unity调用摄像头显示并保存图像
date: 2015-08-01 00:01:50
categories: Unity
tags: Unity
description:
---
将摄像头的内容绘制场景中,并保存为图片

<!--more-->
```csharp
using System.IO;
using UnityEngine;
using System.Collections;

public class webCameraTex : MonoBehaviour
{

 	//设备名称	
	public string deviceName;
	//摄像头
	WebCamTexture webCam;
	//保存路径
	string path = "/Users/Wonderm/Desktop/" + "test.png";

	void Start ()
	{
		StartCoroutine (ShowWebCam ());
	}

	//展示摄像头内容
	IEnumerator  ShowWebCam ()
	{
		
		if (Application.HasUserAuthorization (UserAuthorization.WebCam)) {
			WebCamDevice[] devices = WebCamTexture.devices;
			deviceName = devices [0].name;
			webCam = new WebCamTexture (deviceName);
			Material material   = GetComponent<Renderer> ().material;
			material.mainTexture = webCam;
			yield return new WaitForEndOfFrame ();
			webCam.Play ();

		}
	}

	//保存为图片
	void SaveWebCam ()
	{

		Texture2D tempTex = new Texture2D (webCam.width, webCam.height, TextureFormat.ARGB32, false);
		Color32[] data = new Color32[tempTex.width * tempTex.height];
		tempTex.SetPixels32 (webCam.GetPixels32 (data));
		byte[] imagebytes = tempTex.EncodeToPNG ();
		FileStream cache = new FileStream (path, FileMode.Create);
		cache.Write (imagebytes, 0, imagebytes.Length);
		cache.Close ();  
		
		File.WriteAllBytes (path, imagebytes);
	}
	 
	

	void OnGUI ()
	{
		if (GUILayout.Button ("Save")) {
			SaveWebCam ();
		}
	}

}
```