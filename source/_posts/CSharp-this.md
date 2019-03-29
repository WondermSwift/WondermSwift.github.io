title: C#动态向类添加方法
date: 2015-05-14 23:38:14
categories: C#
tags: C#
description:
---


 动态的向某个类添加静态函数
```
namespace ExtensionMethods
{
	public static class MyExtensions
	{
		public static int WordCount(this String str)
		{
			return str.Split(new char[] { ' ', '.', '?' }, StringSplitOptions.RemoveEmptyEntries).Length;
		}
	}
}
```
<!--more-->
这就是向String类中添加了一个静态函数叫WordCount
使用的时候
```
string s = "Hello Extension Methods";
int i = s.WordCount();
```