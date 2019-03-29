title: Unity 截屏的两种方式
date: 2015-10-23 20:15:59
categories: Unity
tags: Unity
description:
---
截屏本来就是很简单的问题，然后今天似乎时运不济，延时的方式各种崩溃，不延时的方式只能截取UI，最后发现居然是景深和抗锯齿的脚本在后面搞鬼，真是醉了
<!--more-->

### 一、注意问题

如果你的相机上挂有抗锯齿（`Antialiasing`）和景深（`DepthOfField`）之类的屏幕后期脚本，在截图时注意先关闭，我今天遇到的问题时，如果打开景深，截图就会是半透明的，打开抗锯齿就只能截取到UI，至于具体原因，先码后补，源码还没看呢...

### 二、延时方法

```csharp
public IEnumerator GetCapture(Vector2 startPos, Vector2 size)
	{
		int width = (int)size.x;
		int height = (int)size.y;
		yield return new WaitForEndOfFrame();
		Debug.LogError(Camera.allCamerasCount);
		Texture2D tex = new Texture2D(Screen.width, Screen.height, TextureFormat.ARGB32, false);
		tex.ReadPixels(new Rect(0, 0, Screen.width, Screen.height), 0,0,true);
		tex.Apply();
	}
```
### 三、不延时方式

```csharp
public Texture2D Screenshot()
	{
		Camera camera = Camera.main;
		
		camera.targetTexture = new RenderTexture(Screen.width, Screen.height, 32);
		Texture2D image = RTImage(camera);
		camera.targetTexture = null;
		return image;
	}
	
Texture2D RTImage(Camera cam)
	{
		RenderTexture currentRT = RenderTexture.active;
		RenderTexture.active = cam.targetTexture;
		cam.Render();
		Texture2D image = new Texture2D(cam.targetTexture.width, cam.targetTexture.height, TextureFormat.ARGB32, false);
		image.ReadPixels(new Rect(0, 0, cam.targetTexture.width, cam.targetTexture.height), 0, 0);
		image.Apply();
		RenderTexture.active = currentRT;
		return image;
	}
```
