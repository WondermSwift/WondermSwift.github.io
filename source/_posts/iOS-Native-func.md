title: iOS中调用系统功能
date: 2015-03-23 22:33:55
categories: iOS
tags: iOS
description:
---

iphone调用系统电话、浏览器、地图、邮件等

<!--more-->
openURL的使用方法：
```
[[UIApplication sharedApplication] openURL:[NSURL URLWithString:appString]];
```
其中系统的appString有：
1. Map http://maps.google.com/maps?q=Shanghai
2. Email mailto://myname@google.com
3. Tel tel://10086
4. Msg sms://10086

openURL能帮助你运行Maps，SMS，Browser,Phone甚至其他的应用程序。这是iPhone开发中经常需要用到的一段代码，它仅仅只有一行而已。
```
//打开地图
– (IBAction)openMaps {
NSString *addressText = @"beijing"; 
//@"1Infinite Loop, Cupertino, CA 95014";
addressText =[addressText stringByAddingPercentEscapesUsingEncoding:NSASCIIStringEncoding];
NSString*urlText = [NSString stringWithFormat:
@"http://maps.google.com/maps?q=%@",addressText];
NSLog(@"urlText=============== %@", urlText);
[[UIApplication sharedApplication] openURL:[NSURL URLWithString:urlText]];
}
//打开mail
– (IBAction)openEmail {
[[UIApplication sharedApplication]openURL:[NSURL URLWithString:@"mailto://devprograms@apple.com"]];
}
//拨打电话
– (IBAction)openPhone {
[[UIApplication sharedApplication] openURL:[NSURLURLWithString:@"tel://8004664411"]];
}
//打开短信
– (IBAction)openSms {
[[UIApplication sharedApplication] openURL:[NSURLURLWithString:@"sms://466453"]];
}
//打开浏览器
-(IBAction)openBrowser {
[[UIApplication sharedApplication] openURL:[NSURLURLWithString:@"http://itunesconnect.apple.com"]];
}
```