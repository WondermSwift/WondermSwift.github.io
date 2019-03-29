title: C#中Attribute的学习和使用
date: 2015-09-24 22:32:58
categories: C#
tags: C#
description:

---

有时我们需要给某些类或者属性以及方法添加描述，使得开发更加方便
例如：

1. 常见的序列化、编译指令等
2. 把一个Excel的表反射到一个实体类中，属性和表头一一对应
3. 开发Unity编辑器扩展时常用到的`[MenuItem("Assets/XXX")]`

此时我们需要给方法或者属性打上标签，在程序运行时查看这些标签，很容易扩展出方便的功能	
<!--more-->
### Attribute的介绍

>参考下面的链接：
	[http://www.cnblogs.com/luckdv/articles/1682488.html](http://www.cnblogs.com/luckdv/articles/1682488.html "C# 特性(Attribute) 详细介绍")
	[http://www.cnblogs.com/rohelm/archive/2012/04/19/2456088.html](http://www.cnblogs.com/rohelm/archive/2012/04/19/2456088.html "C#特性详解")
	[https://msdn.microsoft.com/en-us/library/system.attribute.aspx](https://msdn.microsoft.com/en-us/library/system.attribute.aspx "MSDN")

### 使用自定义Attribute
* 属性类是从 `System.Attribute` 派生，至少有一个公共构造函数
* `AttributeUsage`用于指定该特性的使用范围，参数可以是定位参数、未命名参数或命名参数
* 特性可以对于同一实体多次指定
* 特性的属性也可以通过反射来获取

定义一个数据表的简单特性类
```csharp
	/// <summary>
	/// 此类用于数据表格数据类的特性
	/// 仅可用于类和属性
	/// </summary>
	[AttributeUsage (AttributeTargets.Class | AttributeTargets.Property , AllowMultiple = false)]
	public sealed class DBReader : Attribute
	{
		/// <summary>
		/// 表名
		/// </summary>
		public string tableName;
		/// <summary>
		/// 表头
		/// </summary>
		public string rowName;
		public DBReader (){
			
		}
		public DBReader (string _tableName){
			this.tableName = _tableName;
		}
	}
```
使用定义的特性标记目标数据类
```csharp
	[DBReader (tableName = "Data")]
	public class TestData
	{
		
		[DBReader (rowName = "yyy")]
		public int y{ get; set; }

		[DBReader (rowName = "XXX")]
		public int x{ get; set; }

	}
```
通过反射获取添加的标记
```csharp
	/// <summary>
	/// 反射查找类和属性的标记
	/// </summary>
	/// <typeparam name="T">The 1st type parameter.</typeparam>
public static void ShowAttributes<T> ()
	{
		Type objType = typeof(T);
		object[] objs = objType.GetCustomAttributes (true);

		DBReader db = objs [0] as DBReader;
		Debug.Log (objType.Name + ":" + db.tableName);

		foreach (PropertyInfo propInfo in objType.GetProperties()) {
			
			object[] objAttrs = propInfo.GetCustomAttributes (typeof(DBReader), true);
			DBReader oo = objAttrs [0] as DBReader;

			Debug.Log (propInfo.Name + "(" + propInfo.ToString () + "):" + oo.rowName);
		}
	}
```
输出结果
> TestData:Data
y(System.Int32 y):yyy
x(System.Int32 x):XXX

通过反射来赋值
```csharp
	/// <summary>
	/// 通过反射赋值
	/// </summary>
	/// <returns>The data.</returns>
	/// <typeparam name="T">The 1st type parameter.</typeparam>
	public static T SetData<T> ()
	{
		T result = (T)System.Activator.CreateInstance (typeof(T));
		object[] objs = result.GetType ().GetCustomAttributes (true);
		DBReader db = objs [0] as DBReader;
		 

		foreach (PropertyInfo propInfo in result.GetType().GetProperties()) {
			object[] objAttrs = propInfo.GetCustomAttributes (typeof(DBReader), true);
			DBReader oo = objAttrs [0] as DBReader;

			if (oo.rowName == "XXX") {
				propInfo.SetValue (result, 100, null);
			}

			if (oo.rowName == "yyy") {
				propInfo.SetValue (result, 111, null);
			}
		}
		return result;
	}

	Debug.Log (data.x);
	Debug.Log (data.y);
```
输出结果
> 
100
111

### 扩展

通过对数据类的标记，将数据表的名字和表头的名字标记出来
通过反射来实例化数据对象，即可通过一个数据类对应一张表的方式和策划愉快合作
增删字段改表的名字代码可拥有最小的改动量





