---
title: 并发编程
date: 2024/08/01 20:46:25
article_id: 6816805b-a66b-5636-a5f2-2bd8a9d94a7d
categories:
- Java
tags:
- Java
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-13.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-13.webp

---

# Juc并发编程

## 目录

- [JUC](#juc)
  - [进程和线程](#进程和线程)
  - [并行与并发](#并行与并发)

---

## JUC

### 进程和线程

线程作为最小调度单位，进程作为资源分配的最小单位。

### 并行与并发

- 并发（concurrent）是同一时间应对（dealingwith）多件事情的能力---同一时间段
- 并行（parallel）是同一时间动手做（doing）多件事情的能力-----同一时刻

