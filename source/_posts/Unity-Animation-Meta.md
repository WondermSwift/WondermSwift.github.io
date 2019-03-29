title: Unity动画事件自动绑定
date: 2016-08-15 20:34:07
categories: Unity
tags: Unity
---
开发过程中，美术会经常性修改动作，不了解Unity的美术很容易覆盖掉已经添加好的事件
导致工作白做，于是写了个工具单独存储动画事件，自动绑定到动画文件上
<!--more-->

```csharp
#if UNITY_EDITOR
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

[CreateAssetMenu(fileName = "newAnimationEvent.asset", menuName = "Wonderm/Animation/AnimationEvent", order = 0)]
public class AnimationEvent : ScriptableObject
{
	[SerializeField]
	private Object fbxTarget;

	/// <summary>
	/// 动画列表
	/// </summary>
	public List<string> anims = new List<string>() { "None" };

	/// <summary>
	/// 参数列表
	/// </summary>
	[SerializeField]
	public List<string> parameters = new List<string>() { "None" };

	/// <summary>
	/// 方法列表
	/// </summary>
	public List<string> methods = new List<string>() { "None" };

	[SerializeField]
	public System.Collections.Generic.List<AnimClipEvent> _eventList = new System.Collections.Generic.List<AnimClipEvent>();

	public ModelImporterClipAnimation AssgnEvent(ModelImporterClipAnimation animation)
	{
		List<AnimClipEvent> events = _eventList.FindAll((ev) =>
			{
				return ev.name == animation.name;
			});
		if (events.Count < 1)
			return animation;
		System.Collections.Generic.List<UnityEngine.AnimationEvent> list = new System.Collections.Generic.List<UnityEngine.AnimationEvent>();

		for (int i = 0; i < events.Count; i++)
		{
			AnimClipEvent e = events[i];
			if (e.name == "None")
			{
				continue;
			}

			UnityEngine.AnimationEvent animEvent = new UnityEngine.AnimationEvent();
			animEvent.messageOptions = SendMessageOptions.RequireReceiver;
			animEvent.stringParameter = e.parameter;
			animEvent.functionName = e.FunctionName;
			animEvent.time = e.time;
			list.Add(animEvent);
		}

		animation.events = list.ToArray();
		return animation;
	}

	[System.Serializable]
	public class AnimClipEvent
	{
		public string name = "None";
		public float time;

		public string FunctionName = "None";

		public string parameter = "None";
	}
}
#endif
```


```csharp
#if UNITY_EDITOR
using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEditorInternal;
using UnityEngine;

[CustomEditor(typeof(AnimationEvent))]
public class AnimationEventInspector : Editor
{
	private Vector2 _scrollPos;

	private SerializedProperty fbxTarget;
	private SerializedProperty anims;
	private SerializedProperty parameters;
	private SerializedProperty methods;

	private ReorderableList animList;
	private ReorderableList parametersList;
	private ReorderableList methodList;

	private AnimationEvent ctr;

	private string[] toolBarMenu = new string[] { "动画", "方法", "参数" };
	private int toolBarSlect = 0;

	private void OnEnable()
	{
		
		ctr = target as AnimationEvent;

		fbxTarget = serializedObject.FindProperty("fbxTarget");
		parameters = serializedObject.FindProperty("parameters");
		methods = serializedObject.FindProperty("methods");
		anims = serializedObject.FindProperty("anims");

		animList = EditorGUIUtils.CreateOrderList(serializedObject, anims, "动画列表");
		parametersList = EditorGUIUtils.CreateOrderList(serializedObject, parameters, "参数列表");
		methodList = EditorGUIUtils.CreateOrderList(serializedObject, methods, "方法列表");
	}

	private bool CheckError()
	{
		if (ctr.anims.Count <= 0)
		{
			ctr.anims.Add("None");
			return true;
		}

		if (ctr.methods.Count <= 0)
		{
			ctr.methods.Add("None");
			return true;
		}

		if (ctr.parameters.Count <= 0)
		{
			ctr.parameters.Add("None");
			return true;
		}

		return false;
	}

	private System.Action actionCfg;

	public override void OnInspectorGUI()
	{
		if (CheckError())
		{
			return;
		}
		serializedObject.Update();

		EditorGUILayout.PropertyField(fbxTarget, new GUIContent("动画文件"));

		if (fbxTarget.objectReferenceValue != null)
		{
			GUILayout.BeginHorizontal();
			if (GUILayout.Button("更新动画事件"))
			{
				OnWizardCreate(fbxTarget.objectReferenceValue);
			}
			if (GUILayout.Button("PingObject"))
			{
				EditorGUIUtility.PingObject(fbxTarget.objectReferenceValue);
			}
			GUILayout.EndHorizontal();
		}

		GUILayout.Space(16);

		EditorGUIUtils.FadeArea("动画配置", () =>
			{
				GUILayout.Space(4);
				toolBarSlect = GUILayout.Toolbar(toolBarSlect, toolBarMenu);
				//GUILayout.Space(8);

				switch (toolBarSlect)
				{
					case 0:
						animList.DoLayoutList();
						break;

					case 1:
						methodList.DoLayoutList();
						break;

					case 2:
						parametersList.DoLayoutList();
						break;

					case 3:
						break;
				}
			}, false, Repaint);

		#region actionCfg

		if (actionCfg == null)
		{
			actionCfg = () =>
			{

				for (int i = 0; i < ctr._eventList.Count; i++)
				{
					GUILayout.Space(4);
					AnimationEvent.AnimClipEvent clip = ctr._eventList[i];

					string title = "Actiom_" + i + ":    " + clip.name + "---" + clip.FunctionName + "---" + clip.time + "---" + clip.parameter;

					GUILayout.Label(title, EditorStyles.boldLabel);
					EditorGUILayout.BeginHorizontal();
					EditorGUILayout.BeginVertical();
					clip.name = EditorGUIUtils.Popup(clip.name, ctr.anims, "[动画名称]:");
					clip.FunctionName = EditorGUIUtils.Popup(clip.FunctionName, ctr.methods, "[调用方法]:");

					clip.time = EditorGUILayout.Slider(new GUIContent("[执行时间]:"), clip.time, 0, 1);

					clip.parameter = EditorGUIUtils.Popup(clip.parameter, ctr.parameters, "[传递参数]:");

					EditorGUILayout.EndVertical();
					GUILayout.BeginVertical();
					if (GUILayout.Button("删除"))
					{
						ctr._eventList.RemoveAt(i);
						break;
					}
					if (GUILayout.Button("添加"))
					{
						ctr._eventList.Insert(i, new AnimationEvent.AnimClipEvent());
						break;
					}
					GUILayout.EndVertical();
					EditorGUILayout.EndHorizontal();

					EditorGUILayout.LabelField("-----------------------------------------------------------------------------------------------------------");
				}
				GUILayout.Space(8);
			};
		}

		#endregion actionCfg
		EditorGUIUtils.FadeArea("事件配置", false, this.GetHashCode(), actionCfg, Repaint, () =>
			{
				ctr._eventList.Add(new AnimationEvent.AnimClipEvent());
			}, "添加事件");

		EditorUtility.SetDirty(target);
		serializedObject.ApplyModifiedProperties();
	}

	private void OnWizardCreate(Object _target)
	{
		string path = AssetDatabase.GetAssetPath(_target);
		ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;
		if (importer != null)
		{
			List<ModelImporterClipAnimation> animList = new List<ModelImporterClipAnimation>();
			for (int i = 0; i < importer.clipAnimations.Length; i++)
			{
				animList.Add((target as AnimationEvent).AssgnEvent(importer.clipAnimations[i]));
			}

			importer.clipAnimations = animList.ToArray();

			importer.SaveAndReimport();
		}
	}
}
#endif
```

![效果](Unity_AnimationEvent_Setting.png)

 