---
title: synchronized与ReentrantLock区别
date: 2026-05-25 20:36:03
article_id: 8efedad6-1b86-55d7-891e-ca70bd0bedfe
categories:
- Java
- 面试
tags:
- Java
- 并发
- JUC
cover: /img/covers/cover-8.webp
top_img: /img/covers/cover-8.webp

---
# synchronized vs ReentrantLock

## 目录

- [一、核心区别（面试第一答）](#一核心区别面试第一答)
- [二、synchronized 原理](#二synchronized-原理)
- [三、ReentrantLock 原理（AQS）](#三reentrantlock-原理aqs)
- [四、ReentrantLock 四大高级功能](#四reentrantlock-四大高级功能)
- [五、公平锁 vs 非公平锁](#五公平锁-vs-非公平锁)
- [六、如何选择](#六如何选择)
- [七、面试追问](#七面试追问)

---

## 一、核心区别

| | synchronized | ReentrantLock |
|--|-------------|---------------|
| 层面 | JVM 内置（monitorenter/monitorexit） | API 层（AQS） |
| 释放 | 自动（退出同步块） | 手动 unlock（必须在 finally） |
| 可中断 | ❌ | ✅ lockInterruptibly() |
| 超时 | ❌ | ✅ tryLock(timeout) |
| 公平 | 仅非公平 | 公平/非公平可选 |
| 条件变量 | 1 个 wait/notify | 多个 Condition，精确唤醒 |
| 锁状态 | 不可查 | 可查（isLocked、队列长度等） |
| 读写分离 | ❌ | ✅ ReentrantReadWriteLock |

**共同点：都支持可重入。**

**面试一句话：** synchronized 是 JVM 内置锁，自动释放、简单易用；ReentrantLock 是 API 层锁，提供可中断、超时、公平、多条件变量等高级能力。能用 synchronized 就用，需要高级功能时用 ReentrantLock。

---

## 二、synchronized 原理

### 2.1 字节码层面

```java
// 代码块 → monitorenter / monitorexit
synchronized (obj) { ... }
// 字节码：monitorenter → 临界区 → monitorexit（正常）+ monitorexit（异常）

// 方法 → ACC_SYNCHRONIZED 标志
public synchronized void method() { ... }
// 字节码：access_flags 中设置 ACC_SYNCHRONIZED，JVM 自动加锁释放
```

### 2.2 Monitor 对象

```
每个 Java 对象关联一个 Monitor（C++ ObjectMonitor）

  Owner：    持有锁的线程
  count：    重入计数
  EntryList：阻塞等锁的线程队列
  WaitSet：  调用 wait() 的线程队列

获取锁：Owner = 当前线程，count++
重入：  count++（无需重新获取）
释放锁：count--，count=0 时 Owner=null，唤醒 EntryList
```

### 2.3 锁升级（JDK6+）

```
无锁 → 偏向锁 → 轻量级锁 → 重量级锁
 │       │         │           │
 │       │         │           └─ 竞争激烈，OS 介入，线程阻塞
 │       │         └─ 自旋 CAS，短时间竞争
 │       └─ 第一个线程获取，记录线程 ID，几乎无开销
 └─ 对象刚创建

只升级不降级
```

| 锁状态 | 场景 | 原理 | Mark Word 存储 | 标志位 |
|--------|------|------|---------------|--------|
| 偏向锁 | 只有一个线程访问 | 记录线程 ID，再入直接进入 | 线程 ID、Epoch | 01 |
| 轻量级锁 | 两个线程交替 | CAS + 自旋 | Lock Record 指针 | 00 |
| 重量级锁 | 真正竞争 | OS Mutex，线程阻塞 | Monitor 指针 | 10 |

> JDK15 默认关闭偏向锁，因为现代应用多线程竞争普遍，偏向锁撤销成本高。

---

## 三、ReentrantLock 原理（AQS）

### 3.1 AQS 是什么

```
AQS = AbstractQueuedSynchronizer（抽象队列同步器）

核心：volatile int state + CLH 双向队列
  - state：同步状态（子类定义含义）
  - CLH 队列：管理等待线程的排队与唤醒

谁依赖 AQS：
  ReentrantLock          → state = 重入次数
  ReentrantReadWriteLock → state 高16位读锁/低16位写锁
  Semaphore              → state = 许可数
  CountDownLatch         → state = 倒计数
```

### 3.2 模板方法模式

```
AQS 负责（框架骨架）：排队、阻塞、唤醒
子类负责（业务逻辑）：怎么获取/释放 state

子类实现的方法：
  tryAcquire()         独占式获取
  tryRelease()         独占式释放
  tryAcquireShared()   共享式获取
  tryReleaseShared()   共享式释放

AQS 已实现的模板方法：
  acquire()            独占获取（tryAcquire → 失败入队 → park → 唤醒重试）
  release()            独占释放（tryRelease → unpark 后继）
```

### 3.3 加锁流程

```
lock()
  │
  ├─ CAS 将 state 从 0 改为 1
  │   ├─ 成功 → 获取锁 ✅
  │   └─ 失败 ↓
  │
  ├─ 当前线程 == 持有锁线程？
  │   ├─ 是 → state++（可重入）✅
  │   └─ 否 ↓
  │
  └─ 封装 Node 入 CLH 队列 → park 挂起
      → 前驱释放锁时 unpark 唤醒 → 再次 CAS 竞争
```

### 3.4 解锁流程

```
unlock()
  │
  ├─ state-- > 0 → 还有重入，未真正释放
  │
  └─ state == 0 → 真正释放
      → exclusiveOwnerThread = null
      → unpark 后继节点
      → 后继节点被唤醒 → CAS 获取锁 ✅
```

### 3.5 CLH 队列怎么理解

#### 一句话

> CLH 队列就是一个**排号等锁的队伍**：线程抢锁失败就排到队尾挂起，持锁线程释放时叫醒下一个，下一个再去抢。

#### 用生活场景理解

```
想象银行办业务：

1. 你去银行（线程请求锁）
2. 窗口有人（锁被占用）→ 取号排队（封装成 Node 入队）
3. 你坐着等叫号（park 挂起，不占 CPU）
4. 前面的人办完离开（释放锁）→ 叫你的号（unpark 唤醒）
5. 你去窗口办业务（获取锁）
6. 办完离开 → 叫下一个号（unpark 后继）
```

#### 队列结构

```
head → Node(A) ←→ Node(B) ←→ Node(C) ← tail
         持有锁      等待中      等待中

每个 Node 包装一个等待的线程，双向链表，FIFO 先来先服务

head：哨兵节点（或持锁线程），不算排队的人
tail：队尾，新来的排在 tail 后面
prev：指向前一个（每个线程看前驱状态决定自己要不要等）
next：指向后一个（释放锁时叫醒后继）
```

#### 入队过程

```
线程抢锁失败：
  1. 创建 Node，CAS 挂到 tail 后面（无锁入队，避免多线程竞争 tail 时也加锁）
  2. 把自己 park 挂起（让出 CPU，不空转）
  3. 等前驱释放锁时 unpark 唤醒自己
  4. 被唤醒 → 再 CAS 抢锁 → 成功则出队，失败继续 park
```

#### 唤醒过程

```
持锁线程释放：
  1. state 置 0
  2. 找 head 后第一个未取消的 Node
  3. LockSupport.unpark(node.thread)  ← 叫醒它
  4. 被唤醒的线程从 park 处恢复 → CAS 抢锁 → 成功 → 成为新 head
```

#### 为什么用 CLH 而不是普通队列

```
1. 无锁入队：CAS 操作 tail，入队本身不需要加锁
2. 前驱感知：每个节点只看前驱状态（prev.waitStatus=SIGNAL 表示前驱会唤醒我）
   → 不需要遍历整个队列，只需检查前驱
3. 公平性保证：FIFO 入队，先来先服务（公平锁时严格保证）
4. 高效阻塞：park 挂起不占 CPU，比自旋等待省资源
```

#### 完整流程串联

```
线程A 持有锁，线程B、C、D 依次来抢：

  state=1, owner=A

  B 来了 → CAS 失败 → 创建 Node 入队尾 → park
  C 来了 → CAS 失败 → 创建 Node 入队尾 → park
  D 来了 → CAS 失败 → 创建 Node 入队尾 → park

  head → Node(A) ←→ Node(B) ←→ Node(C) ←→ Node(D) ← tail

  A 释放锁 → state=0 → unpark(B)
  B 被唤醒 → CAS 抢锁成功 → B 成为新 head

  head → Node(B) ←→ Node(C) ←→ Node(D) ← tail

  B 释放锁 → unpark(C) → C 抢锁 → ...
```

---

## 四、ReentrantLock 四大高级功能

### 4.1 可中断锁

```java
// synchronized：等锁时无法响应中断
// ReentrantLock：可以
lock.lockInterruptibly();
try {
    // 临界区
} finally {
    lock.unlock();
}
// 另一个线程调用 waitingThread.interrupt() → 等 lock 的线程收到异常，停止等待
```

**场景**：避免死锁时无法取消等锁线程。

### 4.2 超时获取

```java
if (lock.tryLock(3, TimeUnit.SECONDS)) {
    try { /* 获取到锁 */ }
    finally { lock.unlock(); }
} else {
    // 3秒未获取到，走降级
}
```

**场景**：防止长时间阻塞，做降级处理。

### 4.3 公平锁

```java
new ReentrantLock(true);  // 公平
new ReentrantLock(false); // 非公平（默认）
```

> 详见第五节。

### 4.4 多条件变量（Condition）

```java
// synchronized：1 个 wait/notify，唤醒随机线程，无法精确控制
// ReentrantLock：多个 Condition，分组等待、精确唤醒

private final ReentrantLock lock = new ReentrantLock();
private final Condition notFull  = lock.newCondition();
private final Condition notEmpty = lock.newCondition();

// 生产者
public void put(E item) throws InterruptedException {
    lock.lock();
    try {
        while (queue.size() == capacity) notFull.await();  // 等"未满"
        queue.add(item);
        notEmpty.signal();  // 通知"非空"
    } finally { lock.unlock(); }
}

// 消费者
public E take() throws InterruptedException {
    lock.lock();
    try {
        while (queue.isEmpty()) notEmpty.await();  // 等"非空"
        E item = queue.remove();
        notFull.signal();  // 通知"未满"
        return item;
    } finally { lock.unlock(); }
}
```

**痛点**：synchronized 的 notify() 随机唤醒，可能唤醒错误的线程；Condition 精确唤醒对应条件的线程。

---

## 五、公平锁 vs 非公平锁

### 区别

```
非公平锁（默认）：新线程先 CAS 抢锁，抢不到再排队 → 可能插队
公平锁：          新线程先看队列有没有人，有就排队 → 严格先来后到
```

| | 非公平锁 | 公平锁 |
|--|---------|--------|
| 吞吐量 | 高 | 低 |
| 饥饿 | 可能 | 不会 |
| 原理 | 先 CAS 抢，抢不到排队 | 先看队列，有就排队 |

### 为什么非公平吞吐高

```
线程A 释放锁 → 唤醒队列线程B（park 恢复需要时间）
线程C 刚到 → CAS 直接抢到锁 → 执行 → 释放

公平锁下：线程B 恢复期间锁空闲，浪费了
非公平锁：线程C 填补这段空闲 → 吞吐更高
```

### 什么场景用什么

| 选非公平（默认，99%场景） | 选公平 |
|------------------------|--------|
| 锁持有时间短（ms 级） | 锁持有时间长（s 级） |
| 高并发，吞吐优先 | 必须先到先得（排队/抢单系统） |
| 可接受偶尔饥饿 | 不允许线程饥饿 |

**判断依据**：有没有先到先得业务要求？锁持有时间长不长？有没有线程饥饿？都没有 → 非公平。

---

## 六、如何选择

```
能用 synchronized 就用 synchronized（简单、自动释放、JVM 优化好）

需要以下功能时用 ReentrantLock：
  ✅ 可中断获取锁
  ✅ 超时获取锁
  ✅ 公平锁
  ✅ 多条件变量（Condition）
  ✅ 锁状态查询
  ✅ 读写分离（ReentrantReadWriteLock）
```

| 场景 | 推荐 |
|------|------|
| 简单同步 | synchronized |
| 可中断/超时 | ReentrantLock |
| 公平锁 | ReentrantLock(true) |
| 生产者-消费者 | ReentrantLock + Condition |
| 读写分离 | ReentrantReadWriteLock |
| 防死锁 | ReentrantLock（tryLock） |

---

## 七、面试追问

**Q1: 什么是可重入锁？**

> 同一个线程获取锁后，再进入该锁保护的其他代码块，无需重新获取。synchronized 和 ReentrantLock 都是可重入锁。底层通过计数：重入 count++，释放 count--，count=0 时真正释放。

**Q2: synchronized 和 volatile 区别？**

> synchronized 保证原子性+可见性+有序性，会阻塞；volatile 只保证可见性+有序性，不保证原子性（i++ 仍不安全），不阻塞。volatile 用于状态标志，synchronized 用于复合操作。

**Q3: 为什么 synchronized 不用手动释放？**

> 编译器在同步块末尾和异常处自动生成 monitorexit 字节码。即使抛异常，JVM 也保证释放。ReentrantLock 是 API 层锁，JVM 无法感知，必须 finally 中手动 unlock。

**Q4: synchronized 锁升级能降级吗？**

> 不能。只升级不降级（无锁→偏向→轻量级→重量级）。降级收益不足以抵消竞争检测开销。

**Q5: 说说 AQS？**

> Java 并发包基石，核心是 volatile int state + CLH 双向队列。state 表示同步状态（锁重入次数/许可数/倒计数），CLH 队列管理等待线程的排队与唤醒。模板方法模式：AQS 负责排队阻塞唤醒，子类实现 tryAcquire/tryRelease 定义 state 获取释放逻辑。ReentrantLock、Semaphore、CountDownLatch 都基于它。

**Q6: ReentrantLock 忘记 unlock？**

> 锁不释放，其他线程永远等待 → 死锁。所以必须 finally 中 unlock。