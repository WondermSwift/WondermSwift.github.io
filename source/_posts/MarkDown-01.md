title: MarkDown
date: 2015-06-13 18:36:22
categories: MarkDown
tags: MarkDown
description: 这篇文章用于MarkDown语法测试

---
<a name="md-anchor-head" id="md-anchor-head"></a>

#这是标题h1
##这是标题h2
###这是标题h3
####这是标题h4
#####这是标题h5
######这是标题h6
这是文本内容p

>区块引用 Blockquotes

* 无序列表
+ 无序列表
- 无序列表

1. 有序列表
2. 有序列表
3. 有序列表

这是代码`function()`

```
下面是代码区域
#include<stdio.h>
int main()
{
	printf("hello world\n");
	return 0;
}
```

这是_倾斜字体_
这是**加粗字体**

这是[链接](http://example.com/ "Title")示例

这是图片 
![图片](http://c.hiphotos.baidu.com/baike/c0%3Dbaike180%2C5%2C5%2C180%2C60/sign=d997317c11ce36d3b6098b625b9a51e2/00e93901213fb80ef9ceac7132d12f2eb938947d.jpg)

图片2
<center>
 <img src="http://c.hiphotos.baidu.com/baike/c0%3Dbaike180%2C5%2C5%2C180%2C60/sign=d997317c11ce36d3b6098b625b9a51e2/00e93901213fb80ef9ceac7132d12f2eb938947d.jpg" width=60% height=60%  >
</center>
附加说明和网址
{% codeblock _.compact http://underscorejs.org/#compact Underscore.js %}
_.compact([0, 1, false, 2, '', 3]);
=> [1, 2, 3]
{% endcodeblock %}

引用书上的句子

{% blockquote David Levithan, Wide Awake %}
Do not just seek happiness for yourself. Seek happiness for all. Through kindness. Through mercy.
{% endblockquote %}

文章内部跳转
跳转至 [头部](#md-anchor-head)
插入html  SVG

{% raw %}
<!DOCTYPE javascript>
<html>
 
<body>
	<svg  height="190">
		<polygon points="100,10 40,180 190,60 10,60 160,180"
		style="fill:red;stroke:blue;stroke-width:3;fill-rule:evenodd;" />
	</svg>
</body>
</html>
{% endraw %}

插入html  音乐播放器 

{% raw %}
<!DOCTYPE html> 
<iframe 
frameborder="no" 
border="0" 
marginwidth="0" 
marginheight="0" 
width=330 
height=86 
src="http://music.163.com/outchain/player?type=2&id=29713754&auto=0&height=66">
</iframe>

{% endraw %}

<a href="wonderm-swift@hotmail.com" title="wonderm-swift@hotmail.com">wonderm-swift@hotmail.com</a>
 


 插入音乐播放器 

{% raw %}
<!DOCTYPE html> 
<iframe 
frameborder="no" 
border="0" 
marginwidth="0" 
marginheight="0" 
width=500 
height=86 
src="/Tools/Music/index.html?id=0">
</iframe>

{% endraw %}

Markdown表格测试 (表格首行与文字之间必须留有空行)

| Tables        | Are           | Cool  |
|---------------| :-----------: | ----: |
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |


|  时间 	|  新增男孩  	|   新增女孩 	|   累计		|
| :---: | :------: 	| :-------: | :-------: |			
| 	1   | 	0.5 	| 	0.5 	|	1:1		|
| 	2   | 	0.5   	|   0.5 	|	1:1		|
| 	3 	| 	0.5   	|   0.5 	|	1:1		|
| 	N   |	0.5		|	0.5		|	1:1		|

