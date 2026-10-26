---
original_dir: Spring Bean循环依赖

title: Spring Bean循环依赖
date: 2026-05-25 20:36:03
article_id: ce917c7a-657c-5dce-878e-11b900623130
categories:
- Java
- 面试
tags:
- Java
- Spring
- SpringBoot
cover: /img/covers/cover-6.webp
top_img: /img/covers/cover-6.webp

---
## 目录

- [一、什么是循环依赖](#一什么是循环依赖)
- [二、Spring 三级缓存机制](#二spring-三级缓存机制)
- [三、核心流程详解（A → B → A）](#三核心流程详解a--b--a)
  - [关键代码（DefaultSingletonBeanRegistry）：](#关键代码defaultsingletonbeanregistry)
- [四、为什么需要三级缓存而不是两级](#四为什么需要三级缓存而不是两级)
- [五、Spring 无法解决的情况](#五spring-无法解决的情况)
  - [构造器注入失败示例：](#构造器注入失败示例)
- [六、解决方案](#六解决方案)
  - [方案 1：构造器注入 + @Lazy（最常用）](#方案-1构造器注入--lazy最常用)
  - [方案 2：改用 setter 注入](#方案-2改用-setter-注入)
  - [方案 3：抽取公共逻辑到第三个 Bean（架构层面解耦）](#方案-3抽取公共逻辑到第三个-bean架构层面解耦)
  - [方案 4：实现 ApplicationContextAware 延迟获取](#方案-4实现-applicationcontextaware-延迟获取)
- [七、面试高频追问](#七面试高频追问)
  - [Q1：Spring Boot 2.6 默认禁止了循环依赖，怎么开启？](#q1spring-boot-26-默认禁止了循环依赖怎么开启)
  - [Q2：为什么 Spring 不推荐循环依赖？](#q2为什么-spring-不推荐循环依赖)
  - [Q3：构造器注入 + @Lazy 的原理？](#q3构造器注入--lazy-的原理)
  - [Q4：二级缓存够不够？](#q4二级缓存够不够)
  - [Q5：SpringBoot 2.6 为什么要默认禁止？](#q5springboot-26-为什么要默认禁止)
- [八、一句话总结](#八一句话总结)
- [引用](#引用)

---

# Spring Bean 循环依赖
> 关联阅读：Spring Bean生命周期

---

## 一、什么是循环依赖
两个或多个 Bean 之间相互持有对方的引用，形成闭环：
```
A → B → A            （两个 Bean 互相依赖）
A → B → C → A        （三个 Bean 循环依赖）
```

## 二、Spring 三级缓存机制
Spring 通过三级缓存解决单例 setter 注入的循环依赖：

| 缓存层级 | 名称 | 存放内容 |
| --- | --- | --- |
| 一级缓存 | `singletonObjects` | 完整初始化后的 Bean |
| 二级缓存 | `earlySingletonObjects` | 提前暴露的早期 Bean 引用（可能被代理） |
| 三级缓存 | `singletonFactories` | Bean 的 ObjectFactory（lambda），用于生成早期引用 |

## 三、核心流程详解（A → B → A）
1.  创建 A
    - 实例化 A（调用构造器，A 还是半成品）
    - 将 A 的 ObjectFactory 放入【三级缓存】
2.  A 填充属性 B
    - 发现需要 B，去创建 B
3.  创建 B
    - 实例化 B
    - 将 B 的 ObjectFactory 放入【三级缓存】
4.  B 填充属性 A
    - 一级缓存没有 A
    - 二级缓存没有 A
    - 三级缓存有 A 的 ObjectFactory
    - 调用 `ObjectFactory.getObject()` → 拿到 A 的早期引用
    - 将 A 放入【二级缓存】，从【三级缓存】移除
    - B 持有 A 的早期引用，B 初始化完成
5.  B 放入【一级缓存】
6.  A 拿到完整的 B，A 初始化完成
7.  A 放入【一级缓存】，从【二级缓存】移除

### 关键代码（DefaultSingletonBeanRegistry）：
```java
// 一级缓存
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>();
// 二级缓存
private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>();

// 三级缓存
private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>();
```

## 四、为什么需要三级缓存而不是两级
核心原因：**AOP 代理的创建时机**

| 方案 | 问题 |
| --- | --- |
| 只用两级缓存 | 必须在实例化后立即决定是否创建代理，导致所有 Bean 都提前创建代理，违背 Spring 的设计（代理应在初始化后置阶段创建） |
| 三级缓存 | 存的是 ObjectFactory，调用时才决定返回原始对象还是代理对象，只在检测到循环依赖时才触发 |

```java
// 三级缓存存放的是 lambda，按需生成
addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
```
- 无循环依赖：ObjectFactory 不会被调用，代理在 `postProcessAfterInitialization` 正常创建
- 有循环依赖：ObjectFactory 被调用，提前创建代理放入二级缓存，保证注入的是代理对象

## 五、Spring 无法解决的情况

| 场景 | 能否解决 | 原因 |
| --- | :---: | --- |
| 单例 + setter 注入 | ✅ 能 | 三级缓存提前暴露 |
| 单例 + 构造器注入 | ❌ 不能 | 构造器未执行完，实例都不存在，无法提前暴露 |
| 原型（prototype）Bean | ❌ 不能 | 原型不缓存，无法提前暴露引用 |
| `@Async` 标注的 Bean 循环依赖 | ❌ 不能 | `@Async` 代理创建时机晚于属性注入，与三级缓存不兼容 |

### 构造器注入失败示例：
```java
@Service
public class A {
    private final B b;
    @Autowired
    public A(B b) { this.b = b; }  // 构造器执行时 B 还没创建
}

@Service
public class B {
    private final A a;
    @Autowired
    public B(A a) { this.a = a; }  // 构造器执行时 A 还没创建
}
// 报错: Requested bean is currently in creation: Is there an unresolvable circular reference?
```

## 六、解决方案

### 方案 1：构造器注入 + @Lazy（最常用）
```java
@Service
public class A {
    private final B b;
    @Autowired
    public A(@Lazy B b) { this.b = b; }
}
```
原理：`@Lazy` 让 Spring 注入一个 CGLIB 代理对象，首次调用时才触发真实 Bean 创建。

### 方案 2：改用 setter 注入
```java
@Service
public class A {
    private B b;
    @Autowired
    public void setB(B b) { this.b = b; }
}
```

### 方案 3：抽取公共逻辑到第三个 Bean（架构层面解耦）
```
Before:  A → B → A    （循环）
After:   A → C ← B    （打破环，C 承载公共逻辑）
```

### 方案 4：实现 ApplicationContextAware 延迟获取
```java
@Service
public class A implements ApplicationContextAware {
    private ApplicationContext ctx;

    public void doSomething() {
        B b = ctx.getBean(B.class);  // 用时再取，绕开属性注入阶段的循环
    }

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        this.ctx = ctx;
    }
}
```

## 七、面试高频追问
### Q1：Spring Boot 2.6 默认禁止了循环依赖，怎么开启？
```yaml
spring:
  main:
    allow-circular-references: true
```

### Q2：为什么 Spring 不推荐循环依赖？
循环依赖意味着设计上存在职责耦合，应从架构层面重构解耦，而非依赖框架的兜底机制。

### Q3：构造器注入 + @Lazy 的原理？
`@Lazy` 让 Spring 注入一个 CGLIB 代理对象而非真实 Bean，代理拦截方法调用，首次调用时才触发真实 Bean 的创建，从而绕开循环依赖。

### Q4：二级缓存够不够？
如果没有 AOP，两级缓存就够了。三级缓存是为了在有 AOP + 循环依赖时，保证代理创建时机正确且不重复创建。

### Q5：SpringBoot 2.6 为什么要默认禁止？
- 循环依赖是设计缺陷的信号
- 三级缓存机制增加了代码复杂度
- 鼓励开发者从架构层面解决耦合问题

## 八、一句话总结
三级缓存通过提前暴露半成品 Bean 解决单例 setter 循环依赖；构造器注入和原型 Bean 无法解决，需用 `@Lazy`、setter 注入或重构解耦。三级缓存的核心价值是延迟代理创建，保证 AOP 场景下代理对象的正确性。

## 引用

