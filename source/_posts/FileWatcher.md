---
title: FileWatcher
date: 2017-01-05 23:01:12
categories: 
	- CSharp
tags: 
	- File
	- Watcher
description:
---

最近玩[Wallpaper Engine](http://store.steampowered.com/app/431960/)停不下来，同事用Unity撸壁纸玩，需要监听配置文件修改，于是顺带学习了一下 

<!--more-->

```csharp
  public void StartWatch(string path, string filter, FileSystemEventHandler onChange)
    {
        if (watcher == null)
        {
            watcher = new FileSystemWatcher();
        }

        watcher.Path = path;
        watcher.Filter = filter;

        watcher.Changed += onChange;
        watcher.Deleted += onChange;
        watcher.Created += onChange;

        watcher.NotifyFilter = NotifyFilters.LastAccess | NotifyFilters.LastWrite;

        watcher.EnableRaisingEvents = true;
    }
```