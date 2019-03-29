title: C#复制文件夹
date: 2015-05-05 23:13:13
categories: C#
tags:
	- C#
description: 复制文件夹及里面的文件
---


<!--more-->
```
private static void CopyFolder (string from, string to)
{
	if (!Directory.Exists (to))
		Directory.CreateDirectory (to);

	// 子文件夹
	foreach (string sub in Directory.GetDirectories(from)){
		CopyFolder (sub , to + Path.GetFileName (sub)+"/" );
	}

	// 文件
	foreach (string file in Directory.GetFiles(from)){
		File.Copy (file, to +"/"+ Path.GetFileName (file), true);
	}
}
```