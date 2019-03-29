title: 在 OS X 上搭建局域网Git服务
date: 2016-03-06 04:49:32
categories: Git
tags: Git
description:
---
局域网多人协作，使用 `Git` 进行版本控制，服务搭建流程
<!--more-->

### 远程访问设置

![共享_1](Local_Git_Server_Share.png)
![共享_2](Local_Git_Server_Share_Setting.png)

### 建立本地仓库

  打开终端，依次输入如下指令
 1. 初始化仓库添加 `ReadMe`
 ```
 mkdir GitLib
 cd GitLib
 git init
 echo "ReadMe" >> README.md
 git add README.md
 ```
 2. 提交文件添加远端库 ( `URL`为共享地址，目录相对于`/user/` )
 ``` 
 git commit -m README.md
 git remote add origin ssh://192.168.0.101/～／GitLib／.git
 ```
 3. 推送到master分支 ( `Everything up-to-date` 说明成功 )
 ```
 git push origin master
 ```

### 访问远程仓库

1. 打开 `SourceTree` ，选择从 `URL` 克隆
![Clone](Local_Git_Server_Clone.png)
2. 输入远端仓库地址
![URL](Local_Git_Server_Clone_URL.png)
3. 此时推送会提示远端拒绝，在远端配置文件中加入下面内容即可
```
[receive]
	denyCurrentBranch = false
```
 