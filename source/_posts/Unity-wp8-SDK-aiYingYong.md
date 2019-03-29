title: Unity爱应用SDK接入
date: 2015-06-30 17:34:53
categories: Unity
tags:
- Unity
- WindowsPhone
- SDK
description: Unity发布WP平台接入爱应用SDK
---

<!--more-->
## 1. 环境准备
 Win8x64以上PC一台,内存4G以上,需要支持CPU虚拟化
 VS2013以上,我使用的VS2015RC
 爱应用SDK

## 2. 下载解压爱应用SDK,找到对应平台的支付和登录SDK
登录:`51Wp.AccountSdk.dll`
支付:`51Wp.PaymentSdk.dll`
![](Wp8-SDK-aiYingYong.png)

## 3. 编写SDK管理脚本`WpPlatform.cs`
```
using UnityEngine;
using System.Collections;

public class WpPlatform   {

public static WpPlatform instance = new  WpPlatform();

#region 登录
//登录委托
public delegate void CallBack ();
public CallBack initLogin;
public void GgotoAYYLogin(){
if(initLogin != null){
initLogin();
}
}

//登录回调
public delegate void  CallBackStr(string gameId,string supplyId);
public CallBackStr logincallBack;
public void LoginResult(bool isSucc,string userName,string userId){
if(logincallBack != null && isSucc){
logincallBack(userName,userId);
}
}
#endregion

#region 支付
//开启支付
public delegate void GoTopay( string playerId,string goodsId,string goodsName,int count,string unitPrice,string finalPrice);
public GoTopay goToPay;
public void GotoAYYPay(string playerId,string goodsId,string goodsName,int count,string unitPrice,string finalPrice){
if(goToPay != null){
goToPay(playerId,goodsId,goodsName,count,unitPrice,finalPrice);
}
}

//支付结果回调
public delegate void PayCallBack(bool isSucc);
public PayCallBack payCallBack;
public void PayResult(bool isSucc,string orderId,string goodsId,string goodsName,string goodsPrice,string PlayerId,string msg){
if(payCallBack != null){
payCallBack(isSucc);
}
}
#endregion 
}
```

## 4. 编写游戏内逻辑脚本,将登录结果和支付结果的回调注册进去。

## 5. 构建WP工程,使用Win8以上的Win电脑VS2013以上打开工程,添加对SDK的引用。

## 6. 打开`WMAppManifest.xml`
. 应用程序UI---配置iCO、应用名称、图块资源
. 功能---分别添加`ID_CAP_IDENTITY_USER`、`ID_CAP_MEDIALIB_PHOTO`、`ID_CAP_WEBBROWSERCOMPONENT`三个功能
. 打包---此时并不修改AppID,待应用上传后商店会再次签名生成AppID,之后再复制商店的AppID填入

## 7. 打开`MainPage.xaml`添加`LayerRoot` 
```
<Grid x:Name="LayoutRoot">
<!--LayoutRoot is the root grid where all page content is placed-->
<DrawingSurfaceBackgroundGrid x:Name="DrawingSurfaceBackground" Loaded="DrawingSurfaceBackground_Loaded">
</DrawingSurfaceBackgroundGrid>
</Grid>
```
![](Wp8-SDK-aiYingYong-mainPage.png)

## 8. 打开`AppXaml.cs`在`App`的构造函数结尾添加SDK初始化方法
```
//初始化新峰支付
Payment.Initialize(SDKConfig.SupplyId, SDKConfig.GameId, Xapcn.PaymentSdk.Common.LanguageType.ZH, RootFrame);
```

## 9. 打开`MainPage.xaml.cs`,添加SDK业务逻辑
```
//SDK 配置
public static class SDKConfig{
//游戏ID
public static string GameId = "xxx";
//厂商ID
public static string SupplyId = "xxx";
//支付回调地址
public static string PayURL = "xxx";
}

#region sdk接入
//次方法为WP中Unity入口
private void Unity_Loaded(){
SetupGeolocator();
try{
long result =
(long)DeviceExtendedProperties.GetValue("ApplicationWorkingSetLimit");
UnityEngine.Debug.Log(result);
}
catch (ArgumentOutOfRangeException){
}
wpp = WpPlatform.GetInstance();
wpp.initLogin = InitSDK;
wpp.goToPay = GoToPay;
InitSDK();
}

void InitSDK(){
Dispatcher.BeginInvoke(() =>{
//此处初始化登录
Account.AccountInit(SDKConfig.GameId, SDKConfig.SupplyId, LayoutRoot, this, true);
//此处注册登录结果回调事件
Account.LoginStateCallback += Account_LoginStateCallback;
//此处注册登录框被用户手动关闭事件
Account.LoginCloseCallback += Account_LoginCloseCallback;
});
}

void Account_LoginCloseCallback(){
//   MessageBox.Show("登入未完成，用户手动关闭了登入框");
UnityEngine.Application.Quit();
}

/// <summary>
/// 登入结果返回事件.
/// </summary>
/// <param name="loginState">State of the login.</param>
void Account_LoginStateCallback(_51Wp.AccountSdk.Net.Datas.LoginStateData loginState){
if (loginState.ReturnCode == "0"){
//此处增加防伪造登录校验
string strUrl = "http://www.51wp.com/winphone/index.php?s=/oauth2/checkAccount&uid={0}&datetime={1}&uniqueid={2}";
var token = loginState.Token;
var times = loginState.LoginTime;
var uid = loginState.UserId;
string urlPath = string.Format(strUrl, new string[] { uid, times, token });
var client = new WebClient();
client.DownloadStringAsync(new Uri(urlPath, UriKind.Absolute));
client.DownloadStringCompleted += (ss, ee) =>{
if (ee.Error == null){
if (ee.Result.ToString() == "0")//0为正常登录，非0为伪造登录{
//   MessageBox.Show("登录成功，玩家信息：username=" + loginState.UserName + ",userId=" + loginState.UserId);
String aa = loginState.UserName;
String bb = loginState.UserId;
WpPlatform.GetInstance().LoginResult(true, aa, bb);
}
else{
//    MessageBox.Show("登录失败，为伪造登录！");
WpPlatform.GetInstance().LoginResult(false, "", "");
}
}
};

}
else{
WpPlatform.GetInstance().LoginResult(false, "", "");
}
}

private void GoToPay(string playerId, string goodsId, string goodsName, int count, string unitPrice, string finalPrice){
string ss = ("\n" + goodsId + "\n" + goodsName + "\n" + count + unitPrice + "\n" + finalPrice + "\n");
UnityEngine.Debug.Log(ss);
Dispatcher.BeginInvoke(() =>{
//用户类型  强制注册用户
PaymentType PlayerType = PaymentType.RegistedUser;
//此处选择浏览器类型，对于部分消耗资源较大的游戏建议使用PayBehaviorType.OutIEPay外置浏览器
PayBehaviorType WebType = PayBehaviorType.WebPayCentre;
this.IsEnabled = false;
Payment.CreateOrder(PlayerType, playerId, goodsId, goodsName, count, double.Parse(unitPrice), double.Parse(finalPrice), SDKConfig.PayURL);
try{
//开始支付
Payment.Pay(WebType,
(er, code) =>{
//处理商品的发送逻辑
//只有当errorCode=0时为支付成功，否则为支付失败
if (code.Result.ErrorCode == 0){
wpp.payCallBack(true);
UnityEngine.Debug.Log("订单号: " + code.Result.OrderId + "\r\n商品编号: " + code.Result.GoodsId + "\r\n商品名称: " + code.Result.GoodsName + "\r\n商品价格: " + code.Result.GoodsPrice + "\r\n玩家帐号: " + code.Result.PlayerId + "\r\n游戏唯一编号: " + code.Result.GameId + " \r\n订单状态：支付成功，可以发放道具商品了");
//    MessageBox.Show("订单号: " + code.Result.OrderId + "\r\n商品编号: " + code.Result.GoodsId + "\r\n商品名称: " + code.Result.GoodsName + "\r\n商品价格: " + code.Result.GoodsPrice + "\r\n玩家帐号: " + code.Result.PlayerId + "\r\n游戏唯一编号: " + code.Result.GameId + " \r\n订单状态：支付成功，可以发放道具商品了", "支付成功", MessageBoxButton.OK);
}
else{
wpp.payCallBack(false);
UnityEngine.Debug.Log("订单号: " + code.Result.OrderId + "\r\n商品编号: " + code.Result.GoodsId + "\r\n商品名称: " + code.Result.GoodsName + "\r\n商品价格: " + code.Result.GoodsPrice + "\r\n玩家帐号: " + code.Result.PlayerId + "\r\n游戏唯一编号: " + code.Result.GameId + " \r\n订单状态：支付失败");
}
GC.Collect();//释放资源
});
this.IsEnabled = true;
}
catch (Exception ex){
Dispatcher.BeginInvoke(() =>{
this.IsEnabled = true;
MessageBox.Show(ex.Message);
UnityEngine.Debug.Log(ex.Message);
wpp.payCallBack(false);
});
}
});

}
#endregion
```
## 10. 接入手机直接Run就行了,前提是手机为开发机。
如需要部署XAP文件,则使用VS2015配套的`Windows Phone Application Deployment 8.1`选择安装包,点击部署即可.
![](Wp8-Deploy.png)
如果手机未开启开发者模式,打开VS2015配套的`Windows Phone Developer Registration 8.1`输入开发者账号，点击解锁等待一下即可。
![](Wp8-Dev-Registe.png)
需要注意的是,即使是开发者也只能在开发机上同时部署10个开发者应用(使用爱应用安装的破解软件也属于开发者应用),超过卸载多余的软件即可继续部署。
- - - 
## 07-02添加新爱应用统计

添加对`XAPCNStatistics.dll`的引用
在`App.xaml.cs`的`Application_Launching`方法中添加如下方法,初始化爱应用统计
```
private void Application_Launching(object sender, LaunchingEventArgs e)
{
            XAPCNStatistics.InitStatistics init = new XAPCNStatistics.InitStatistics();
            init.Action(SDKConfig.GameId);
}
```
 