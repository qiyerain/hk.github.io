---
title: HashMap线程安全问题与解决方案
date: 2026-05-25 20:36:03
article_id: c4a6cd66-ab8c-5979-99eb-56250e5f7f55
categories:
- Java
- 面试
tags:
- Java
- HashMap
- 集合
cover: /img/covers/cover-3.webp
top_img: /img/covers/cover-3.webp

---
## 目录

- [一句话定位](#一句话定位)
- [一、HashMap 扩容时线程不安全在哪？](#一hashmap-扩容时线程不安全在哪)
  - [场景 1：JDK 1.7 环形链表导致死循环](#场景-1jdk-17-环形链表导致死循环)
  - [场景 2：数据覆盖/丢失](#场景-2数据覆盖丢失)
- [二、JDK 1.7 死循环问题复现](#二jdk-17-死循环问题复现)
  - [核心原因：头插法 + 多线程扩容](#核心原因头插法--多线程扩容)
  - [详细过程](#详细过程)
- [三、JDK 1.8 还有线程安全问题吗？](#三jdk-18-还有线程安全问题吗)
  - [问题 1：size 计数丢失](#问题-1size-计数丢失)
  - [问题 2：put 元素覆盖](#问题-2put-元素覆盖)
- [四、线程安全的解决方案](#四线程安全的解决方案)
  - [方案 1：Collections.synchronizedMap](#方案-1collectionssynchronizedmap)
  - [方案 2：Hashtable](#方案-2hashtable)
  - [方案 3：ConcurrentHashMap（推荐）](#方案-3concurrenthashmap推荐)
- [五、面试回答话术（结构版）](#五面试回答话术结构版)
  - [回答 1：HashMap 为什么线程不安全？](#回答-1hashmap-为什么线程不安全)
  - [回答 2：怎么解决 HashMap 线程安全问题？](#回答-2怎么解决-hashmap-线程安全问题)
- [引用](#引用)

---

# HashMap 线程安全问题与解决方案

---

## 一句话定位

HashMap 是线程不安全的，多线程环境下扩容会导致 1.7 环形链表死循环、1.8 数据覆盖/丢失；解决方案用 ConcurrentHashMap。

---

## 一、HashMap 扩容时线程不安全在哪？

### 场景 1：JDK 1.7 环形链表导致死循环

| 现象 | CPU 100%，线程卡在 HashMap.get() 方法里 |
|------|----------------------------------------|
| 根源 | 头插法 + 多线程同时扩容 → 链表形成环 |
| 版本 | 只在 JDK 1.7 及之前存在，1.8 改为尾插法解决了这个问题 |

### 场景 2：数据覆盖/丢失

| 现象 | 多线程 put 时，某些元素丢失了，或者 size 计数不对 |
|------|---------------------------------------------------|
| 根源 | 不是原子操作：size++、判断数组位置为空后并发插入 |
| 版本 | JDK 1.7 和 1.8 都存在这个问题 |

---

## 二、JDK 1.7 死循环问题复现

### 核心原因：头插法 + 多线程扩容

1.7 的扩容迁移用的是头插法，多线程同时迁移同一个链表时，顺序会反转，多个线程交错执行就可能形成环形链表。

### 详细过程

假设有两个线程 T1 和 T2，同时扩容同一个链表：

```
原链表：A → B → C → null

T1 执行：
- 读取 e = A, next = B
- 刚要继续，时间片用完，被挂起

T2 执行：
- 完整执行完扩容迁移
- 因为头插法，新链表变成：C → B → A → null

T1 被唤醒继续执行：
- 此时原链表结构已变
- 继续迁移 A、B，A.next = B，但 B.next 之前已经被 T2 设为 A
- 结果：A ↔ B，形成环形链表
```

当调用 get 查找一个不存在的 key 时，遍历链表会陷入死循环，CPU 100%。

---

## 三、JDK 1.8 还有线程安全问题吗？

1.8 用尾插法解决了环形链表死循环问题，但依然线程不安全：

### 问题 1：size 计数丢失

```java
// size++ 不是原子操作
++size;
```
- 线程 A 读取 size=10，准备加1
- 线程 B 读取 size=10，准备加1
- 结果两个线程加完后 size=11，少加了一次

### 问题 2：put 元素覆盖

```java
// 判断数组位置为空后可能被插入
if ((p = tab[i = (n - 1) & hash]) == null)
    tab[i] = newNode(hash, key, value, null);
```
- 线程 A 判断 tab[i] == null，准备插入
- 线程 B 也判断 tab[i] == null，插入
- 结果 A 的值被 B 覆盖了

---

## 四、线程安全的解决方案

### 方案 1：Collections.synchronizedMap

```java
Map<String, String> map = Collections.synchronizedMap(new HashMap<>());
```
- 原理：包装一层，所有方法加 `synchronized` 锁，锁的是整个 map 对象
- 优点：简单，一行代码
- 缺点：性能差，多线程只能串行执行，锁粒度太大

### 方案 2：Hashtable

```java
Map<String, String> map = new Hashtable<>();
```
- 原理：所有方法加 `synchronized` 锁，锁的是整个 Hashtable 对象
- 优点：古老但稳定
- 缺点：性能差，不允许 key/value 为 null，很少用了

### 方案 3：ConcurrentHashMap（推荐）

| JDK 版本 | 实现原理 |
|----------|---------|
| 1.7 | 分段锁（Segment），默认 16 段 |
| 1.8+ | CAS + synchronized，锁粒度是数组的头节点/红黑树根节点 |

**JDK 1.8 的 ConcurrentHashMap 核心优化：**
- 读操作无锁（volatile 保证可见性）
- 写操作锁住链表头或红黑树根
- 锁粒度更小：只锁同一个索引位置的节点
- 空指针检查：key 和 value 都不能为空

```java
// 推荐用法
Map<String, String> map = new ConcurrentHashMap<>();
```

---

## 五、面试回答话术（结构版）

### 回答 1：HashMap 为什么线程不安全？

> **分三点回答（由主到次）：**
>
> **1. JDK 1.7 的环形链表问题**
> - 1.7 扩容用头插法，多线程同时迁移同一个链表时会形成环
> - 导致 get 查找不存在的 key 时陷入死循环，CPU 100%
> - 1.8 改成尾插法解决了这个问题
>
> **2. 数据覆盖/丢失**
> - 多线程 put 时，判断数组位置为空后被另一个线程抢先插入
> - 后来的值会覆盖先来的值
> - 1.7 和 1.8 都有这个问题
>
> **3. size 计数不准确**
> - size++ 不是原子操作
> - 多线程同时加可能少加

### 回答 2：怎么解决 HashMap 线程安全问题？

> **先说结论（推荐 ConcurrentHashMap），再逐个对比：**
>
> **1. 推荐：ConcurrentHashMap**
> - 1.7 用分段锁，1.8 用 CAS + synchronized 锁头节点
> - 锁粒度小，读操作无锁，性能最好
>
> **2. Collections.synchronizedMap**
> - 包装一层，所有方法加 synchronized，锁整个 map
> - 优点：简单
> - 缺点：性能差，多线程串行
>
> **3. Hashtable**
> - 古老实现，全方法加 synchronized
> - 不允许 key/value 为 null
> - 基本不用了

---

