title: Unity自定义编辑器
date: 2015-05-11 00:52:09
categories: Unity
tags: Unity
description:
---


必须继承 `EditorWindow` 类，添加初始化窗口函数作为入口
```
public static BuildTargetEditor window;
static void MyWindows ()
{
	window = (BuildTargetEditor)EditorWindow.GetWindowWithRect (typeof(BuildTargetEditor), new Rect (0, 0, 880, 510), true);
	window.title = "编辑器";
}
```

<!--more-->

在菜单栏添加菜单
在菜单栏添加`Tools/MyTool` 路径菜单，快捷键为`Alt+1`
```
[MenuItem ("Tools/MyTool &1")]
```
 

绘制界面方法
```cpp
 // 布局
void OnGUI ()
{
	GUILayout.Space (12f);
	GUILayout.BeginHorizontal ();
	GUILayout.EndHorizontal ();
}
```
2.分割线
```cpp
//绘制分割线
public static void VSeparator ()
{

	GUILayout.Space (12f);

	if (Event.current.type == EventType.Repaint) {
		Texture2D tex = EditorGUIUtility.whiteTexture;
		Rect rect = GUILayoutUtility.GetLastRect ();
		GUI.color = new Color (0f, 0f, 0f, 0.25f);
		GUI.DrawTexture (new Rect (0f, rect.yMin + 6f, Screen.width, 4f), tex);
		GUI.DrawTexture (new Rect (0f, rect.yMin + 6f, Screen.width, 1f), tex);
		GUI.DrawTexture (new Rect (0f, rect.yMin + 9f, Screen.width, 1f), tex);
		GUI.color = Color.white;
	}
}

public static void HSeparator ()
{
	GUILayout.Space (12f);
	if (Event.current.type == EventType.Repaint) {
		Texture2D tex = EditorGUIUtility.whiteTexture;
		Rect rect = GUILayoutUtility.GetLastRect ();
		GUI.color = new Color (0f, 0f, 0f, 0.25f);
		GUI.DrawTexture (new Rect (rect.xMin + 6f, 0f, 1f, Screen.height), tex);
		GUI.DrawTexture (new Rect (rect.xMin + 6f, 0f, 4f, Screen.height), tex);
		GUI.DrawTexture (new Rect (rect.xMin + 9f, 0f, 1f, Screen.height), tex);
		GUI.color = Color.white;
	}
}
```
3.基本UI
```
GUILayout.Label (“标签”, GUILayout.Width (240));

GUI.Button (new Rect (4f, Screen.height – 48, 120, 42), “按钮”)

GUILayout.Toggle (isOn,nameStringArry[], “选项”,GUILayout.Width(232)

GUILayout.Toolbar (intSelected,stringitem[]);

GUILayout.Box (Resources.LoadAssetAtPath<Texture> (iCO_List [index]) as Texture, GUILayout.Width (100), GUILayout.Height (100));

GUILayout.Space (100);

GUILayout.BeginHorizontal ();
GUILayout.EndHorizontal ();
```
效果图如下
![图片](unity_editor_custom.png)

 