title: SublimeText技巧
date: 2015-06-01 00:05:12
categories: SublimeText
tags: 
	- SublimeText
description:
---

设置快捷键格式化文本

选择“菜单栏”->“user-key-setting”
```
{“keys”: [“ctrl+i”], “command”: “reindent” , “args”: {“single_line”: false}}
```
<!--more-->

在资源管理目录忽略文件类型

选择“菜单栏”->“Settings – User”，在出现的文件中添加以下内容：
```
“file_exclude_patterns”: [“*.jpg”, “*.gif”,”*.png”]
```
