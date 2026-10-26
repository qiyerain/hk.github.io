---
title: MySQL
date: 2024/08/01 20:46:25
article_id: 4bc5783f-3e86-59ad-b8cd-2f4cfd3318af
categories:
- Java
tags:
- Java
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-17.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-17.webp

---

# Mysql篇

## 目录

  - [0825](#0825)
  - [一对多null的问题](#一对多null的问题)

---

1. ### **事务**：**atomicity、consistency、isolation、durability**

   xxxxxxxxxx ONBOOT=“yes” 表示启用该网卡IPADDR=192.168.11.11 指定一个静态IPGATEWAY=192.168.1.1 指定网关DNS1=8.8.8.8 连接外网需要配置 域名解析服务器DNS2=223.5.5.5static表示配置静态IP

   propagation_requierd：如果当前没有事务，就新建一个事务，如果已存在一个事务中，加入到这个事务中，这是最常见的选择(spring默认事务传播行为)
2. ### 数据表的类型：MylSAM 、InnoDB 、HEAP、BOB 、CSV
3. ```
   修改数据库:AlTER
   修改表名 :ALTER TABLE 旧表名 RENAME AS 新表名
   添加字段 : ALTER TABLE 表名 ADD字段名 列属性[属性]
   ```
4. ### 外键

   + ~~~sql
     -- 创建外键的方式一 : 创建子表同时创建外键

     -- 年级表 (id\年级名称)
     CREATE TABLE `grade` (
     `gradeid` INT(10) NOT NULL AUTO_INCREMENT COMMENT '年级ID',
     `gradename` VARCHAR(50) NOT NULL COMMENT '年级名称',
     PRIMARY KEY (`gradeid`)
     ) ENGINE=INNODB DEFAULT CHARSET=utf8

     -- 学生信息表 (学号,姓名,性别,年级,手机,地址,出生日期,邮箱,身份证号)
     CREATE TABLE `student` (
     `studentno` INT(4) NOT NULL COMMENT '学号',
     `studentname` VARCHAR(20) NOT NULL DEFAULT '匿名' COMMENT '姓名',
     `sex` TINYINT(1) DEFAULT '1' COMMENT '性别',
     `gradeid` INT(10) DEFAULT NULL COMMENT '年级',
     `phoneNum` VARCHAR(50) NOT NULL COMMENT '手机',
     `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
     `borndate` DATETIME DEFAULT NULL COMMENT '生日',
     `email` VARCHAR(50) DEFAULT NULL COMMENT '邮箱',
     `idCard` VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
     PRIMARY KEY (`studentno`),
     KEY `FK_gradeid` (`gradeid`),
     CONSTRAINT `FK_gradeid` FOREIGN KEY (`gradeid`) REFERENCES `grade` (`gradeid`)
     ) ENGINE=INNODB DEFAULT CHARSET=utf8
     ~~~
   + ```sql
     -- 创建外键方式二 : 创建子表完毕后,修改子表添加外键
     ALTER TABLE `student`
     ADD CONSTRAINT `FK_gradeid` FOREIGN KEY (`gradeid`) REFERENCES `grade` (`gradeid`);
     ```
5. ### delete和truncate:

   TRUNCATE TABLE 重新设置AUTO_INCREMENT计数器

---

### 0825

1. ```sql
   select DATE_FORMAT("2022-10-01 22:30:40",'%Y-%m-%d %H') as date
   ```

   - % :12小时制
   - %H:24小时制度
2. DATEDIFF() 函数用于返回两个日期之间的天数。 语法：DATEDIFF(date1,date2) date1 和 date2
   参数是合法的日期或日期/时间表达式。 注释：

   - 只有值的日期部分参与计算。
   - 当日期date1<date2时函数返回值为正数,date1=date2时函数返回值为0，date1>date2 时函数返回值为负数。
   - Mysql的DATEDIFF只有两个参数。
3. sql基础

   ```sql
   SELECT DATE_ADD(CURRENT_TIME, INTERVAL -10 DAY);
   SELECT CURDATE()
   SELECT CURRENT_TIME
   SELECT CURRENT_DATE
   SELECT NOW()
   select date(now())
   ```
4. [#{}和${}的区别是什么](https://blog.csdn.net/qq_40277163/article/details/124756536)

   > （1）mybatis在处理#{}时，会将sql中的#{}替换为?号，调用PreparedStatement的set方法来赋值。
   >
   > （2）使用#{}可以有效的防止SQL注入，提高系统安全性。原因在于：预编译机制。预编译完成之后，SQL的结构已经固定，即便用户输入非法参数，也不会对SQL的结构产生影响，从而避免了潜在的安全风险。
   >
   > （3）预编译是提前对SQL语句进行预编译，而其后注入的参数将不会再进行SQL编译。我们知道，SQL注入是发生在编译的过程中，因为恶意注入了某些特殊字符，最后被编译成了恶意的执行操作。而预编译机制则可以很好的防止SQL注入。${}在 MyBatis 中带有该占位符的 SQL 片段会被解析成动态 SQL 语句,存在sql注入安全问题。
   >

### 一对多null的问题

```sql
CREATE TABLE `t1` (
  `id` bigint NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `t2` (
  `id` bigint NOT NULL,
  `parent` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

left join：左边位主表，一对（左）多（右表），左边会自动补，右边没有为null---->项目导出特殊，没有推进能看到项目也要导出

```
