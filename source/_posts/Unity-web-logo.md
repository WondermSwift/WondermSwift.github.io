title: Unity发布Web版本自定义Logo界面
date: 2015-03-23 01:02:02
categories: Unity
tags: Unity
description: 自定义Web版本加载进度条样式
---

<!--more-->
发布Web版本，会生成WebTest工程  ，文件如下
 
![图片](Unity_web_logo_proj.png)

运行效果如下

![图片](Unity_web_logo_run.png)

同代码编辑器打开WebTest.html，代码作用如下

![图片](Unity_web_logo_html_01.png)

![图片](Unity_web_logo_html_02.png)

须注意的是，loading界面的背景，进度条，进度条背景都必须为png格式图片，进度条的位置会被置于背景图正下方，若是背景图大于屏幕尺寸，会导致进度条不显示。

 