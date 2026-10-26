---
title: 安装Linux系统
date: 2024/08/01 20:46:25
article_id: 283548db-c148-5bfe-9df2-0a546796cc3e
categories:
- Java
tags:
- Java
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-01.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-01.webp

---

# dell 服务器 重装Linux系统

## 目录

- [安装前的准备工作](#安装前的准备工作)
- [进入BIOS界面](#进入bios界面)
- [安装centos](#安装centos)
  - [配置固定ip](#配置固定ip)

---

## 安装前的准备工作

1、8G左右的U盘

2、镜像下载选择DVD版本的

3、使用Utralso工具刻入镜像到U盘

## 进入BIOS界面

1、关闭安全启动，将Secure boot关闭

2、将SATA operation 改为AHCI

3、关机，插入u盘重启

参考链接：https://www.cuanjibang.com/yjzx/51892.html

## 安装centos

1、重启后选择 Disk connected to front USB, 从U盘启动

2、出现linux安装界面，进入linux系统安装步骤

```
1. 在出现i8042的错误页面，继续等待，一直到滚动错误提示停止，进入一个命令行输入界面；
2. 在命令行输入界面，输入
ls /dev/sd*
列出当前系统所有的存储设备，找到你的U盘启动盘的路径；(重新插拔U盘可判断存储设备的)
如 /dev/sdb4
3. 确认U盘启动盘路径后，输入Reboot重启系统，重新进入安装列表界面；
4. 选中install centos 7 列表，按 e 键，进入编辑界面；
5.	找到			inst.stage2=hd:LABEL=CentOS\x207\x20x86_64 rd.live.check quiet
   	把段修改为：	initrd=initrd.img inst.stage2=hd:/dev/sdb4:/ quiet
	就是将hd:和quiet之间的内容修改为U盘的路径，注意要写成/dev/sdb4:/
6. 修改之后，直接按Ctrl + X，进入安装界面；如果仍出现上述错误，则说明U盘路径错误，重新确定U盘路径
在此安装界面按 e 进入编辑模式

```

参考链接：:https://blog.csdn.net/qq_41672211/article/details/124660478

### 配置固定ip

- vi   /etc/sysconfig/network-scripts/ifcfg-ens33

- 编辑网卡

```static表示配置静态IP
ONBOOT=“yes” 表示启用该网卡
IPADDR=192.168.11.11 指定一个静态IP
GATEWAY=192.168.1.1 指定网关
DNS1=8.8.8.8 连接外网需要配置 域名解析服务器
DNS2=223.5.5.5
```

- service network restart
