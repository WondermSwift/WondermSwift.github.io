title: Unity动态加载外部Dll进行逻辑更新
date: 2015-07-25 14:56:06
categories: 
	- Unity
tags: 
	- Unity
description:
---

在PC端和安卓端,会有逻辑热更新的需求(此文不适用iOS),会选择将游戏逻辑打包在DLL里
只需要在必要时更新下载新的dll,覆盖旧的,加载新的代码执行即可
此方法已经过实际验证,并应用于上线的安卓项目中
<!--more-->

- - -
基本原理如下:

#一、 加载外部程序集

1. 利用反射动态加载外部程序集
	```csharp
	Assembly assembly = Assembly.LoadFile (dll_Path);
	```

	通过下面代码查看验证加载结果,打印出程序集中的所有类
	```csharp
	System.Type[] types = assembly.GetExportedTypes();
		for(int i=0;i<types.Length;i++){
			Debug.Log(types[i].Name);
		}
	```

2. 获取程序集中的类型
	通过`AddComponent(type)`方法将脚本挂在GameObject上即可
	```csharp
	System.Type type = assembly.GetType (className);
	gameObject.AddComponent(type);
	```

3. 完整脚本如下:
	```csharp
	public class GetExtendsDll : MonoBehaviour
	{

		private  static Assembly assembly;
		private string dll_Path ="xxx";
		private string dll_Path_Loacal ="xxx";


		public static LocalResourceManager GetInstance ()
		{
			return instance;
		}

		public void Awake ()
		{
			#if UNITY_EDITOR
			assembly = Assembly.LoadFile (dll_Path);
			#elif UNITY_ANDROID
			assembly = Assembly.LoadFile (dll_Path_Loacal);
			#endif

			System.Type[] types = assembly.GetExportedTypes();
			for(int i=0;i<types.Length;i++){
				Debug.Log(types[i].Name);
			}
		}

		/// <summary>
		/// 给物体上挂在脚本.
		/// </summary>
		/// <param name="gb">游戏物体.</param>
		/// <param name="className">类名.</param>
		public void AddComponent (GameObject gb , string className)
		{
			System.Type type = assembly.GetType (className);
       	 	if (type == null) {
				Debug.Log("className  "+className +" not exist");
       	 	}
       	 	else if (gb != null && gb.GetComponent (type) == null) 
        	{
				gb.AddComponent (type);
			}
		}
         
	}
	```

#二、 GameObject绑定
 
1. 场景中有大量游戏对象需要关联到脚本组件上,我们和、构建的类需要提供以下功能

	- 提供方法挂载需要的组件,要求可挂载多个组建
	- 提供基础类型字段: int float string bool GameObject 等
	- 提供静态方法,方便被挂载的脚本对象获取到上述字段

2. 完整脚本如下:	

```csharp
	public class AddCompnt : MonoBehaviour
	{

		public string[] className;
		public int[] defaultIntVale;
		public float[] defaultFloatVale;
		public string[] defaultStrVale;
		public bool[] defaultBoolValue;
		public GameObject[] defaultGameObject;

		void Awake(){

			if (className == null || className.Length <= 0) {
				return;
			}
 
			for (int i = 0; i < className.Length; i++) {
				GetExtendsDll.GetInstance ().AddComponentToResource (className[i], gameObject);
			}
		}

		/// <summary>
		/// 通过索引获取数据
		/// </summary>
		public T GetDefaultGB<T>(int index){
    
			if (defaultGameObject == null || defaultGameObject.Length <= 0) {
				GLogger.Log ("get gameobject fail: the defaultGameObject is null");
				return default(T);
			}
			if (index < 0 || index >= defaultGameObject.Length) {
				GLogger.Log ("get gameobject fail: IndexOutOfRangeException index error  " + index);
				return default(T);
			}
			if (defaultGameObject [index] == null) {
				GLogger.Log ("get gameobject fail: the index gameobject is null  " + index);
				return default(T);
			}
			
			Type type = typeof(T);
			if (type.Name == "GameObject") {
				return (T)Convert.ChangeType(defaultGameObject[index],type);
			}
			return (T)Convert.ChangeType(defaultGameObject[index].GetComponent(type),type);
		}
	}

```


#三、 组件获取数据

组件从`AddCompnt`组件中获取自己所需要的数据

	```csharp
	public class SimpleTest : MonoBehaviour {

		public int 			intData;
		public float 		floatData;
		public string 		stringData;
		public bool 		booltData;
		public GameObject 	gbData;
		void Start(){
			Init();
		}

		void Init(){
			GetCommponent src = gameObject.GetComponent<GetCommponent> ();
			intData 	= src.defaultIntVale[0];
			floatData 	= src.defaultFloatVale[0];
			stringData 	= src.defaultStrVale[0];
			booltData 	= src.defaultBoolValue[0];
			gbData 		= src.GetDefaultGB<GameObject>(0);
		}
	}
	```

#四、 场景编辑

建立外部Dll工程,加入所需脚本,编译得到DLL,在`GetExtendsDll.cs`配置Dll路径
接下来只需要将	`AddCompnt.cs`挂在对象上,拖拽和设置初始数据即可
