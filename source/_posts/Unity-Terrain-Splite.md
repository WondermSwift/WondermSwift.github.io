---
title: Unity地形切割
date: 2016-11-14 22:16:39
categories:
- Unity
tags:
- Unity
- Terrain
---

用于切割地形包含HeightMap,AlphaMap,Trees,Grass
<!--more-->

```csharp
#if UNITY_EDITOR

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

public class TerrainSpliter : EditorWindow
{
    #region Variable

    private int selectToolBar = 0;
    private string[] toolbarMenu = { "手动分割", "自动分割" };
    private Terrain orginTerrain;
    private TerrainData orginTerrainData;

    #endregion Variable

    #region Init

    [MenuItem("Tools/Terrain/Terrain Split &1")]
    public static void OpenSplitTerrainWindow()
    {
        var window = EditorWindow.GetWindow(typeof(TerrainSpliter));
        window.minSize = new Vector2(400, 250);
    }

    #endregion Init

    private void OnGUI()
    {
        GUILayout.Space(8);

        orginTerrain = EditorGUILayout.ObjectField("地形", orginTerrain, typeof(Terrain), true) as Terrain;

        if (orginTerrain != null)
        {
            orginTerrainData = orginTerrain.terrainData;
            GUI.enabled = false;
            EditorGUILayout.Vector3Field("尺寸:(Width,Height,Length)", orginTerrain.terrainData.size);
            GUI.enabled = true;
        }
        else
        {
            return;
        }
        GUILayout.Space(8);

        selectToolBar = GUILayout.Toolbar(selectToolBar, toolbarMenu);

        switch (selectToolBar)
        {
            case 0:
                DrawManualSplite();
                break;

            case 1:
                DrawAutoSplite();
                break;
        }
    }

    private Vector2 pos;
    private Vector2 size;

    private void DrawManualSplite()
    {
        GUILayout.Space(8);

        pos = EditorGUILayout.Vector2Field("起始座标", pos);
        size = EditorGUILayout.Vector2Field("尺寸", size);
        var sizeX = GetNear(size.x);
        var sizeY = GetNear(size.y);

        pos.x = Mathf.Clamp(pos.x, 0, orginTerrainData.size.x - sizeX);
        pos.y = Mathf.Clamp(pos.y, 0, orginTerrainData.size.z - sizeY);

        GUILayout.Space(16);

        if (GUILayout.Button("Splite"))
        {
            if (size.x == 0 || size.y == 0)
            {
                ShowNotification(new GUIContent("尺寸不能为零"));
                return;
            }
            SpliteTerrain();
        }
    }

    private void DrawAutoSplite()
    {
    }

    #region Splite

    private TerrainData resultTerrainData;
    private Terrain resultTerrain;

    private int X;
    private int Y;
    private int W;
    private int L;

    private void SpliteTerrain()
    {
        var path = EditorUtility.SaveFilePanel("Save Splited Data Path", Application.dataPath, orginTerrain.gameObject.name + "_Splite", "asset");
        Debug.Log(path);

        if (string.IsNullOrEmpty(path))
        {
            ShowNotification(new GUIContent("路径不存在"));
            return;
        }
        X = (int)(pos.x) / 2;
        Y = (int)(pos.y) / 2;
        W = (int)(size.x);
        L = (int)(size.y);

        InitData(path);
        SpliteHeightMap();
        SpliteAlphaMap();
        SpliteTrees();
        SpliteGrass();

        resultTerrain.Flush();
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
    }

    private void InitData(string path)
    {
        //初始化Data
        resultTerrainData = new TerrainData();
        resultTerrainData.size = new Vector3(W, orginTerrainData.size.y, L);

        //创建文件
        resultTerrain = Terrain.CreateTerrainGameObject(resultTerrainData).GetComponent<Terrain>();
        resultTerrain.gameObject.name = orginTerrain.gameObject.name + "_Splite";
        AssetDatabase.CreateAsset(resultTerrainData, path.Replace(Application.dataPath, "Assets"));
        resultTerrain.terrainData = resultTerrainData;

        resultTerrain.transform.position = orginTerrain.transform.position + new Vector3(pos.x, 0, pos.y);

        Selection.activeGameObject = resultTerrain.gameObject;
 
        //基本参数
        resultTerrain.drawHeightmap = orginTerrain.drawHeightmap;
        resultTerrain.heightmapPixelError = orginTerrain.heightmapPixelError;
        resultTerrain.basemapDistance = orginTerrain.basemapDistance;
        resultTerrain.castShadows = orginTerrain.castShadows;
        resultTerrain.materialType = orginTerrain.materialType;
        resultTerrain.materialTemplate = orginTerrain.materialTemplate;
        resultTerrain.reflectionProbeUsage = orginTerrain.reflectionProbeUsage;
        resultTerrainData.thickness = orginTerrainData.thickness;

        //Tree & Detail  
        resultTerrain.drawTreesAndFoliage = orginTerrain.drawTreesAndFoliage;
        resultTerrain.bakeLightProbesForTrees = orginTerrain.bakeLightProbesForTrees;
        resultTerrain.detailObjectDistance = orginTerrain.detailObjectDistance;
        resultTerrain.collectDetailPatches = orginTerrain.collectDetailPatches;
        resultTerrain.detailObjectDensity = orginTerrain.detailObjectDensity;
        resultTerrain.treeDistance = orginTerrain.treeDistance;
        resultTerrain.treeBillboardDistance = orginTerrain.treeBillboardDistance;
        resultTerrain.treeCrossFadeLength = orginTerrain.treeCrossFadeLength;
        resultTerrain.treeMaximumFullLODCount = orginTerrain.treeMaximumFullLODCount;
        // Wind Setting For Grass
        resultTerrainData.wavingGrassSpeed = orginTerrainData.wavingGrassSpeed;
        resultTerrainData.wavingGrassStrength = orginTerrainData.wavingGrassStrength;
        resultTerrainData.wavingGrassAmount = orginTerrainData.wavingGrassAmount;
        resultTerrainData.wavingGrassTint = orginTerrainData.wavingGrassTint;
        resultTerrainData.splatPrototypes = orginTerrainData.splatPrototypes;

        // Resolution
        var resolution = (int)Mathf.Max(size.x, size.y);

        resultTerrainData.heightmapResolution = resolution * orginTerrainData.heightmapResolution / (int)(orginTerrainData.size.x) + 1;
        resultTerrainData.size = new Vector3(size.x, orginTerrainData.size.y, size.y);
        resultTerrainData.SetDetailResolution(resolution * orginTerrainData.detailResolution / (int)(orginTerrainData.size.x), 8);

        resultTerrainData.alphamapResolution = resolution * orginTerrainData.alphamapResolution / (int)(orginTerrainData.size.x);
        resultTerrainData.baseMapResolution = resolution * orginTerrainData.baseMapResolution / (int)(orginTerrainData.size.x);
    }

    /// <summary>
    /// 高度图
    /// </summary>
    private void SpliteHeightMap()
    {
        int sizeHeight = resultTerrainData.heightmapResolution;
        Debug.Log("sizeHeight/W/L\t" + sizeHeight + "/" + W + "/" + L);

        var max = Mathf.Max(W, L);

        var arry = orginTerrain.terrainData.GetHeights(X, Y, W / max * sizeHeight, L / max * sizeHeight);

        resultTerrainData.SetHeights(0, 0, arry);
    }

    /// <summary>
    /// 贴图
    /// </summary>
    private void SpliteAlphaMap()
    {
        int sizeAlpha = resultTerrainData.alphamapResolution;
        Debug.Log("sizeAlpha/W/L\t" + sizeAlpha + "/" + W + "/" + L);
        var max = Mathf.Max(W, L);
        float[,,] aMap = orginTerrainData.GetAlphamaps(X, Y, W / max * sizeAlpha, L / max * sizeAlpha);
        resultTerrainData.SetAlphamaps(0, 0, aMap);
    }

    /// <summary>
    /// 树木
    /// </summary>
    private void SpliteTrees()
    {
        List<TreeInstance> trees = new List<TreeInstance>();

        var treeNum = orginTerrainData.treeInstances;
      
        var areaRect = new Rect(X, Y, W, L);
        var treePos = Vector2.zero;
        var realPos = Vector3.zero;

        var offset = new Vector3(pos.x, 0, pos.y);
        for (int k = 0; k < treeNum.Length; k++)
        {
            realPos.x = treeNum[k].position.x * orginTerrainData.size.x;
            realPos.z = treeNum[k].position.z * orginTerrainData.size.z;
            realPos.y = treeNum[k].position.y * orginTerrainData.size.y;

            treePos.x = realPos.x;
            treePos.y = realPos.z;
            if (areaRect.Contains(treePos))
            {
                treeNum[k].position = realPos - offset;
                treeNum[k].position.x = treeNum[k].position.x / size.x;
                treeNum[k].position.z = treeNum[k].position.z / size.y;
                treeNum[k].position.y = treeNum[k].position.y / resultTerrainData.size.y;

                trees.Add(treeNum[k]);
            }
        }
        resultTerrainData.treePrototypes = orginTerrainData.treePrototypes;
        resultTerrainData.treeInstances = trees.ToArray();
    }

    /// <summary>
    /// 花草
    /// </summary>
    private void SpliteGrass()
    {
        DetailPrototype[] Grass = orginTerrainData.detailPrototypes;
        
        resultTerrainData.detailPrototypes = Grass;
        for (int k = 0; k < Grass.Length; k++)
        {
            int[,] text = orginTerrainData.GetDetailLayer(X, Y, W, L, k);
            resultTerrainData.SetDetailLayer(0, 0, k, text);
        }
    }

    #endregion Splite

    private int GetNear(float num)
    {
        int result = 1;

        if (num == 0) return 0;
        while (result < num)
        {
            result = result << 1;
        }

        return result;
    }
}

#endif
```