---
title: Mybatis
date: 2024/08/01 20:46:25
article_id: 272676f2-1e68-5b8d-bba2-ca64a701cfda
categories:
- Java
tags:
- Java
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-16.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-16.webp

---

# Mybatis-Generate

## 目录

    - [0823](#0823)
    - [0922](#0922)

---

---

#### 0823

1、自动生成配置文件：https://blog.csdn.net/zengqiang1/article/details/79381418?spm=1001.2101.3001.6661.1&utm_medium=distribute.pc_relevant_t0.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-1-79381418-blog-123915950.pc_relevant_multi_platform_whitelistv4&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-1-79381418-blog-123915950.pc_relevant_multi_platform_whitelistv4&utm_relevant_index=1

___

# RabbitMQ

#### 0922

1. RabbitMQ是一款由Erlang语言开发的消息队列,消息发送者无需关心将消息发送给谁

2. > 消费模型
   >
   > - 简单消息模型`Hello World`
   > - 竞争消费模型`work`
   > - 订阅发布
   >   - 广播模型`Fanout`
   >   - 定向模型`Direct`
   >   - 话题模型`Topic`

3. 优点：

   > 流量削风
   >  例如12306春运前的购票，大量的下单请求到达后端服务器，很有可能服务器无法承受这样的压力，假设就算服务器能够承受，那么数据库也无法承受这样的并发量。所以可以先放入消息队列里，缓速执行后续逻辑。也可以设置队列的长度，当任务超过这个长度时，则直接抛弃这个任务，返回给用户一个提示。
   >
   > 解耦
   >  应用间协作，例如有三个微服务，分别为下单、减库存、发货。用户下单后，将消息写入消息队列中，减库存微服务收到消息后进行减库存操作之后再写入消息队列，发货微服务收到消息后执行发货业务逻辑。这时，就算发货微服务宕机，未完成的任务也依旧在队列中未被消费，也不会丢失。当发货微服务重新顶上来的时候，便可以继续消费。

> 推荐文章：https://blog.csdn.net/Pratik_shiku/article/details/120439606
