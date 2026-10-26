---
title: Redis
date: 2024/08/01 20:46:25
article_id: 287aa477-3449-58e1-8ac5-345a1a0040f6
categories:
- Java
tags:
- Java
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-18.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-18.webp

---

# Redis[面试](https://blog.csdn.net/a745233700/category_10727715.html)

## 目录

- [Redis 核心原理](#redis-核心原理)
  - [什么是 Redis](#什么是-redis)
  - [Redis 为什么快](#redis-为什么快)
  - [数据结构底层实现](#数据结构底层实现)
  - [持久化机制](#持久化机制)
    - [RDB（Redis Database）](#rdbredis-database)
    - [AOF（Append Only File）](#aofappend-only-file)
    - [混合持久化（4.0+）](#混合持久化40)
  - [过期键删除策略](#过期键删除策略)
  - [内存淘汰策略](#内存淘汰策略)
  - [集群方案](#集群方案)
    - [主从复制](#主从复制)
    - [Sentinel 哨兵](#sentinel-哨兵)
    - [Cluster 集群（3.0+）](#cluster-集群30)
- [数据类型](#数据类型)
- [docker-redis](#docker-redis)
- [1.3springboot集成redis](#13springboot集成redis)
- [缓存穿透、缓存击穿、缓存雪崩](#缓存穿透缓存击穿缓存雪崩)
  - [一致性](#一致性)
  - [redisssion![image-20230216203236229](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230216203236229.png)](#redisssionimage-20230216203236229httpspfa-oss-exampleoss-cn-hangzhoualiyuncscomimgsimage-20230216203236229png)
  - [业务未执行完ttl过期问题](#业务未执行完ttl过期问题)
  - [秒杀业务解耦](#秒杀业务解耦)
- [常见面试问题](#常见面试问题)
  - [1. Redis 和 Memcached 的区别](#1-redis-和-memcached-的区别)
  - [2. 如何保证缓存与数据库的一致性](#2-如何保证缓存与数据库的一致性)
  - [3. Redis 单线程为什么还这么快](#3-redis-单线程为什么还这么快)
  - [4. 什么是缓存预热](#4-什么是缓存预热)
  - [5. 如何解决 Redis 缓存雪崩](#5-如何解决-redis-缓存雪崩)
  - [6. 布隆过滤器原理与应用](#6-布隆过滤器原理与应用)
  - [7. Redis 事务原理](#7-redis-事务原理)
  - [8. 分布式锁实现](#8-分布式锁实现)
  - [9. Redis 实现消息队列](#9-redis-实现消息队列)
  - [10. Redis 大 Key 问题](#10-redis-大-key-问题)
  - [11. Redis 热 Key 问题](#11-redis-热-key-问题)
  - [12. 如何实现 Redis 限流](#12-如何实现-redis-限流)
- [Redis 性能优化建议](#redis-性能优化建议)
  - [键值设计](#键值设计)
  - [内存优化](#内存优化)
  - [使用建议](#使用建议)

---

## Redis 核心原理

### 什么是 Redis

Redis（Remote Dictionary Server）是一个开源的内存数据结构存储系统，可用作数据库、缓存和消息中间件。它支持多种数据结构，包括字符串、哈希、列表、集合、有序集合等，并提供了丰富的功能如事务、持久化、Lua 脚本、发布订阅、集群等。

### Redis 为什么快

1. **纯内存操作**：数据存储在内存中，读写速度非常快
2. **单线程模型**：避免了多线程的上下文切换和锁竞争
3. **非阻塞 I/O**：使用 I/O 多路复用（epoll/kqueue）处理并发连接
4. **高效的数据结构**：底层实现经过优化，如 SDS、跳表等

### 数据结构底层实现

| 数据类型 | 底层编码 | 说明 |
|---------|---------|------|
| String | int、embstr、raw | 整数用 int，短字符串用 embstr，长字符串用 raw |
| List | ziplist、linkedlist、quicklist | 3.2+ 默认使用 quicklist |
| Hash | ziplist、hashtable | 元素少且值小时用 ziplist，否则用 hashtable |
| Set | intset、hashtable | 整数且元素少时用 intset，否则用 hashtable |
| Sorted Set | ziplist、skiplist | 元素少时用 ziplist，否则用 skiplist+dict |

### 持久化机制

#### RDB（Redis Database）

- **原理**：在指定时间间隔内，将内存中的数据快照写入磁盘
- **优点**：文件紧凑、恢复快、适合备份和灾难恢复
- **缺点**：可能丢失最后一次快照后的数据

```shell
save 900 1      # 900秒内至少1个键改变
save 300 10     # 300秒内至少10个键改变
save 60 10000   # 60秒内至少10000个键改变
```

#### AOF（Append Only File）

- **原理**：以日志形式记录每个写操作，追加到文件末尾
- **优点**：数据更安全，可读性好
- **缺点**：文件体积大，恢复速度相对较慢

```shell
appendonly yes                  # 开启 AOF
appendfsync everysec            # 每秒同步一次
auto-aof-rewrite-percentage 100 # 重写百分比
auto-aof-rewrite-min-size 64mb  # 最小重写大小
```

#### 混合持久化（4.0+）

- 结合 RDB 和 AOF 优点：前半部分是 RDB 格式的全量数据，后半部分是 AOF 格式的增量数据

### 过期键删除策略

1. **定时删除**：为每个过期键创建定时器，到期立即删除（内存友好，CPU 不友好）
2. **惰性删除**：访问键时才检查是否过期，过期则删除（CPU 友好，内存不友好）
3. **定期删除**：每隔一段时间抽取一些键检查并删除过期键（折中方案）

Redis 实际使用**惰性删除 + 定期删除**组合策略。

### 内存淘汰策略

当内存使用达到 maxmemory 限制时，Redis 会执行数据淘汰策略：

| 策略 | 说明 |
|-----|------|
| noeviction | 不淘汰，返回错误 |
| allkeys-lru | 从所有键中淘汰最近最少使用 |
| volatile-lru | 从设置了 TTL 的键中淘汰最近最少使用 |
| allkeys-lfu | 从所有键中淘汰最不经常使用（4.0+） |
| volatile-lfu | 从设置了 TTL 的键中淘汰最不经常使用（4.0+） |
| allkeys-random | 从所有键中随机淘汰 |
| volatile-random | 从设置了 TTL 的键中随机淘汰 |
| volatile-ttl | 淘汰即将过期的键 |

### 集群方案

#### 主从复制

```
      +----+
      |Master|
      +--+-+
         |
    +----+----+
    |         |
 +--v--+   +--v--+
 |Slave|   |Slave|
 +-----+   +-----+
```

- 一个 Master 可以有多个 Slave
- 数据单向复制：Master → Slave
- 支持级联复制：Slave 可以作为其他 Slave 的 Master

#### Sentinel 哨兵

- 监控主从节点健康状态
- 自动故障转移：Master 故障时自动提升 Slave 为 Master
- 配置中心：客户端通过 Sentinel 获取 Master 地址

#### Cluster 集群（3.0+）

- 数据分片：16384 个哈希槽，每个节点负责一部分槽
- 去中心化：无中心节点，客户端可连接任意节点
- 高可用：支持主从复制和故障转移

## 数据类型

```java
String: 字符串
Hash: 散列
List: 列表
Set: 集合
Sorted Set: 有序集合
sadd  
smembers set01:查看
sismenber key member:判断
scard key:length
srandmenber key number/-number :随机取出
spop key [count]:随机移除
smove set01 set02 key
sinter set01 [set02]:都有
sunion set01 set02 set03
    
list(有序有下标)
lpop/rpop(移除表尾)
lpush/rpush(尾)
lrange
lindex key index:指定列表下标
llen:length
lrem key count value

hash(无序不重复)
hset key  k1 v1 [k2 v2]
hmset stu1002 id 100 name lisi
hget key k1
hmget key k1 k2
hgetall：所有 k和v
hlen
hexists
hvals
hkeys stu001：获取所有key
hvals stu001:获取所以value
hsetnx:k有择失败

zset(有序集合  不能重复)

```

---

## docker-redis

```shell
1. config get requirepass       查看redis密码
2. *docker exec -it  redis /bin/bash*      进入redis容器
3. redis-cli -h host -p port -a password  进入redis
4. docker container rm  删除容器

# 关闭redis服务器
redis-cli -h 127.0.0.1 -p 6379 shutdown
# 杀死redis服务器（比较暴力，谨慎使用）
sudo kill -9 pid 进程号
# 指定配置文件启动redis
sudo redis-server /etc/redis/redis.conf
# 查看redis服务器进程
ps -ef | grep redis
ps aux | grep redis
# 启动redis客户端
redis-cli
redis-cli -h ip地址
redis-cli -p 端口号
```

---

## 1.3springboot集成redis

```java
# 引入maven依赖  
<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

---

## 缓存穿透、缓存击穿、缓存雪崩

> 一、缓存穿透
> 描述
>   指访问一个缓存和数据库中都不存在的key，由于这个key在缓存中不存在，则会到数据库中查询，数据库中也不存在该key，无法将数据添加到缓存中，所以每次都会访问数据库导致数据库压力增大。
>
> 解决方法
> 将空key添加到缓存中。
> 使用布隆过滤器过滤空key。
> 一般对于这种访问可能由于遭到攻击引起，可以对请求进行身份鉴权、数据合法行校验等。
> 二、缓存击穿
> 描述
>   指大量请求访问缓存中的一个key时，该key过期了，导致这些请求都去直接访问数据库，短时间大量的请求可能会将数据库击垮。
>
> 解决方法
>
> - 添加互斥锁或分布式锁，让一个线程去访问数据库，将数据添加到缓存中后，其他线程直接从缓存中获取。(通常方案-p44)
>
> ​       添加锁 setnx lock 1 100ttl(防止死锁)
>
> ​       删除锁delete lock
>
> ![image-20230216221945209](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230216221945209.png)
>
> ![image-20230216222801355](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230216222801355.png)
>
> - 热点数据key不过期，定时更新缓存，但如果更新出问题会导致缓存中的数据一直为旧数据。(根据业务场景)
>
> - 逻辑过期：子线程重建缓存
>
> ![image-20230216225122765](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230216225122765.png)
>
> 
>
> 三、缓存雪崩
> 描述
>   指在系统运行过程中，缓存服务宕机或大量的key值同时过期，导致所有请求都直接访问数据库导致数据库压力增大。
>
> 解决方法
> 将key的过期时间打散，避免大量key同时过期。
> 对缓存服务做高可用处理。
> 加互斥锁，同一key值只允许一个线程去访问数据库，其余线程等待写入后直接从缓存中获取。

### 一致性

- redis内存回收

- ttl过期时间

- 主动更新

  - 先删除缓存，在更新数据库
  - 先更新数据库在删除缓存（一般方案，操作内存快，操作数据库慢）

  

### redisssion![image-20230216203236229](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230216203236229.png)

- 可重入

![image-20230217213139563](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230217213139563.png)

![image-20230217213321261](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230217213321261.png)

![image-20230217213343531](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230217213343531.png)

```java
//redisson 可重入  可重试锁 

public boolean tryLock(long waitTime, long leaseTime, TimeUnit unit) throws InterruptedException {
        long time = unit.toMillis(waitTime);
        long current = System.currentTimeMillis();
        long threadId = Thread.currentThread().getId();
        Long ttl = tryAcquire(leaseTime, unit, threadId);
        // lock acquired
    //拿到锁 返回
        if (ttl == null) {
            return true;
        }
         
        time -= System.currentTimeMillis() - current;
        if (time <= 0) {
            acquireFailed(threadId);
            return false;
        }
        
        current = System.currentTimeMillis();
        RFuture<RedissonLockEntry> subscribeFuture = subscribe(threadId);
        if (!await(subscribeFuture, time, TimeUnit.MILLISECONDS)) {
            if (!subscribeFuture.cancel(false)) {
                subscribeFuture.onComplete((res, e) -> {
                    if (e == null) {
                        unsubscribe(subscribeFuture, threadId);
                    }
                });
            }
            acquireFailed(threadId);
            return false;
        }

        try {
            time -= System.currentTimeMillis() - current;
            if (time <= 0) {
                acquireFailed(threadId);
                return false;
            }
        
            while (true) {
                long currentTime = System.currentTimeMillis();
                ttl = tryAcquire(leaseTime, unit, threadId);
                // lock acquired
                if (ttl == null) {
                    return true;
                }

                time -= System.currentTimeMillis() - currentTime;
                if (time <= 0) {
                    acquireFailed(threadId);
                    return false;
                }

                // waiting for message
                currentTime = System.currentTimeMillis();
                if (ttl >= 0 && ttl < time) {
                    getEntry(threadId).getLatch().tryAcquire(ttl, TimeUnit.MILLISECONDS);
                } else {
                    getEntry(threadId).getLatch().tryAcquire(time, TimeUnit.MILLISECONDS);
                }

                time -= System.currentTimeMillis() - currentTime;
                if (time <= 0) {
                    acquireFailed(threadId);
                    return false;
                }
            }
        } finally {
            unsubscribe(subscribeFuture, threadId);
        }
//        return get(tryLockAsync(waitTime, leaseTime, unit));
    }
```

### 业务未执行完ttl过期问题

- redisson锁

  > 可重入：redis的hash结构
  >
  > 可重试：waitTime 、leaseTiem（TTl）、锁释放消息订阅
  >
  > 业务超时锁过期问题：判断leasTiem是否等于-1启用watchdog（看门狗）
  >
  > 分布式集群一致性问题：不分主库和从库，multLock多把锁结合成一把锁

### 秒杀业务解耦

![image-20230219132835067](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230219132835067.png)

![image-20230219133419541](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230219133419541.png)

**生成订单**

```lua
--  判断是否下单---->
-- 1.参数列表
-- 1.1.优惠券id
local voucherId = ARGV[1]
-- 1.2.用户id
local userId = ARGV[2]
-- 1.3.订单id
local orderId = ARGV[3]

-- 2.数据key
-- 2.1.库存key
local stockKey = 'seckill:stock:' .. voucherId
-- 2.2.订单key
local orderKey = 'seckill:order:' .. voucherId

-- 3.脚本业务
-- 3.1.判断库存是否充足 get stockKey
if(tonumber(redis.call('get', stockKey)) <= 0) then
    -- 3.2.库存不足，返回1
    return 1
end
-- 3.2.判断用户是否下单 SISMEMBER orderKey userId
if(redis.call('sismember', orderKey, userId) == 1) then
    -- 3.3.存在，说明是重复下单，返回2
    return 2
end
-- 3.4.扣库存 incrby stockKey -1
redis.call('incrby', stockKey, -1)
-- 3.5.下单（保存用户）sadd orderKey userId
redis.call('sadd', orderKey, userId)
-- 3.6.发送消息到队列中， XADD stream.orders * k1 v1 k2 v2 ...   下单队列
redis.call('xadd', 'stream.orders', '*', 'userId', userId, 'voucherId', voucherId, 'id', orderId)
return 0
```

**消费订单**

- redis:扣减库存,使用阻塞队列指令LRPUSH、LRPOP

![image-20230219165204989](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230219165204989.png)

- 订阅型消费

  SUBSCRIBLE、PUBLISH

  ![image-20230219170532961](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20230219170532961.png)

- stream实现消息队列
  - XADD: XADD S! * k1 v1
  - XREDE:XREAD COUNT 0  [block  0] SREAMS S1 0（哪个singal）   $(最新)
  - XLEN
  
  缺点：有消息遗漏，由于是阻塞的消息队列，当拿到最新的消息后，中间有连续几条新校西，只会拿到最后的消息
  
- stream消息消费组

  - XGROUP

---

## 常见面试问题

### 1. Redis 和 Memcached 的区别

| 对比项 | Redis | Memcached |
|-------|-------|-----------|
| 数据类型 | 5种基本类型 + 多种高级结构 | 仅 String |
| 持久化 | 支持 RDB 和 AOF | 不支持 |
| 内存淘汰 | 8种策略 | LRU |
| 分布式 | 原生 Cluster 或 Sentinel | 需要客户端分片 |
| 单value大小 | 最大 512MB | 最大 1MB |
| 线程模型 | 单线程（6.0+ 多线程 I/O） | 多线程 |

### 2. 如何保证缓存与数据库的一致性

**方案一：先更新数据库，再删除缓存（推荐）**

```java
// 1. 更新数据库
db.update(user);
// 2. 删除缓存
redis.del(key);
```

**方案二：先删除缓存，再更新数据库（可能有并发问题）**

```java
// 1. 删除缓存
redis.del(key);
// 2. 更新数据库
db.update(user);
```

**方案三：延迟双删**

```java
// 1. 删除缓存
redis.del(key);
// 2. 更新数据库
db.update(user);
// 3. 延迟再次删除（防止并发更新期间有旧数据写入缓存）
Thread.sleep(500);
redis.del(key);
```

**方案四：基于 Binlog 的异步更新（Canal + MQ）**

### 3. Redis 单线程为什么还这么快

1. 纯内存操作：数据都在内存里，读写速度快
2. 单线程避免了上下文切换和锁竞争
3. I/O 多路复用模型：使用 epoll/kqueue 处理并发连接
4. 高效的数据结构：SDS、跳表、压缩列表等

> 注意：Redis 6.0+ 引入了多线程 I/O，但执行命令的主线程仍是单线程。

### 4. 什么是缓存预热

缓存预热是指系统启动时，提前将热点数据加载到缓存中，避免用户请求直接打到数据库。

**实现方式：**
- 编写脚本在应用启动时加载热点数据
- 定时任务刷新热点数据
- 用户请求时懒加载 + 异步刷新

### 5. 如何解决 Redis 缓存雪崩

缓存雪崩是指大量缓存同时失效或缓存服务宕机，导致所有请求直接打到数据库。

**解决方案：**
- **过期时间打散**：在基础过期时间上增加随机值
- **缓存服务高可用**：Redis 主从 + Sentinel 或 Cluster
- **服务降级与熔断**：使用 Hystrix/Sentinel 保护数据库
- **永不过期**：热点数据不设置过期时间，后台异步更新

### 6. 布隆过滤器原理与应用

**原理：**
- 利用位数组和多个哈希函数
- 元素通过多个哈希函数映射到位数组的多个位置
- 判存时检查所有映射位置是否都为 1

**特点：**
- 可能误判（说存在可能不存在），但不会漏判（说不存在一定不存在）
- 不能删除元素（Counting Bloom Filter 支持）

**应用场景：**
- 缓存穿透防护
- 垃圾邮件过滤
- URL 去重

```java
// Guava BloomFilter 示例
BloomFilter<String> bloomFilter = BloomFilter.create(
    Funnels.stringFunnel(StandardCharsets.UTF_8),
    1000000,  // 预期元素数量
    0.01      // 误判率
);
```

### 7. Redis 事务原理

Redis 事务通过 MULTI、EXEC、DISCARD、WATCH 四个命令实现：

```shell
MULTI         # 开启事务
SET key1 v1
SET key2 v2
EXEC          # 执行事务 / DISCARD 取消事务
```

**特点：**
- 批量操作送入队列，EXEC 时原子执行
- 不支持回滚（某条命令失败，后续仍会执行）
- WATCH 可实现乐观锁：监视的 key 被修改则事务中止

### 8. 分布式锁实现

**方案一：SETNX + EXPIRE（有竞态问题）**

```shell
SETNX lock 1
EXPIRE lock 10  # 分两步，若中间崩溃会死锁
```

**方案二：SET 原子命令（推荐）**

```shell
SET lock uuid NX PX 30000  # 同时设置值和过期时间
```

**方案三：Redisson（生产环境常用）**

```java
RLock lock = redisson.getLock("myLock");
lock.lock();          // 阻塞获取
lock.tryLock(10, 30, TimeUnit.SECONDS);  // 尝试获取
lock.unlock();
```

### 9. Redis 实现消息队列

**方案一：List + LPUSH / BRPOP**

```shell
LPUSH queue msg1 msg2
BRPOP queue 0  # 0表示无限等待
```

**方案二：Pub/Sub（发布订阅）**

```shell
SUBSCRIBE channel
PUBLISH channel msg
```

**方案三：Stream（5.0+，推荐）**

```shell
XADD stream * name foo age 20  # 追加消息
XREAD COUNT 1 BLOCK 0 STREAMS stream 0  # 读取
XGROUP CREATE stream group1 0  # 创建消费组
XREADGROUP GROUP group1 consumer1 COUNT 1 STREAMS stream >  # 消费组读取
```

### 10. Redis 大 Key 问题

**什么是大 Key：**
- String 类型 value 超过 10KB
- List/Hash/Set/ZSet 元素数量超过 5000

**危害：**
- 内存分布不均
- 网络阻塞
- 超时
- 删除时阻塞主线程

**解决方案：**
- 拆分：将大 Key 拆分为多个小 Key
- 逐步删除：使用 UNLINK（非阻塞删除）代替 DEL
- 监控：定期使用 `--bigkeys` 或 `--memkeys` 扫描

```shell
redis-cli --bigkeys
```

### 11. Redis 热 Key 问题

**热 Key：** 某个 Key 被高频访问，导致该 Key 所在节点负载过高。

**解决方案：**
- **本地缓存**：应用层使用 Caffeine/Guava Cache 缓存热点数据
- **Key 分片**：将热 Key 复制到多个 Key，分散压力
- **集群负载均衡**：确保热 Key 分散在不同节点

### 12. 如何实现 Redis 限流

**方案一：基于 ZSet 的滑动窗口**

```lua
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- 移除窗口外的记录
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
-- 获取当前窗口内的请求数
local count = redis.call('ZCARD', key)
if count >= limit then
    return 0
end
-- 记录当前请求
redis.call('ZADD', key, now, now)
redis.call('EXPIRE', key, window + 1)
return 1
```

**方案二：令牌桶 / 漏桶算法**

**方案三：Redis-Cell（4.0+ 模块）**

```shell
CL.THROTTLE user123 15 30 60 1
```

---

## Redis 性能优化建议

### 键值设计
- Key 名简洁明了，控制在 39 字节内（embstr 编码）
- 避免 Big Key，合理拆分
- 统一命名规范，如 `业务:模块:id`

### 内存优化
- 使用 ziplist 等紧凑编码（注意配置 `hash-max-ziplist-entries` 等）
- 合理设置过期时间
- 使用对象共享池（整数对象）
- 开启内存淘汰策略

### 使用建议
- 避免使用 KEYS *，使用 SCAN 代替
- 尽量使用批量命令（MGET、MSET、HMSET）
- 合理使用 Pipeline
- Lua 脚本控制原子性，但避免脚本过长
- 慢查询监控：`SLOWLOG GET 10`
