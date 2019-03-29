title: Unity编辑器枚举类型扩展
date: 2016-03-20 02:50:47
categories: Unity
tags: Unity
description:
---
在查看Unity的ImporSetting时，发现Unity有好多显示在面板上的枚举类型中含有特殊字符，显示文字和变量名不同等等问题，想到扩展Unity的序列化属性绘制
<!--more-->

### `PropertyDrawer` 方法扩展

`PropertyDrawer` 是 `Unity` 提供的用于绘制序列化字段的方式

1. 继承 `PropertyDrawer`
2. 属性标记 `[CustomPropertyDrawer (typeof (PropertyAttribute))]`
3. 重写 `OnGUI` 方法

实现代码如下:

```
[CustomPropertyDrawer (typeof(EnumLabel))]
public class  EnumLabelDrawer : PropertyDrawer
{

	public override void OnGUI (Rect position, SerializedProperty property, GUIContent label)
	{
		 
		var type = property.serializedObject.targetObject.GetType ();
		var attr = attribute as EnumLabel;
		if (attr != null && attr.label.Length > 0) {
			label.text = attr.label;
		}
		var field = type.GetField (property.name);
		if (field.FieldType.IsEnum) {
			property.enumValueIndex = EditorGuiLayout.EnumPopupInt (position, field.FieldType, label.text, property.enumValueIndex);
		}

	}

}
```

### 枚举类型定义和使用

属性提供隐藏，标记，分组三个功能，没有标记的使用 `Unity` 默认绘制

示例代码：

```
public enum MyEnum
	{
		Test_1,
		[EnumLabel ("No.2")]
		Test_2,,
		[EnumLabel ("_Hide")]
		Test_3,
		[EnumLabel ("Group/No.4")]
		Test_4,
		[EnumLabel ("Group/No.5")]
		Test_5,
	}

	public MyEnum noAttr = MyEnum.Test_1;

	[EnumLabel ()]
	public MyEnum noLabel = MyEnum.Test_1;

	[EnumLabel ("Editor_2")]
	public MyEnum withLabel = MyEnum.Test_1;
```

示例效果:
![EnumLabel_1](EnumLabel_1.jpg)
![EnumLabel_2](EnumLabel_2.jpg)
![EnumLabel_3](EnumLabel_3.png)
 