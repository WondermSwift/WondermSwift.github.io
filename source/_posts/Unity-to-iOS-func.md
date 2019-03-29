title: Unity与iOS交互
date: 2015-03-17 01:14:29
categories: Unity
tags: Unity
description:
---

<!--more-->
一、Unity调用iOS的方法

1.首先创建Unity工程

![image](Unity-to-iOS-func_iOSUnity_Creat.png)
2.编写Unity脚本，挂在Canvas对象上，导出Unity工程
```
public Button button;

[DllImport("__Internal")]
private static extern void PressButton ();

void Start ()
	{
		text.text = "Start";
		button.onClick.AddListener (delegate() {
			clickBtn(button.gameObject);		
		});
	}

	void clickBtn (GameObject gb)
	{
		print ("click btn");
		PressButton ();
	}
```

3.编写iOS代码

MyView.h
```
#import <Foundation/Foundation.h>

@interface MyView : UIViewController


@end
```
MyView.m
```c
#import "MyView.h"

@implementation MyView

void PressButton()
{
    UIAlertView *alert = [[UIAlertView alloc] init];
    [alert setTitle:@"MySDK"];
    [alert setMessage:@"点击了按钮"];
    [alert addButtonWithTitle:@"确定"];
    [alert  show];
    [alert release];
}

@end
```

4.运行效果
![图片](Unity-to-iOS-func_run.png)

二、iOS调用Unity方法
1.编写Unity代码
```c
public Text text;

public void Press ()
{
	text.text = "Press";
}

public void Up ()
{
	text.text = "Up";
}
```

2.编写iOS代码
在MyView.m中
```
- (void)viewDidLoad {
    [super viewDidLoad];
    
    //创建按钮
    UIButton *button0 = [UIButton buttonWithType:1];
    //设置按钮范围
    button0.frame = CGRectMake(0, 40, 100, 30);
    //设置按钮显示内容
    [button0 setTitle:@"Click" forState:UIControlStateNormal];
    button0.backgroundColor = [UIColor whiteColor];
    //设置按钮改变后 绑定响应方法
    [button0 addTarget:self action:@selector(BtnPressed) forControlEvents:UIControlEventTouchDown];
    [button0 addTarget:self action:@selector(BtnUp) forControlEvents:UIControlEventTouchUpInside];
    
    [self.view addSubview:button0 ];
}

-(void)BtnPressed{
    UnitySendMessage("Canvas","Press","");
}

-(void)BtnUp{
    UnitySendMessage("Canvas","Up","");
}
```



在UnityAppController.mm中
```c
#import "MyView.h"

- (void)startUnity:(UIApplication*)application
{
	UnityInitApplicationGraphics();

	// we make sure that first level gets correct display list and orientation
	[[DisplayManager Instance] updateDisplayListInUnity];
	[self updateOrientationFromController:[SplashScreenController Instance]];

	UnityLoadApplication();
	Profiler_InitProfiler();

	[self showGameUI];
	[self createDisplayLink];

	UnitySetPlayerFocus(1);
    
    MyView * myView = [[MyView alloc] init];
    [UnityGetGLViewController().view addSubview:myView.view];
}
```



3.运行效果

![图片](Unity-to-iOS-func_run_2.png)

4.通过Unity打开ios浏览器

UnityC#
```
    void openUrl ()
    {
        print ("OpenUrl");
        OpenUrl ("http://wondermblog.sinaapp.com/");
    }
    
    [DllImport("__Internal")]
    private static extern void OpenUrl (string url);
```
 

Xcode  object-C
```
void OpenUrl(char *url)
{
NSString *str = [NSString stringWithUTF8String:url];
[[UIApplication sharedApplication] openURL:[NSURL URLWithString: str]];
}
```



 