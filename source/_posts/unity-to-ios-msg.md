title: Unity调用iOS推送消息
date: 2015-03-27 22:34:27
categories: 
- Unity
tags:
- Unity
- iOS
description:

---
在Unity中调用iOS消息推送,所有代码在Unity中完成
所有代码在Unity内完成

```
public Text label;

void Start ()
{
	CleanNotification ();
}

//清空所有本地消息
void CleanNotification ()
{
	LocalNotification l = new LocalNotification ();
	l.applicationIconBadgeNumber = -1;
	NotificationServices.PresentLocalNotificationNow (l);
	NotificationServices.CancelAllLocalNotifications ();
	NotificationServices.ClearLocalNotifications ();
}

//本地推送 你可以传入一个固定的推送时间
public static void Push(string message,System.DateTime newDate,bool isRepeatDay)
{
	//推送时间需要大于当前时间
	if(newDate > System.DateTime.Now)
	{
		LocalNotification localNotification = new LocalNotification();
		localNotification.fireDate =newDate;
		localNotification.alertBody = message;
		localNotification.applicationIconBadgeNumber = 1;
		localNotification.hasAction = true;
		if(isRepeatDay)
		{
			//是否每天定期循环
			localNotification.repeatCalendar = CalendarIdentifier.ChineseCalendar;
			localNotification.repeatInterval = CalendarUnit.Day;
		}
		localNotification.soundName = LocalNotification.defaultSoundName;
		NotificationServices.ScheduleLocalNotification(localNotification);
	}
}

public void ClickPush(){
	label.text = "十秒钟后推送" ;
	Push("Wonderm :\t 十秒钟后推送",System.DateTime.Now.AddSeconds(10),false);

}
```
