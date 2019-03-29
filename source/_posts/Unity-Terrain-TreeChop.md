---
title: Unity地形割草砍树
date: 2017-01-05 23:17:38
categories:
- Unity
tags:
- Unity
- Terrain
---
前段时间最近懒癌发作，业余时间什么都不相干，最近开始整理之前的工作

有需求是砍树，要求可以针对单棵树，暂无存档需求，后来又追加了割草

<!--more-->

由于之前做过运行时的地形编辑器，所以对地形还算熟悉

### 割草

1. 草的数据存在`DetailLayer`中,根据Layer逐像素单独存储密度，以图片的形式存储每个Layer对应一种草
2. 准备好替换用的草,构建映射表，草分两次砍光，第一次砍半截
3. 输入位置和半径,逐`Layer`获取区块数据并缓存，清空当前区块密度
4. 逐`Layer`将映射表的草密度替换成缓存的值

用到的方法:

```csharp
data.GetDetailLayer(xBase, yBase, width, height, layer);
 data.SetDetailLayer(xBase, yBase, newLayer, newMap);
```
 ### 砍树

 跟割草不同的是，树所有的实例都存在一个List里,所以只要搞定位置判断就可以，难点反而是是碰撞检测 

 需要注意的有两点

1. 必须刷新区块的高度数据才能刷新地形碰撞器 ~~
2. 不管预制是什么`Layer`地形检测时返回的全是地形的`Layer`

5.6 及后续版本，无法通过刷新高度数据更新碰撞器，需要重新激活碰撞器来刷新碰撞器

核心代码:
 ```csharp
               List<TreeInstance> treeList = new List<TreeInstance>(terrain.terrainData.treeInstances);
                treeList.RemoveAt(index);
                terrain.terrainData.treeInstances = treeList.ToArray();
 ```

### 实现代码

 ```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
//using MM = Wonderm.MessageSystem.MessageManager;

namespace TerrainNs
{
    [RequireComponent(typeof(Terrain))]
    public class TerrainChopCtr : MonoBehaviour
    {
        [SerializeField]
        private bool backupTerrainData = true;

        [Header("Tree")]
        [SerializeField]
        private GameObject fallingTreePrefab;

        [SerializeField, Range(0, 50)]
        private int treeHealth = 1;

        [SerializeField, Range(1, 20)]
        private int treeRadius = 5;

        [Header("Grass")]
        [SerializeField]
        //[Label("替换的后缀")]
        private string grassExtra;

        [SerializeField, Range(1, 20)]
        private float grassHeightThreshold = 2;

        private Terrain terrain;
        private TerrainData data;
        private TreeInstance[] treeInstances;
        private int index = -1;
        private Vector3 pos;
        private float rot;
        private GameObject treeObj;
        private int treeId;
        private Dictionary<int, int> treeHealthDic;
        private Dictionary<int, int> layerDateDic;

        private void Start()
        {
            terrain = GetComponent<Terrain>();
            if (backupTerrainData)
            {
                var collider = GetComponent<TerrainCollider>();
                terrain.terrainData = Instantiate<TerrainData>(terrain.terrainData);
                collider.terrainData = terrain.terrainData;
            }
            data = terrain.terrainData;
            Init();
           
            //MM.Instance.Subscribe(MMConst.TerrainTreeChop, TreeChop);
            //MM.Instance.Subscribe(MMConst.TerrainGrassChop, GrassChop);
        }

        private void Init()
        {
            if (treeHealthDic == null)
            {
                treeHealthDic = new Dictionary<int, int>();
            }
            if (layerDateDic == null)
            {
                layerDateDic = new Dictionary<int, int>();
            }
            layerDateDic.Clear();
            for (int layer = 0; layer < data.detailPrototypes.Length; layer++)
            {
                int index = GetReplaceLayer(layer);
                if (index != -1)
                {
                    layerDateDic.Add(layer, index);
                }
            }
        }

        private void OnDestroy()
        {
         
            //MM.Instance.Unsubscribe(MMConst.TerrainTreeChop, TreeChop);
            //MM.Instance.Unsubscribe(MMConst.TerrainGrassChop, GrassChop);
        }

#if UNITY_EDITOR
        public enum ChopType
        {
            None,
            Tree,
            Detail,
        }
        [Header("Test")]
        [SerializeField]
        private ChopType chopType = ChopType.None;
        [SerializeField]
        private LayerMask mask;
        [SerializeField, Range(0, 128)]
        private float grassRadius;
        private RaycastHit hit;
        private void Update()
        {
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out hit, mask.value))
            {
                Debug.DrawLine(ray.origin, hit.point, Color.blue);
                if (Input.GetMouseButtonDown(0))
                {
                    if (chopType == ChopType.Tree)
                    {
                        TreeChop(hit.point);
                    }
                    else if (chopType == ChopType.Detail)
                    {
                        Mowing(hit.point, (int)grassRadius);
                    }
                }
            }
        }
#endif

        #region Tree

        public void TreeChop(object[] obj)
        {
            TreeChop((Vector3)obj[0]);
        }

        public void TreeChop(Vector3 point)
        {
            Profiler.BeginSample("TreeChop-----SetHeights");
            if (HasTree(point, terrain.terrainData))
            {
                if (treeHealthDic.ContainsKey(treeId))
                {
                    treeHealthDic[treeId]--;
                }
                else
                {
                    treeHealthDic.Add(treeId, treeHealth);
                }
                if (treeHealthDic[treeId] > 0)
                {
                    return;
                }

                #region Create Tree

                var parent = new GameObject("FallDownTree");
                parent.transform.position = pos;
                parent.transform.rotation = Quaternion.Euler(0, Mathf.Rad2Deg * rot, 0);
                parent.transform.localScale = treeObj.transform.localScale;
                //var tw = Pathea.GameUtils.AddChild(parent, fallingTreePrefab);
                //Pathea.GameUtils.AddChild(tw, treeObj);
                //Pathea.Times.MonoTimer.Instance.RunTask(() => { Destroy(parent); }, 3);
                List<TreeInstance> treeList = new List<TreeInstance>(terrain.terrainData.treeInstances);
                treeList.RemoveAt(index);
                terrain.terrainData.treeInstances = treeList.ToArray();

                #endregion Create Tree

                #region Flush Terrain

                Vector3 offset = point - terrain.transform.position;
                int xBase = Mathf.Clamp((int)offset.x, 0, terrain.terrainData.heightmapWidth);
                int yBase = Mathf.Clamp((int)offset.z, 0, terrain.terrainData.heightmapWidth);
                int w = Mathf.Clamp(treeRadius, 0, terrain.terrainData.heightmapWidth - xBase);
                int h = Mathf.Clamp(treeRadius, 0, terrain.terrainData.heightmapHeight - yBase);
                float[,] heights = terrain.terrainData.GetHeights(xBase, yBase, w, h);
                terrain.terrainData.SetHeights(xBase, yBase, heights);

                #endregion Flush Terrain
            }
        }

        private bool HasTree(Vector3 point, TerrainData data)
        {
            Profiler.BeginSample("TreeChop-----HasTree");
            index = -1;
            treeInstances = data.treeInstances;
            float minDis = 100;
            for (int i = 0; i < treeInstances.Length; i++)
            {
                var tree = treeInstances[i];
                var prefab = data.treePrototypes[tree.prototypeIndex];
                var sps = prefab.prefab.GetComponentsInChildren<SphereCollider>();
                var treePos = Vector3.Scale(tree.position, data.size) + terrain.GetPosition();
                foreach (var sp in sps)
                {
                    var dis = Vector3.Distance(treePos + sp.transform.localPosition + sp.center, point);
                    if (dis <= sp.radius && dis < minDis)
                    {
                        minDis = dis;
                        index = i;
                        pos = treePos;
                        rot = tree.rotation;
                        treeObj = prefab.prefab;
                        treeId = tree.position.GetHashCode();
                        Debug.Log(treeObj.name + "dis:" + dis + "\trot" + rot);
                    }
                }
                var ccs = prefab.prefab.GetComponentsInChildren<CapsuleCollider>();
                foreach (var cc in ccs)
                {
                    var from = treePos + cc.transform.localPosition + cc.center + cc.transform.up * (cc.height - cc.radius) / 2;
                    var to = treePos + cc.transform.localPosition + cc.center - cc.transform.up * (cc.height - cc.radius) / 2;
                    var dis = DisPoint2Line(point, from, to);
                    if (dis <= cc.radius && dis < minDis)
                    {
                        minDis = dis;
                        index = i;
                        pos = treePos;
                        rot = tree.rotation;
                        treeObj = prefab.prefab;
                        treeId = tree.position.GetHashCode();
                        Debug.Log(treeObj.name + "\tdis:" + dis + "\trot" + rot);
                    }
                }
            }
            Profiler.EndSample();
            return index != -1;
        }

        #endregion Tree

        #region Detail

        public void GrassChop(object[] obj)
        {
            Mowing((Vector3)obj[0], (int)obj[1]);
        }

        public void Mowing(Vector3 point, int radius)
        {
            var h = terrain.SampleHeight(point);
            //Debug.Log("terrainH:\t" + h + "\nterrainY:\t" + terrain.transform.position.y + "\nPointY:\t" + point.y);
            if (Mathf.Abs(h + transform.position.y - point.y) > grassHeightThreshold)
            {
                return;
            }
            int mapSize = terrain.terrainData.detailResolution;
            if (terrain.terrainData.size.x != terrain.terrainData.size.z)
            {
                Debug.LogError("X and Y Size of terrain have to be the same  ");
                return;
            }
            float PrPxSize = mapSize / terrain.terrainData.size.x;
            Vector3 texturePoint3D = point - terrain.transform.position;
            texturePoint3D = texturePoint3D * PrPxSize;
            Vector2 xz = new Vector2(texturePoint3D.x, texturePoint3D.z);
            Mowing(1, xz, radius);
            Mowing(2, xz, radius);
        }

        private void Mowing(int order, Vector2 xz, int radius)
        {
            int xBase = Mathf.Clamp((int)xz.x - radius, 0, data.detailWidth);
            int yBase = Mathf.Clamp((int)xz.y - radius, 0, data.detailHeight);
            int width = Mathf.Clamp(2 * radius, 0, data.detailWidth - xBase);
            int height = Mathf.Clamp(2 * radius, 0, data.detailHeight - yBase);
            for (int layer = 0; layer < data.detailPrototypes.Length; layer++)
            {
                if (data.detailPrototypes[layer].prototypeTexture == null)
                {
                    continue;
                }
                bool has = data.detailPrototypes[layer].prototypeTexture.name.Contains(grassExtra);
                if (order == 1 && !has)
                {
                    continue;
                }
                if (order == 2 && has)
                {
                    continue;
                }
                int newLayer = -1;
                if (layerDateDic.ContainsKey(layer))
                {
                    newLayer = layerDateDic[layer];
                }
                var map = data.GetDetailLayer(xBase, yBase, width, height, layer);
                int[,] newMap = null;
                if (newLayer != -1)
                {
                    newMap = data.GetDetailLayer(xBase, yBase, width, height, newLayer);
                }
                Vector2 p = Vector2.zero;
                for (int y = 0; y < height; y++)
                {
                    for (int x = 0; x < width; x++)
                    {
                        p.x = x + xBase;
                        p.y = y + yBase;
                        int cache = map[y, x];
                        if (cache == 0)
                        {
                            continue;
                        }
                        if (Vector2.Distance(xz, p) < radius)
                        {
                            map[y, x] = 0;
                        }
                        if (newLayer != -1)
                        {
                            newMap[y, x] = cache;
                        }
                    }
                }
                data.SetDetailLayer(xBase, yBase, layer, map);
                if (newLayer != -1)
                    data.SetDetailLayer(xBase, yBase, newLayer, newMap);
            }
        }

        private int GetReplaceLayer(int layer)
        {
            if (data.detailPrototypes[layer].prototypeTexture == null)
            {
                return -1;
            }
            string layerName = data.detailPrototypes[layer].prototypeTexture.name + grassExtra;
            for (int i = 0; i < data.detailPrototypes.Length; i++)
            {
                if (data.detailPrototypes[i].prototypeTexture == null)
                {
                    continue;
                }
                if (data.detailPrototypes[i].prototypeTexture.name == layerName)
                {
                    return i;
                }
            }
            return -1;
        }

        #endregion Detail

        public static float DisPoint2Line(Vector3 point, Vector3 start, Vector3 end)
        {
            Vector3 vec1 = point - start;
            Vector3 vec2 = end - start;
            Vector3 vecProj = Vector3.Project(vec1, vec2);
            float dis = Mathf.Sqrt(Mathf.Pow(Vector3.Magnitude(vec1), 2) - Mathf.Pow(Vector3.Magnitude(vecProj), 2));
            return dis;
        }
    }
}
 ```