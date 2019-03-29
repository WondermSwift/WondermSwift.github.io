title: C#解析CSV映射实体类列表
date: 2015-09-27 18:07:11
categories: C#
tags: C#
description:
---

解析excel表格作为配置数据，excel解析太复杂，xml字段冗余太多，对于特殊符号的支持也不是很好，json并不适合表格数据，可读性太差。
决定选用CSV，以文本方式读取，自己写代码解析
<!--more-->
### 基本思路

1. 以流的形式读取CSV文本
2. 将流解析为二维字符串数组
3. 反射为实体类的列表

### 读取

之所以要以流的方式读取，并把这一块拆分出来，是为了方便以后文本加密，不用修改其他地方，具体的代码就不用贴了

### 解析为数组

将流先按行切割，分割符为'\r'，Mac OS X下为'\r'，win下据说是'\n'没试，暂且预处理写上，待验证
使用正则表达式，将每一行切为N个column，表达式如下:

```csharp
Regex (@"
        # Parse CVS line. Capture next value in named group: 'val'
        \s*                      # Ignore leading whitespace.
        (?:                      # Group of value alternatives.
          ""                     # Either a double quoted string,
          (?<val>                # Capture contents between quotes.
            [^""]*(""""[^""]*)*  # Zero or more non-quotes, allowing 
          )                      # doubled "" quotes within string.
          ""\s*                  # Ignore whitespace following quote.
        |  (?<val>[^,]*)         # Or... zero or more non-commas.
        )                        # End value alternatives group.
        (?:,|$)                  # Match end is comma or EOS. "
			, RegexOptions.Multiline | RegexOptions.IgnorePatternWhitespace);
```

切完之后会多出来许多空字符串，判一下空移除掉即可
**注意：由于此处移除空字符串，所以要求表格中不能存在空字符串，否则会错位**

切完之后存进二维数组即可

### 映射实体类

依据之前的方法[[C#中Attribute的学习和使用]](../../../../../2015/09/24/CSharp-Attribute-01)二维字符串解析为数据类，核心代码如下：

```csharp
 	///数组分割线
    private static char[] spliteArry = { '|' };

 static List<T> Parse<T>(List<List<string>> lines)
        {
            Type objType = typeof(T);
            List<T> result = new List<T>(); 

            string[] header = lines[0].ToArray();
 
            for (int i = 1; i < lines.Count; i++)
            {
                T item = (T)System.Activator.CreateInstance(typeof(T));
                PropertyInfo[] propInfos = objType.GetProperties();
                for (int j = 0; j < lines[i].Count; j++)
                {
                    string column = lines[i][j];
                    foreach (PropertyInfo info in propInfos)
                    {
                        DBAttribute oo = info.GetCustomAttributes(true)[0] as DBAttribute;
                        if (header[j].Equals(oo.rowName))
                        {
                            SetValue(info, item, column);
                            break;
                        } 
                    }
			 			
				
                }
                result.Add(item);
            }
		 
            return result;
			 
        }

  static T SetValue<T>(PropertyInfo info, T instance, string data)
        {
            object obj = null;
            string[] strArr;
            strArr = data.Split(spliteArry);

            if (info.PropertyType == typeof(string))
            {
                obj = data;
            }
            else if (info.PropertyType == typeof(int))
            {
                obj = int.Parse(data);
            }
            else if (info.PropertyType == typeof(float))
            {
                obj = float.Parse(data);
            }
            else if (info.PropertyType == typeof(string[]))
            {
                obj = strArr;
            }
            else if (info.PropertyType == typeof(int[]))
            {
                List<int> intList = new List<int>(); 
                for (int i = 0; i < strArr.Length; i++)
                {
                    intList.Add(int.Parse(strArr[i]));
                }
                obj = intList.ToArray();
            }
            else if (info.PropertyType == typeof(float[]))
            {
                List<float> floatList = new List<float>(); 
                for (int i = 0; i < strArr.Length; i++)
                {
                    floatList.Add(float.Parse(strArr[i]));
                }
                obj = floatList.ToArray();

            }
            else
            {
                string error_1 = (instance.GetType().GetCustomAttributes(true)[0] as DBAttribute).tablePath;
                string error_2 = (info.GetCustomAttributes(true)[0] as DBAttribute).rowName;
                Debug.LogError("type error in table [" + error_1 + "] in row [" + error_2 + "]");
            }
            info.SetValue(instance, obj, null);
            return instance;
        }
```
使用'|'作为数组的分隔符，所以不允许数组元素表格中存在非分割符的竖线，暂时没遇到冲突，等到遇到了再额外处理

### 调用方式

至此，已将CSV解析为实体类，调用方法如下：
```csharp
 List<FinalRam> list = DBMngr.LoadData<FinalRam> ();
```
已通过测试无误






