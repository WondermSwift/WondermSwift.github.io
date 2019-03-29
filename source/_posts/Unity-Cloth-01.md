title: Unity 的布料系统
date: 2015-11-03 00:06:16
categories: Unity
tags: Unity
description:
---
很早之前看基础教程的时候看到过布料的使用方式，今天策划调布料一直调不好，我看了一下，新的布料系统，还没用过，调了几分钟，发现挺简单的，这里记录一下，顺带翻一翻文档 
<!--more-->
### 效果
先看下基本参数设置，这里的Mesh是一体的，调整的目的是要被子的中下部分随风飘动，其余位置固定
![设置](Unity-Cloth-01-setting.jpg)
调了下权重和随机以及固定扰动，顶部的权重应该再小一点可以飘的更自然，运行效果：
![效果](Unity-Cloth-01-effect.gif)

### 详细参数说明

- Stretching Stiffness---拉扯硬度.

- Bending Stiffness---弯曲硬度.

- Use Tethers---默认开启, 用于方式过度拉伸

- Use Gravity---是否使用世界重力.

- Damping---阻尼会应用于每个布料顶点. 要想打造看上去抖动更小的布料, 可以试试这个.

- External Acceleration---常量外力.

- Random Acceleration---随机外力.

- World Velocity Scale---与World Acceleration Scale共同组成布料的GameObject.transfrom的运动会对物理模拟造成的影响比例.

- World Acceleration Scale---与World Velocity Scale共同组成布料的GameObject.transfrom的运动会对物理模拟造成的影响比例.

- riction---当布料碰到在这个列表中存在的Collider时所产生的摩擦力, 这只会影响布料的模拟. 上面说过了布料的物理模拟是单向的.

- Collision Mass Scale---How much to increase mass of colliding particles. 这个参数我不懂, 求补充.

- Use Continuous Collision---使用Continuous Collision, 增加消耗, 减少直接穿透碰撞的几率.

- Use Virtual Particles---Add one virtual particle per triangle to improve collision stability.

- Solver Frequency---Number of solver iterations per second. 显然是一个优化参数, 默认120很高了, 我可以试着调低一些.

- Sleep Threshold---静止阈值.

- Capsule Colliders---要对布料产生交互的胶囊碰撞体.

- Sphere Colliders---要对布料产生交互的ClothSphereColliderPairs. 可以理解为他是按照一组来的, 一组中可以只有一个SphereCollider, 也可以有两个, 当有两个的时候, 那么这两个

- SphereCollider会在布料的碰撞系统中被”焊接”起来. 这样就允许通过两个大小不同的SphereCollider来组合成一个圆锥形状的碰撞体了.

 