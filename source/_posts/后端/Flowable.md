---
title: Flowable
date: 2024/08/01 20:46:25
article_id: 869cdd90-cc74-5fa4-bf65-599cc54c517e
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-09.webp
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-09.webp
categories:
- Java
tags:
- Java

---

# Flowable

## 目录

- [一、介绍](#一介绍)
- [二、概念](#二概念)
  - [流程部署](#流程部署)
  - [流程定义](#流程定义)
  - [流程实例](#流程实例)
  - [执行实例](#执行实例)
  - [活动实例](#活动实例)
- [三、制作流程图](#三制作流程图)
  - [flowable-ui](#flowable-ui)
  - [流程模板文件的一些概念](#流程模板文件的一些概念)
  - [请假流程模板案例](#请假流程模板案例)
- [四、springboot集成flowable](#四springboot集成flowable)
  - [引入依赖](#引入依赖)
  - [配置数据源](#配置数据源)
  - [核心api](#核心api)
  - [部署流程](#部署流程)
  - [启动流程](#启动流程)
  - [删除流程](#删除流程)
  - [推进流程](#推进流程)
  - [流程历史](#流程历史)

---

## 一、介绍

Flowable是BPMN的一个基于java的软件实现，不过Flowable不仅仅包括BPMN，还有DMN决策表和CMMN Case管理引擎，并且有自己的用户管理、微服务API等一系列功能，是一个服务平台。

![image-20220317101115398](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20220317101115398.png)

## 二、概念

### 流程部署

一次流程部署会在act_re_deployment表中生成一条记录，一次可部署一个或者多个流程模板

### 流程定义

流程定义 ProcessDefinition 这个好说，将一个流程 XML 文件部署到 flowable 中，对应的数据在act_re_procdef表中，这就是一个定义好的流程了，基于这个定义好的流程，我们可以开启很多流程实例

### 流程实例

流程实例 ProcessInstance 就是通过流程定义启动的一个流程，他表示一个流程从开始到结束的最大的流程分支，在一个流程中，只存在一个流程实例，流程实例和流程定义的关系就类似于 Java 对象和 Java 类之间的关系

### 执行实例

首先从类的关系上来看，ProcessInstance 就是 Execution 的子类。

流程实例通常是执行实例的根结点，即在一个流程中，出口和入口可以算是一个流程实例的节点，而中间的过程则是执行实例。

假如流程本身就是一条线，那么流程实例和执行实例基本上是一样的，但是如果流程中包含多条线，例如下图：

![图片](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/640.png)

这张图中有并行网关，并行任务执行的时候，每一个并行任务就是一个执行实例，这样大家就好理解了

### 活动实例

流程实例创建后走过的线路上每一条的线、任务、网关、事件都是活动实例，具体信息保存在act_ru_actinst表中，流程走完后保存在act_hi_actinst表中

关系图

![image-20220324095243595](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20220324095243595.png)

## 三、制作流程图

### flowable-ui

``` shell
#docker 部署
#拉取镜像
docker pull flowable/flowable-ui

#运行
docker run -d -p 8080:8080 flowable/flowable-ui

#访问
http://localhost:8080/flowable-ui
user: admin
password: test
```

登录flowable-ui后进入首页界面

![image-20221014100745127](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20221014100745127.png)

进入建模器应用程序点击创建流程图

![image-20240912090313683](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20240912090313683.png)

###  流程模板文件的一些概念

- `<process>` ：表示一个完整的工作流程。

- `<startEvent>` ：工作流中起点位置，也就是图中的绿色按钮。

- `<endEvent>` ：工作流中结束位置，也就是图中的红色按钮。

- `<userTask>` ：代表一个任务审核节点（组长、经理等角色），这个节点上有一个 `flowable:assignee` 属性，这表示这个节点该由谁来处理，将来在 Java 代码中调用的时候，我们需要指定对应的处理人的 ID 或者其他唯一标记。

- `<serviceTask>`：这是服务任务，在具体的实现中，这个任务可以做任何事情。

- `<sequenceFlow>` ：链接各个节点的线条，sourceRef 属性表示线的起始节点，targetRef 属性表示线指向的节点，我们图中的线条都属于这种。

-  网关：包含网关，标签后缀为Gateway的都为网关

  > 排他网关（常用）：排他网关（exclusive gateway）（也叫*异或网关 XOR gateway*，或者更专业的，*基于数据的排他网关 exclusive data-based gateway*），用于对流程中的决策建模。当执行到达这个网关时，会按照所有出口顺序流定义的顺序对它们进行计算。选择第一个条件计算为true的顺序流（当没有设置条件时，认为顺序流为*true*）继续流程。排他网关用内部带有’X’图标的标准网关（菱形）表示，'X’图标代表*异或*的含义。请注意内部没有图标的网关默认为排他网关
  >
  > 并行网关（常用）：并行网关允许将流程分成多条分支，也可以把多条分支汇聚到一起，并行网关的功能是基于进入和外出顺序流的
  >
  > 事件网关：包含网关可以看做是排他网关和并行网关的结合体。 和排他网关一样，你可以在外出顺序流上定义条件，包含网关会解析它们。 但是主要的区别是包含网关可以选择多于一条顺序流，这和并行网关一样。
  >
  > 包含网关：事件网关允许根据事件判断流向。网关的每个外出顺序流都要连接到一个中间捕获事件。 当流程到达一个基于事件网关，网关会进入等待状态：会暂停执行。与此同时，会为每个外出顺序流创建相对的事件订阅。

- 监听器：标签后缀带Listener的都为监听器，可在制作流程图时配置好监听器

  > 执行监听器
  >
  > 事件监听器
  >
  > 任务监听器（常用）

### 请假流程模板案例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:flowable="http://flowable.org/bpmn" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" typeLanguage="http://www.w3.org/2001/XMLSchema" expressionLanguage="http://www.w3.org/1999/XPath" targetNamespace="http://www.flowable.org/processdef" exporter="Flowable Open Source Modeler" exporterVersion="6.7.2">
  <process id="ask_for_leave" name="请假" isExecutable="true">
    <startEvent id="startNode1" name="请假" flowable:formFieldValidation="true">
      <extensionElements>
        <flowable:executionListener event="start" delegateExpression="${flowableExecutionListener}"></flowable:executionListener>
      </extensionElements>
    </startEvent>
    <userTask id="leader" name="分管领导审批" flowable:formFieldValidation="true">
      <extensionElements>
        <flowable:taskListener event="create" delegateExpression="${flowableTaskListener}"></flowable:taskListener>
      </extensionElements>
    </userTask>
    <userTask id="performance" name="绩效专员审批" flowable:formFieldValidation="true">
      <extensionElements>
        <flowable:taskListener event="create" delegateExpression="${flowableTaskListener}"></flowable:taskListener>
      </extensionElements>
    </userTask>
    <receiveTask id="team" name="通知团队成员">
      <extensionElements>
        <flowable:taskListener event="create" delegateExpression="${flowableTaskListener}"></flowable:taskListener>
      </extensionElements>
    </receiveTask>
    <receiveTask id="dept_helper" name="通知部门助手">
      <extensionElements>
        <flowable:taskListener event="create" delegateExpression="${flowableTaskListener}"></flowable:taskListener>
      </extensionElements>
    </receiveTask>
    <endEvent id="end" name="结束">
      <extensionElements>
        <flowable:executionListener event="end" delegateExpression="${flowableExecutionListener}"></flowable:executionListener>
      </extensionElements>
    </endEvent>
    <exclusiveGateway id="leader_audit"></exclusiveGateway>
    <parallelGateway id="sid-3769AE75-7F89-4B84-A3F9-1487B4B42881"></parallelGateway>
    <exclusiveGateway id="performance_aduit"></exclusiveGateway>
    <sequenceFlow id="sid-53190FDB-D757-438A-A198-74DCEF456ABD" sourceRef="leader" targetRef="leader_audit"></sequenceFlow>
    <endEvent id="error_end" name="结束">
      <extensionElements>
        <flowable:executionListener event="end" delegateExpression="${flowableExecutionListener}"></flowable:executionListener>
      </extensionElements>
      <terminateEventDefinition></terminateEventDefinition>
    </endEvent>
    <sequenceFlow id="sid-4E9D29F6-44BC-431A-919A-EF3E15876D0E" sourceRef="sid-3769AE75-7F89-4B84-A3F9-1487B4B42881" targetRef="team"></sequenceFlow>
    <sequenceFlow id="sid-B62FFD66-D3AD-4C02-9F3B-9FBA33FA0FF8" sourceRef="sid-3769AE75-7F89-4B84-A3F9-1487B4B42881" targetRef="dept_helper"></sequenceFlow>
    <sequenceFlow id="sid-005B6FAF-9609-4A8E-8BF5-6462EE026B0A" sourceRef="team" targetRef="end"></sequenceFlow>
    <sequenceFlow id="sid-102048FB-EFB1-4B2F-A460-6123DA5D9A84" sourceRef="dept_helper" targetRef="end"></sequenceFlow>
    <sequenceFlow id="sid-D111103A-C773-4E67-ADEB-0EBE63C8E6F6" name="拒绝" sourceRef="performance_aduit" targetRef="error_end">
      <conditionExpression xsi:type="tFormalExpression"><![CDATA[${!audit_result}]]></conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="sid-4E76E188-42A6-487B-8B06-80E76B26AD6E" name="拒绝" sourceRef="leader_audit" targetRef="error_end">
      <conditionExpression xsi:type="tFormalExpression"><![CDATA[${!audit_result}]]></conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="sid-196F616F-EB8F-4E3C-ADCD-0EBFD0E28C4E" name="通过" sourceRef="performance_aduit" targetRef="sid-3769AE75-7F89-4B84-A3F9-1487B4B42881">
      <conditionExpression xsi:type="tFormalExpression"><![CDATA[${audit_result}]]></conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="sid-D4DE4191-D133-45C7-86DB-B1392FBE706E" sourceRef="performance" targetRef="performance_aduit"></sequenceFlow>
    <sequenceFlow id="sid-E284EA7D-E566-4D09-BD62-4D4F786C2E80" name="通过" sourceRef="leader_audit" targetRef="performance">
      <conditionExpression xsi:type="tFormalExpression"><![CDATA[${audit_result}]]></conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="sid-7FD07E78-0667-418C-9C22-BD9D8A5A3319" sourceRef="startNode1" targetRef="leader"></sequenceFlow>
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_ask_for_leave">
    <bpmndi:BPMNPlane bpmnElement="ask_for_leave" id="BPMNPlane_ask_for_leave">
      <bpmndi:BPMNShape bpmnElement="startNode1" id="BPMNShape_startNode1">
        <omgdc:Bounds height="30.0" width="30.0" x="210.0" y="170.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="leader" id="BPMNShape_leader">
        <omgdc:Bounds height="80.0" width="100.0" x="390.0" y="145.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="performance" id="BPMNShape_performance">
        <omgdc:Bounds height="80.0" width="100.0" x="735.0" y="145.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="team" id="BPMNShape_team">
        <omgdc:Bounds height="80.0" width="100.0" x="1335.0" y="60.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="dept_helper" id="BPMNShape_dept_helper">
        <omgdc:Bounds height="80.0" width="100.0" x="1335.0" y="255.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="end" id="BPMNShape_end">
        <omgdc:Bounds height="28.0" width="28.0" x="1560.0" y="180.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="leader_audit" id="BPMNShape_leader_audit">
        <omgdc:Bounds height="40.0" width="40.0" x="570.0" y="165.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="sid-3769AE75-7F89-4B84-A3F9-1487B4B42881" id="BPMNShape_sid-3769AE75-7F89-4B84-A3F9-1487B4B42881">
        <omgdc:Bounds height="40.0" width="40.0" x="1170.0" y="165.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="performance_aduit" id="BPMNShape_performance_aduit">
        <omgdc:Bounds height="40.0" width="40.0" x="945.0" y="165.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape bpmnElement="error_end" id="BPMNShape_error_end">
        <omgdc:Bounds height="28.0" width="28.0" x="780.0" y="435.0"></omgdc:Bounds>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge bpmnElement="sid-4E9D29F6-44BC-431A-919A-EF3E15876D0E" id="BPMNEdge_sid-4E9D29F6-44BC-431A-919A-EF3E15876D0E" flowable:sourceDockerX="20.5" flowable:sourceDockerY="20.5" flowable:targetDockerX="50.0" flowable:targetDockerY="40.0">
        <omgdi:waypoint x="1204.358125" y="179.39285714285708"></omgdi:waypoint>
        <omgdi:waypoint x="1335.0" y="121.95745501285347"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-D4DE4191-D133-45C7-86DB-B1392FBE706E" id="BPMNEdge_sid-D4DE4191-D133-45C7-86DB-B1392FBE706E" flowable:sourceDockerX="50.0" flowable:sourceDockerY="40.0" flowable:targetDockerX="20.0" flowable:targetDockerY="20.0">
        <omgdi:waypoint x="834.9499999998408" y="185.0"></omgdi:waypoint>
        <omgdi:waypoint x="945.0" y="185.0"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-7FD07E78-0667-418C-9C22-BD9D8A5A3319" id="BPMNEdge_sid-7FD07E78-0667-418C-9C22-BD9D8A5A3319" flowable:sourceDockerX="15.0" flowable:sourceDockerY="15.0" flowable:targetDockerX="50.0" flowable:targetDockerY="40.0">
        <omgdi:waypoint x="239.94999960454757" y="185.0"></omgdi:waypoint>
        <omgdi:waypoint x="389.9999999999028" y="185.0"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-102048FB-EFB1-4B2F-A460-6123DA5D9A84" id="BPMNEdge_sid-102048FB-EFB1-4B2F-A460-6123DA5D9A84" flowable:sourceDockerX="50.0" flowable:sourceDockerY="40.0" flowable:targetDockerX="14.0" flowable:targetDockerY="14.0">
        <omgdi:waypoint x="1434.95" y="268.2804232804233"></omgdi:waypoint>
        <omgdi:waypoint x="1561.650064507481" y="200.5761306170835"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-D111103A-C773-4E67-ADEB-0EBE63C8E6F6" id="BPMNEdge_sid-D111103A-C773-4E67-ADEB-0EBE63C8E6F6" flowable:sourceDockerX="20.5" flowable:sourceDockerY="20.5" flowable:targetDockerX="14.0" flowable:targetDockerY="14.0">
        <omgdi:waypoint x="957.6149425287356" y="197.58465517241382"></omgdi:waypoint>
        <omgdi:waypoint x="801.6104872915953" y="437.2650092321877"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-005B6FAF-9609-4A8E-8BF5-6462EE026B0A" id="BPMNEdge_sid-005B6FAF-9609-4A8E-8BF5-6462EE026B0A" flowable:sourceDockerX="50.0" flowable:sourceDockerY="40.0" flowable:targetDockerX="14.0" flowable:targetDockerY="14.0">
        <omgdi:waypoint x="1434.95" y="124.84285714285714"></omgdi:waypoint>
        <omgdi:waypoint x="1561.4526663539648" y="187.76417930402073"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-196F616F-EB8F-4E3C-ADCD-0EBFD0E28C4E" id="BPMNEdge_sid-196F616F-EB8F-4E3C-ADCD-0EBFD0E28C4E" flowable:sourceDockerX="20.5" flowable:sourceDockerY="20.5" flowable:targetDockerX="20.0" flowable:targetDockerY="20.0">
        <omgdi:waypoint x="984.4880522088274" y="185.45758928571428"></omgdi:waypoint>
        <omgdi:waypoint x="1170.0444444444413" y="185.0443333333333"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-B62FFD66-D3AD-4C02-9F3B-9FBA33FA0FF8" id="BPMNEdge_sid-B62FFD66-D3AD-4C02-9F3B-9FBA33FA0FF8" flowable:sourceDockerX="20.5" flowable:sourceDockerY="20.5" flowable:targetDockerX="50.0" flowable:targetDockerY="40.0">
        <omgdi:waypoint x="1202.6233886879315" y="192.32574013157895"></omgdi:waypoint>
        <omgdi:waypoint x="1335.0" y="266.8508997429306"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-53190FDB-D757-438A-A198-74DCEF456ABD" id="BPMNEdge_sid-53190FDB-D757-438A-A198-74DCEF456ABD" flowable:sourceDockerX="50.0" flowable:sourceDockerY="40.0" flowable:targetDockerX="20.0" flowable:targetDockerY="20.0">
        <omgdi:waypoint x="489.95000000000005" y="185.0"></omgdi:waypoint>
        <omgdi:waypoint x="570.0" y="185.0"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-4E76E188-42A6-487B-8B06-80E76B26AD6E" id="BPMNEdge_sid-4E76E188-42A6-487B-8B06-80E76B26AD6E" flowable:sourceDockerX="20.5" flowable:sourceDockerY="20.5" flowable:targetDockerX="14.0" flowable:targetDockerY="14.0">
        <omgdi:waypoint x="598.7576552462526" y="196.19208413615925"></omgdi:waypoint>
        <omgdi:waypoint x="785.4423147838409" y="437.9138885614715"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge bpmnElement="sid-E284EA7D-E566-4D09-BD62-4D4F786C2E80" id="BPMNEdge_sid-E284EA7D-E566-4D09-BD62-4D4F786C2E80" flowable:sourceDockerX="20.5" flowable:sourceDockerY="20.5" flowable:targetDockerX="50.0" flowable:targetDockerY="40.0">
        <omgdi:waypoint x="609.4939335394023" y="185.45103092783506"></omgdi:waypoint>
        <omgdi:waypoint x="734.9999999999937" y="185.12840616966582"></omgdi:waypoint>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>
```

![image-20221014131734423](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20221014131734423.png)

任务监听器和执行监听器需配置java相关类

## 四、springboot集成flowable

### 引入依赖

```xml
<dependency>
                <groupId>org.flowable</groupId>
                <artifactId>flowable-spring-boot-starter</artifactId>
                <version>6.7.2</version>
 </dependency>
```

### 配置数据源

```java
    @Setter
    private DataSourceProperties datasource;  

    @Bean
    public EngineConfigurationConfigurer<SpringAppEngineConfiguration> engineConfigurer() {
        return configuration -> {
            configuration.setDataSource(getFlowableDataSource());
        };
    }

    public DataSource getFlowableDataSource() {
        return DataSourceBuilder.create()
            .url(datasource.getUrl())
            .driverClassName(datasource.getDriverClassName())
            .username(datasource.getUsername())
            .password(datasource.getPassword())
            .build();
    }

```

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: 123456
    url: jdbc:mysql://localhost:3306/dyyun_workflow?useUnicode=true&characterEncoding=utf-8&allowMultiQueries=true&useSSL=false

flowable:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: 123456
    url: jdbc:mysql://localhost:3306/dyyun_flowable?useUnicode=true&characterEncoding=utf-8&allowMultiQueries=true&useSSL=false
```

![image-20221014142918883](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20221014142918883.png)

由于flowable自带的表过多，为将实际业务所需数据库表分开，可以为flowable配置自定义数据源

监听器Java类配置

```java
package com.example.flowable.demo.listener;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.TaskService;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.ExecutionListener;
import org.flowable.task.api.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FlowableExecutionListener implements ExecutionListener {

    @Autowired
    private TaskService taskService;

    @Override
    public void notify(DelegateExecution execution) {

        log.info(
            "FlowableExecutionListener, processInstanceId: {}, eventName: {}, id: {}, isEnded: {}, isActive: {}, isConcurrent: {}, currentActivityId: {},",
            execution.getProcessInstanceId(),
            execution.getEventName(), execution.getId(), execution.isEnded(), execution.isActive(),
            execution.isConcurrent()
            , execution.getCurrentActivityId()
        );

        List<Task> taskList = taskService.createTaskQuery().processInstanceId(execution.getProcessInstanceId()).list();
        for (Task task : taskList) {
            log.info("Task, {}", task.getTaskDefinitionKey());
        }
    }
}

```

```java
package com.example.flowable.demo.listener;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.delegate.TaskListener;
import org.flowable.task.api.Task;
import org.flowable.task.service.delegate.DelegateTask;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FlowableTaskListener implements TaskListener {

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

    @Override
    public void notify(DelegateTask delegateTask) {
        log.info(
            "FlowableTaskListener, id: {}, assignee: {}, eventName: {}, name: {}, processInstanceId: {}, taskDefinitionKey: {}, suspended: {}",
            delegateTask.getId(),
            delegateTask.getAssignee(),
            delegateTask.getEventName(),
            delegateTask.getName(),
            delegateTask.getProcessInstanceId(),
            delegateTask.getTaskDefinitionKey(),
            delegateTask.isSuspended()
        );

        List<Task> taskList = taskService.createTaskQuery().processInstanceId(delegateTask.getProcessInstanceId()).list();
        for (Task task : taskList) {
            log.info("Task, {}", task.getTaskDefinitionKey());
        }
    }

}

```

### 核心api

![image-20220317110902636](https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/imgs/image-20220317110902636.png)

### 部署流程

```java
    @Test
    public void testDeploy() {
        Deployment deployment = repositoryService.createDeployment()// 创建Deployment对象
            .addClasspathResource("processes/请假.bpmn20.xml") // 添加流程部署文件
            .key("请假流程-key") // 流程部署的可以
            .name("请假流程-name") // 设置部署流程的name
            .deploy(); // 执行部署操作

        ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery()
            .deploymentId(deployment.getId()).singleResult();
        log.info("deployment.getId(): {},deployment.getName(): {}",deployment.getId(),deployment.getName());
        log.info("processDefinition.getId(): {},processDefinition.getName(): {}",processDefinition.getId(),processDefinition.getName());
    }
```

输出结果为：

```
deployment.getId(): c8d37e73-4b94-11ed-8a13-226fd935f263,deployment.getName(): 请求流程-name
processDefinition.getId(): ask_for_leave:4:c9098296-4b94-11ed-8a13-226fd935f263,processDefinition.getName(): 请假
```

### 启动流程

```java

    @Test
    public void createProcess() {
        ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery()
            .processDefinitionName("测试").latestVersion().singleResult();
        ProcessInstance processInstance = runtimeService.startProcessInstanceById(
            processDefinition.getId());
        log.info(
            "processDefinition.getName(): {},processDefinition.getName(): {},processDefinition.getVersion(): {},processInstance.getId(): {},processInstance.getName(): {}",
            processDefinition.getName(), processDefinition.getName(), processDefinition.getVersion(),
            processInstance.getId(), processInstance.getName());
    }
```

### 删除流程

```java
    @Test
    public void deleteProcess(){
        String processId="74388397-4dc5-11ed-9026-226fd935f263";
        runtimeService.deleteProcessInstance(processId,"测试删除");
        log.info("========删除流程完成==========");
    }
```

### 推进流程

```java
    @Test
    public void completeProcess(){
        String processInstanceId="74388397-4dc5-11ed-9026-226fd935f263";
        Task leaderTask = taskService.createTaskQuery().processInstanceId(processInstanceId).singleResult();
        taskService.complete(leaderTask.getId(), Collections.singletonMap("approve",true));
        log.info("==========领导审批完成=====");
    }
```

### 流程历史

```java
    @Test
    public void historyProcess(){
        String processInstanceId = "1a77bd50-4ec2-11ed-904d-226fd935f263";
        List<HistoricActivityInstance> historicActivityInstanceList = historyService.createHistoricActivityInstanceQuery()
            .processInstanceId(processInstanceId).list();
        historicActivityInstanceList.forEach(historicActivityInstance -> {
            System.out.println(historicActivityInstance.getDurationInMillis());
        });
    }
```
