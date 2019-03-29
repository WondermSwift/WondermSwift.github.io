---
title: C#连接SQLite基本操作(一)
date: 2017-06-21 01:11:23
categories: Unity
tags: 
 - Unity
 - SQLite
 - Excel
---
 近期非常忙，博客没有更新。项目中遇到策划自己写的VBA导出Excel到SQLite数据库，需要装驱动，每次自己想改数据总是很不方便，于是在周末抽空自己写了Excel导入SQLite的工具，
 可以Excel中定义字段和基本数据类型，一键导出创建对应数据表，以及从SQLite到C#对象实体化，算是日常造轮子。由于之前项目都是用的同事的数据库解析操作工具，这次正好自己熟悉下基础的数据库操作。
<!--more-->

 


 

#### 读取Excel 

网上看了挺多文章，也在Github上看了许多项目但是绝大部分不满足我的需求:源码，不过多依赖外部库，在Unity中可以直接调用。
费了一些时间找到一个基本符合要求的[joexi/Excel4Unity](https://github.com/joexi/Excel4Unity),读取Excel部分基本完成

 > ExcelHelper.LoadExcel(string path)

#### SQLite读写操作

`_Export`

 在了解几种C#操作数据库的基本方案，我选择了项目中用到的插件 `Community.CsharpSqlite.Unity` (出处没有找到),选择原因是已经验证过Win,Mac和PS4平台，其他的方案大都未能验证通过。

 引用之后添加自己的数据库操作方法:




```CSharp

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SQLite;
using System;
using Community.CsharpSqlite;

namespace Wonderm.SQLiteNs
{
    public class SQLiteHelper : IDisposable
    {
        #region static

        /// <summary>
        /// 创建数据库文件
        /// </summary>
        /// <param name="path"></param>
        public static void CreateSQLiteDB(string path)
        {
            new SQLiteConnection(path);
        }

        #endregion static

        /// <summary>
        /// 数据库连接定义
        /// </summary>
        private SQLiteConnection dbConnection;

        /// <summary>
        /// 操作数据库命令
        /// </summary>
        private SQLiteCommand dbCommand;

        /// <summary>
        /// 操作结果流
        /// </summary>
        private SQLiteDataReader dbReader;

        /// <summary>
        /// 数据读取定义
        /// </summary>
        /// <param name="path">路径</param>
        /// <param name="write">开启写模式文件不存在时会自动创建</param>
        public SQLiteHelper(string path, bool write = false)
        {
            try
            {
                ConnectToDatabase(path, write);
            }
            catch (Exception e)
            {
                Debug.LogError(e);
            }
        }

        /// <summary>
        /// 链接数据库
        /// </summary>
        private void ConnectToDatabase(string path, bool write = false)
        {
            if (write)
            {
                dbConnection = new SQLiteConnection(path, SQLiteOpenFlags.ReadWrite);
            }
            else
            {
                dbConnection = new SQLiteConnection(path, SQLiteOpenFlags.ReadOnly);
            }
            dbReader = new SQLiteDataReader();
            dbCommand = dbConnection.CreateCommand("");
        }

        private SQLiteDataReader ExecuteQuery(string queryString)
        {
            dbCommand.CommandText = queryString;
            dbReader.SetCmd(dbCommand);

            return dbReader;
        }

        /// <summary>
        /// 关闭数据库连接
        /// </summary>
        public void CloseConnection()
        {
            (this as IDisposable).Dispose();
        }

        /// <summary>
        /// 创建数据表
        /// </summary> +
        /// <returns>The table.</returns>
        /// <param name="tableName">数据表名</param>
        /// <param name="colNames">字段名</param>
        /// <param name="colTypes">字段名类型</param>
        public void CreateTable(string tableName, string[] colNames, string[] colTypes)
        {
            string queryString = "CREATE TABLE " + tableName + "( " + colNames[0] + " " + colTypes[0];
            for (int i = 1; i < colNames.Length; i++)
            {
                queryString += ", " + colNames[i] + " " + colTypes[i];
            }
            queryString += "  ) ";

            dbConnection.Execute(queryString);
        }

        /// <summary>
        /// 向指定数据表中插入数据
        /// </summary>
        /// <returns>The values.</returns>
        /// <param name="tableName">数据表名称</param>
        /// <param name="values">插入的数值</param>
        public void InsertValues(string tableName, string[] values)
        {
            string queryString = "INSERT INTO " + tableName + " VALUES (" + values[0];
            for (int i = 1; i < values.Length; i++)
            {
                queryString += ", " + "'" + values[i] + "'";
            }
            queryString += " )";
            dbConnection.Execute(queryString);
        }

        /// <summary>
        /// 读取整张表
        /// </summary>
        /// <param name="table"></param>
        public SQLiteDataReader ReadFullTable(string tableName)
        {
            string query = "SELECT * FROM " + tableName;
            return ExecuteQuery(query);
        }

        /// <summary>
        /// 读取一行
        /// </summary>
        /// <param name="tableName"></param>
        public SQLiteDataReader ReadSingle(string tableName, string item, string col, string operation, string values)
        {
            string query = "SELECT " + item + " FROM " + tableName + " WHERE " + col + operation + values;
            return ExecuteQuery(query);
        }

        void IDisposable.Dispose()
        {
            if (dbReader != null)
            {
                dbReader.Dispose();
            }
            dbReader = null;

            if (dbCommand != null)
            {
                dbCommand.Dispose();
            }
            dbCommand = null;

            if (dbConnection != null)
            {
                dbConnection.Close();
            }
            dbConnection = null;
        }
    }
}

 ```

#### Excel2SQLite

读写搞定了之后需要解决转换的问题，添加转换脚本读取Excel中以`_Export`为后缀的表,根据表头创建表

 ```CSharp

 private static List<string> TypeLimits = new List<string> {
        "INTEGER",
        "TEXT",
        "REAL",
        "BLOB",
    };

 public static void Convert(SQLiteHelper db, Excel excel)
    {
        List<string> colNames = new List<string>();
        List<string> coltypes = new List<string>();

        foreach (var table in excel.Tables)
        {
            if (!table.TableName.EndsWith(ExportExtra)) continue;

            #region 创建表

            if (table.NumberOfRows < 2)
            {
                Debug.LogError("Data format error : NumberOfRows is less than 2");
            }
            string tableName = table.TableName.Replace(ExportExtra, "");

            {
                for (int j = 1; j <= table.NumberOfColumns; j++)
                {
                    if (colNames.Contains(table.GetCell(1, j).Value))
                    {
                        Debug.LogError(string.Format("tableName [{0}] repeated in table [{1}]", table.GetCell(1, j).Value, table.TableName));
                        return;
                    }

                    colNames.Add(table.GetCell(1, j).Value);
                    var cel = table.GetCell(2, j).Value;
                    if (!TypeLimits.Contains(cel))
                    {
                        Debug.LogError(string.Format("Type error in table [{0}] in ({1},{2}) error type {3}", tableName, 2, j, cel));
                        return;
                    }

                    coltypes.Add(cel);
                }

                if (colNames.Count != coltypes.Count)
                {
                    Debug.LogError("ColNames do not match ColTypes in count : " + table.TableName);
                }

                db.CreateTable(tableName, colNames.ToArray(), coltypes.ToArray());
            }

            #endregion 创建表

            #region 插入数据

            for (int i = 3; i <= table.NumberOfRows; i++)
            {
                List<string> cols = new List<string>();

                for (int j = 1; j <= table.NumberOfColumns; j++)
                {
                    cols.Add(table.GetCell(i, j).Value);
                }

                if (colNames.Count != cols.Count)
                {
                    Debug.LogError("ColNames do not match Cols in count : " + table.TableName);
                    return;
                }

                db.InsertValues(tableName, cols.ToArray());
            }

            #endregion 插入数据
        }
    }


 ```

#### SQLite对象实体化

这部分是体力活，看了下其他人的代码根据自己的需求实现了个新的

分成两部分:

1. DbReader 负责根据类型标注的 Attribute 进行映射，实体对象创建
2. Converter 负责从SQLReader转换为基础的数据类型

内部实现无非是解析 Attribute 类型比对，数据拆分

基本数据类例子如下:

```
[DbReader.DbTable("Test2")]
public class Test2Data
{
    [DbReader.DbField("ID")]
    public int ID;

    [DbReader.DbField("Name")]
    public string Name;

    [DbReader.DbField("Type")]
    public int Type;

    [DbReader.DbField("Desc")]
    public string Desc;

    [DbReader.DbField("HP")]
    public float HP;

    [DbReader.DbField("MP")]
    public float MP;

    [DbReader.DbField("Monster")]
    public bool Monster;
}
```

转化接口:  

```
 var db = new SQLiteHelper(SqlitePath, false);
 var datas = DbReader.Read<Test2Data>(db);
```

转换效果:
![Excel2SQLite](Excel2SQLite.png)
