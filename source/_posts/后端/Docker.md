---
title: Docker
date: 2024-07-21 20:26:16
article_id: 4a6aa21a-090a-5e75-8e3f-0e7fbf6f9133
tags:
- docker
categories:
- 后端
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-08.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-08.webp

---

# Docker

## 目录

  - [[命令全](https://blog.csdn.net/weixin_39906114/article/details/111157328)](#命令全httpsblogcsdnnetweixin_39906114articledetails111157328)

---

### [命令全](https://blog.csdn.net/weixin_39906114/article/details/111157328)

1. Docker启动
```shell
   运行交互式的容器
   docker run -i -t  ubuntu:15.10 /bin/bash
   
   
   -t: 在新容器内指定一个伪终端或终端。
   
   -i: 允许你对容器内的标准输入 (STDIN) 进行交互。
   -d:  我们希望 docker 的服务是在后台运行的，我们可以过 -d 指定容器的运行模式。加了 -d 参数默认不会进入容器，想要进入容器需要使用指令 docker exec（下面会介绍到）。
   -P:将容器内部使用的网络端口随机映射到我们使用的主机上。
```

2. 简单命令
   载入ubantu镜像：**docker pull ubuntu**

   启动容器:**docker run -it ubuntu /bin/bash**

   查看所有容器： **docker ps -a**

   导出容器：**docker export 1e560fca3906 > ubuntu.tar**

   **导入容器快照**:可以使用 docker import 从容器快照文件中再导入为镜像，以下实例将快照文件 ubuntu.tar 导入到镜像 test/ubuntu:v1:

   ```shell
   $ cat docker/ubuntu.tar | docker import - test/ubuntu:v1
   
   $ docker import http://example.com/exampleimage.tgz example/imagerepo
   ```

   删除容器：docker rm -f 1e560fca3906

   [进入容器](https://blog.csdn.net/Starrysky_LTL/article/details/121168670)：

   - docker exec -it 容器id /bin/bash
   - docker attach 容器id

   tip: 
   (1)在使用 **-d** 参数时，容器启动后会进入后台。可以使用**docker attach**

   (2)**docker exec**：推荐大家使用 docker exec 命令，因为此命令会退出容器终端，但不会导致容器的停止。

3. 什么是容器技术、镜像、与宿主机的关系、与虚拟机的不同

   - 容器技术是虚拟化技术的一种，以 Docker 为例，Docker 利用 Linux 的 LXC(LinuX Containers)技术、CGroup(Controll Group)技术 和 AUFS(Advance UnionFileSystem)技术等，通过对进程和资源加以限制，进行调控，隔离出来一套供程序运行的环境。
   - 我们把这一环境称为 “ 容器 ”，把构建该 “ 容器 ” 的 “ 只读模板 ”，称之为 “ 镜像 ”。
   -  虽然容器与宿主机在环境上，逻辑上是隔离的，**但容器与宿主机共享内核**，容器直接依赖于宿主机Linux系统的内核，这与虚拟机不同，后者是在宿主机的操作系统上，**虚拟化一套硬件环境**，然后在此环境上运行需要的操作系统。

4. 分布式与集群

   分布式就是把一个系统拆分开来部署到不同机器，与集群相同的是，两者都需要多台服务器，不同点是分布式并不强调实现**相同的业务**。

   貌似网上大多数资料，对于集群和分布式的区分，都执着于两者是否实现相同的业务，即不同服务器运行同一份功能就是集群，运行不同功能就是分布式。

   个人看法是，**集群**强调的是“集”、“统一的概念”，是物理上的、环境上的概念，只要是多台计算机搞在一起就是集群；

   而**分布式**，更多的是描述应用系统的部署方式，把一个系统拆开部署到不同服务器，就是分布式。

5. docker启动自动运行
```shell
   设置docker开机自启动

   systemctl enable docker

   docker中的mysql开机自动启动

   docker update mysql --restart=always
```
