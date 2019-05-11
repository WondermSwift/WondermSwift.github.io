title: 使用UGUI制作不定尺寸可拖拽格子背包
date: 2015-09-23 02:37:22
categories: Unity
tags: Unity
description: 
---

使用UGUI制作一个物品尺寸不定的背包,要求可通过拖拽或者方向键移动物品位置
<!--more-->
效果如下:
![图片](Unity-MultipleSizePackage-record.gif)
![图片](Unity-MultipleSizePackage-record2.gif)


核心代码如下：
``` csharp
using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

public class Grid : MonoBehaviour
{

	public int width = 75;
	public int height = 75;


	public  int line = 15;
	public  int row = 7;

	public bool[,] GridPos;

	public int freeX = -1;
	public int freeY = -1;
	[Range (0, 1)]
	public float range = 1;
	[HideInInspector]
	public Item curSelect = null;
	public Canvas canvas;
	List<Item> itemList = new List<Item> ();

	void Awake ()
	{

		GridPos = new bool[line, row];
		for (int i = 0; i < line; i++) {
			for (int j = 0; j < row; j++) {
				GridPos [i, j] = false;
			}
		}
 
	}

	void Update ()
	{
		if (curSelect != null) {
			if (Input.GetKeyDown (KeyCode.UpArrow)) {
				MoveItem (curSelect.posX - 1, curSelect.posY, curSelect);
			}
			if (Input.GetKeyDown (KeyCode.DownArrow)) {
				MoveItem (curSelect.posX + 1, curSelect.posY, curSelect);
			}
			if (Input.GetKeyDown (KeyCode.LeftArrow)) {
				MoveItem (curSelect.posX, curSelect.posY - 1, curSelect);
			}
			if (Input.GetKeyDown (KeyCode.RightArrow)) {
				MoveItem (curSelect.posX, curSelect.posY + 1, curSelect);
			}
		}
	}

	public void  AddItem (Item item)
	{
		UIEventListener.Get (item.obj).onClick = OnSelected;
		UIEventListener.Get (item.obj).onDragBegin = OnDragBegin;
		UIEventListener.Get (item.obj).onDrag = OnDrag;
		UIEventListener.Get (item.obj).onDragEnd = OnDragEnd;
		itemList.Add (item);
		if (GetFree (item)) {
			Debug.Log ("--" + freeX + "," + freeY);
			OccupyPos (freeX, freeY, item);
			SetPos (freeX, freeY, item);
		} else {
			Debug.LogError ("no free pos");
		}
		SeeGrid ();
	}

	public  bool GetFree (Item item)
	{
		for (int i = 0; i < line; i++) {
			for (int j = 0; j < row; j++) {
 
				if (GridPos [i, j])
					continue;

				if (CheckFree (i, j, item)) {

					freeX = i;
					freeY = j;
					return true;
				}
			}
		}
		return false;
	}

	public bool CheckFree (int x, int y, Item item)
	{

		if (x + item.X > line || y + item.Y > row || x < 0 || y < 0) {
			return false;
		}
 
		for (int i = 0; i < item.X; i++) {
			for (int j = 0; j < item.Y; j++) {
				 
				if (GridPos [x + i, y + j])
					return false;
			}
		}
		return true;
	}

	public void SetPos (int x, int y, Item item)
	{
		Vector3 pos = new Vector3 (y * width, -x * height, 0f) + new Vector3 (item.Y * height / 2, -item.X * width / 2, 0f);
		item.obj.transform.localPosition = pos;
		item.obj.GetComponent<RectTransform> ().sizeDelta = new Vector2 (item.Y * width, item.X * height);
		SeeGrid ();
	}

	public void FreePos (int x, int y, Item item)
	{
		if (x < 0 || y < 0 || x + item.X > line || y + item.Y > row)
			return;
		for (int i = 0; i < item.X; i++) {
			for (int j = 0; j < item.Y; j++) {
				GridPos [x + i, y + j] = false;
			}
		}
	}

	public void OccupyPos (int x, int y, Item item)
	{
		FreePos (item.posX, item.posY, item);
		item.posX = x;
		item.posY = y;
		for (int i = 0; i < item.X; i++) {
			for (int j = 0; j < item.Y; j++) {
				GridPos [x + i, y + j] = true;
			}
		}
	}

	void MoveItem (int x, int y, Item item)
	{
		FreePos (item.posX, item.posY, item);
		if (CheckFree (x, y, item)) {
			OccupyPos (x, y, item);
			SetPos (x, y, item);
		} else {
			OccupyPos (item.posX, item.posY, item);
			SetPos (item.posX, item.posY, item);
		}
	}
 
	Vector3 offset = Vector3.zero;

	void OnDragBegin (GameObject go)
	{		 
		Item item = GetItem (go);
		FreePos (item.posX, item.posY, item);
			offset = Input.mousePosition - go.transform.position;
	}

	void OnDrag (GameObject go)
	{
		Vector3 pos = go.transform.position;
		pos = Input.mousePosition - offset;
			
		pos.z = 0;
		go.transform.position = pos;
	}

	void OnDragEnd (GameObject go)
	{
 
		int posY = (int)(go.transform.localPosition.x / width);
		int posX = -(int)(go.transform.localPosition.y / height);
		Item item = GetItem (go);
		MoveItem (posX, posY, item);
	}

	void OnSelected (GameObject go)
	{
		if (curSelect != null)
			curSelect.obj.GetComponent<Image> ().color = Color.white;
		go.GetComponent<Image> ().color = Color.gray;
		curSelect = GetItem (go);
	}
}

```
```csharp
using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

public class Package : MonoBehaviour
{

	public GameObject prefab;
	public Grid grid;

	public List<GameObject> itemList = new List<GameObject> ();

	void Start ()
	{
		AddItem (2, 1, "1");
		AddItem (1, 1, "2");
		AddItem (2, 1, "3");
		AddItem (2, 2, "4");
		AddItem (2, 2, "5");
		AddItem (2, 2, "6");
		AddItem (1, 1, "7");

 
	}

	 
	public static GameObject AddChild (GameObject parent, GameObject prefab)
	{
		GameObject temp = Instantiate (prefab) as GameObject;
		temp.transform.SetParent (parent.transform);
		temp.transform.localPosition = Vector3.zero;
		temp.transform.localScale = Vector3.one;
		return temp;
	}

	void AddItem (int x, int y, string spr)
	{
		GameObject gb = AddChild (grid.gameObject, prefab);
		itemList.Add (gb);
		Item item = new Item ();
		item.X = x;
		item.Y = y;
		item.obj = gb;
		item.obj.name = "item_"+spr;
		Image img = item.obj.GetComponent<Image> ();
		img.sprite = Resources.Load<Sprite> ("Sprites/" + spr);
		grid.AddItem (item);

	}
}

```

 