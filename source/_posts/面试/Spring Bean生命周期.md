---
title: Spring Bean生命周期与Post接口实战
date: 2024/08/01 20:46:25
article_id: 92353ce2-e857-5a33-8b5c-d53329fdce40
categories:
- Java
tags:
- Java
- Spring
cover: /img/covers/cover-5.webp
top_img: /img/covers/cover-5.webp

---

# Spring Bean生命周期

## 目录

- [一、Bean 完整生命周期](#一bean-完整生命周期)
  - [详细流程](#详细流程)
  - [代码验证](#代码验证)
- [二、BeanPostProcessor 详解](#二beanpostprocessor-详解)
  - [接口定义](#接口定义)
  - [执行时机](#执行时机)
  - [为什么前置处理少用？](#为什么前置处理少用)
  - [总结对比](#总结对比)
- [三、BeanPostProcessor 实战场景](#三beanpostprocessor-实战场景)
  - [场景1：AOP 代理创建](#场景1aop-代理创建最经典)
  - [场景2：自定义注解校验](#场景2自定义注解校验)
  - [场景3：接口实现自动替换](#场景3接口实现自动替换)
  - [场景4：监控/日志埋点](#场景4监控日志埋点)
  - [场景5：敏感字段脱敏](#场景5敏感字段脱敏)
- [四、为什么要代理？](#四为什么要代理)
  - [代理解决了什么问题](#代理解决了什么问题)
  - [为什么是代理而不是其他方式？](#为什么是代理而不是其他方式)
  - [JDK 动态代理 vs CGLIB](#jdk-动态代理-vs-cglib)
  - [Spring AOP 代理创建过程](#spring-aop-代理创建过程)
  - [代理失效的常见场景](#代理失效的常见场景)
- [五、代理对象 vs 真实对象](#五代理对象-vs-真实对象)
  - [本质区别](#本质区别)
  - [核心区别一览](#核心区别一览)
  - [内存中的关系](#内存中的关系)
  - [为什么容器里放代理对象？](#为什么容器里放代理对象而不是真实对象)
  - [代理对象调用链](#代理对象调用链)
  - [this 调用为什么绕过代理](#this-调用为什么绕过代理)
  - [JDK 动态代理 vs CGLIB 代理对象](#jdk-动态代理-vs-cglib-代理对象的区别)
  - [怎么判断代理还是真实对象？](#怎么判断拿到的是代理还是真实对象)
- [六、其他 Post 接口](#六其他-post-接口)
  - [BeanFactoryPostProcessor vs BeanPostProcessor](#beanfactorypostprocessor-vs-beanpostprocessor)
  - [InstantiationAwareBeanPostProcessor](#instantiationawarebeanpostprocessor)
  - [DestructionAwareBeanPostProcessor](#destructionawarebeanpostprocessor)
  - [MergedBeanDefinitionPostProcessor](#mergedbeandefinitionpostprocessor)
- [七、所有 Post 接口执行顺序](#七所有-post-接口执行顺序)
- [八、面试高频追问](#八面试高频追问)
- [九、一句话总结](#九一句话总结)

---

## 一、Bean 完整生命周期

实例化 → 属性注入 → Aware回调 → BeanPostProcessor前置 → 初始化 → BeanPostProcessor后置 → 使用 → 销毁

### 详细流程

1. **实例化（Instantiation）**
   - Constructor → `new XxxBean()`
2. **属性注入（Population）**
   - `@Autowired` / `@Value` / setter 注入
3. **Aware 回调**
   - `BeanNameAware.setBeanName()`
   - `BeanFactoryAware.setBeanFactory()`
   - `ApplicationContextAware.setApplicationContext()`
4. **BeanPostProcessor.postProcessBeforeInitialization()** ← 前置处理
5. **初始化（Initialization）**
   - `@PostConstruct`
   - `InitializingBean.afterPropertiesSet()`
   - `init-method`（自定义初始化方法）
6. **BeanPostProcessor.postProcessAfterInitialization()** ← 后置处理
7. **Bean 就绪，可使用**
8. **销毁（Destruction）**
   - `@PreDestroy`
   - `DisposableBean.destroy()`
   - `destroy-method`（自定义销毁方法）

### 代码验证

```java
@Component
public class LifecycleBean implements BeanNameAware, InitializingBean, DisposableBean {

    public LifecycleBean() {
        System.out.println("1. Constructor");
    }

    @Autowired
    public void setDependency(Dependency dep) {
        System.out.println("2. 属性注入");
    }

    @Override
    public void setBeanName(String name) {
        System.out.println("3. BeanNameAware: " + name);
    }

    @PostConstruct
    public void postConstruct() {
        System.out.println("4. @PostConstruct");
    }

    @Override
    public void afterPropertiesSet() {
        System.out.println("5. InitializingBean.afterPropertiesSet()");
    }

    @PreDestroy
    public void preDestroy() {
        System.out.println("8. @PreDestroy");
    }

    @Override
    public void destroy() {
        System.out.println("8. DisposableBean.destroy()");
    }
}
```

---

## 二、BeanPostProcessor 详解

### 接口定义

```java
public interface BeanPostProcessor {
    // 初始化前调用（@PostConstruct 之前）
    default Object postProcessBeforeInitialization(Object bean, String beanName) {
        return bean;
    }
    // 初始化后调用（@PostConstruct 之后）← 最常用
    default Object postProcessAfterInitialization(Object bean, String beanName) {
        return bean;
    }
}
```

核心：对容器中所有 Bean 生效，是 Spring 扩展的灵魂。

### 执行时机

```
... → 属性注入 → Aware → BeforeInitialization → @PostConstruct → afterPropertiesSet → AfterInitialization → ...
                      ↑                                              ↑
                前置处理（少用）                                  后置处理（常用）
```

### 为什么前置处理少用？

BeforeInitialization 执行时，Bean 的状态：
- ✅ 属性已注入（@Autowired 完成）
- ✅ Aware 回调已完成
- ❌ @PostConstruct 未执行
- ❌ afterPropertiesSet() 未执行
- ❌ init-method 未执行

→ Bean 还没完成初始化，不是一个"完整可用"的对象

**原因1：增强一个半成品没有意义**

AOP 代理是 BeanPostProcessor 最大的用途。代理要包装的是"完整的 Bean"——初始化逻辑已经执行完毕，所有依赖和状态都已就绪的对象。如果在前置处理创建代理：
- @PostConstruct 里的逻辑还没跑
- 代理对象包裹了一个"没初始化完"的真实对象
- 调用时可能拿到未初始化的状态 → 空指针、数据错乱

**原因2：前置处理能做的事，@PostConstruct 都能做**

前置处理的需求：在 Bean 初始化前做一些校验、设置。但这些事情完全可以写在 @PostConstruct 里：

```java
// 方式1: BeforeInitialization (侵入框架层, 影响所有Bean)
public Object postProcessBeforeInitialization(Object bean, String beanName) {
    if (bean instanceof UserService) {
        ((UserService) bean).validate(); // 校验
    }
    return bean;
}

// 方式2: @PostConstruct (只影响自己, 简单直接)
@PostConstruct
public void init() {
    validate(); // 同样效果, 代码在身边, 更好维护
}
```

→ @PostConstruct 是 Bean 自己的逻辑，内聚性更好
→ BeforeInitialization 是框架级介入，通用场景才需要

**原因3：Spring 自己的 BeforeInitialization 用法就很窄**

Spring 内部使用 BeforeInitialization 的地方极少，主要是：
1. `CommonAnnotationBeanPostProcessor`
   - 处理 @PostConstruct、@PreDestroy 注解
   - 这不是"增强 Bean"，而是"驱动初始化流程本身"
2. `ApplicationContextAwareProcessor`
   - 注入 ApplicationContext 等 Aware 回调
   - 也是框架内部机制，不是业务增强

→ Spring 自己都只用来做框架内部的事，业务层几乎没有使用场景

**原因4：后置处理才是"增强"的正确时机**

AfterInitialization 执行时，Bean 的状态：
- ✅ 属性已注入
- ✅ @PostConstruct 已执行
- ✅ afterPropertiesSet() 已执行
- ✅ init-method 已执行
- ✅ Bean 完全就绪

→ 此时创建代理，包裹的是完整对象
→ 代理调用真实对象时，拿到的状态一定是正确的
→ AOP、监控、脱敏、校验... 所有增强都在这时候做

### 总结对比

| | BeforeInitialization | AfterInitialization |
|---|---|---|
| Bean 状态 | 半成品（未初始化） | 成品（完全就绪） |
| 能否代理增强 | ❌ 包裹半成品，有风险 | ✅ 包裹完整对象 |
| 业务需求 | 可用 @PostConstruct 替代 | 不可替代 |
| Spring 内部用法 | 驱动初始化流程 | 创建代理、增强功能 |
| 使用频率 | 极少 | 大量（AOP、@Async 等） |

一句话：前置处理时 Bean 还没初始化完，增强半成品没意义；能做的事 @PostConstruct 都能做；真正需要增强的时机是初始化完成后，所以后置处理才是主流。

---

## 三、BeanPostProcessor 实战场景

### 场景1：AOP 代理创建（最经典）

Spring AOP 的核心实现是 `AbstractAutoProxyCreator`，它实现了 `BeanPostProcessor`，在 `postProcessAfterInitialization` 中为 Bean 创建代理。

```java
@Component
public class MyAutoProxyCreator implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean.getClass().isAnnotationPresent(MyAspect.class)) {
            return createProxy(bean);
        }
        return bean;
    }
}
```

这就是为什么 @Transactional、@Async 等注解能生效——底层都是 BeanPostProcessor 在初始化后把原始 Bean 替换成了代理对象。

### 场景2：自定义注解校验

扫描 Bean 上的自定义注解，做校验或增强。

```java
@Component
public class ApiCheckProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        for (Field field : bean.getClass().getDeclaredFields()) {
            if (field.isAnnotationPresent(RequiredConfig.class)) {
                field.setAccessible(true);
                try {
                    Object value = field.get(bean);
                    if (value == null) {
                        throw new IllegalStateException(
                                beanName + "." + field.getName() + " 未配置必填项");
                    }
                } catch (IllegalAccessException e) {
                    throw new RuntimeException(e);
                }
            }
        }
        return bean;
    }
}
```

### 场景3：接口实现自动替换

根据条件替换 Bean 实现，如动态数据源切换。

```java
@Component
public class DataSourceProxyProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof DataSource && !"masterDataSource".equals(beanName)) {
            return new DynamicDataSourceProxy((DataSource) bean);
        }
        return bean;
    }
}
```

### 场景4：监控/日志埋点

为所有 Service 层 Bean 自动添加耗时监控。

```java
@Component
public class ServiceMonitorProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean.getClass().isAnnotationPresent(Service.class)) {
            return Proxy.newProxyInstance(
                bean.getClass().getClassLoader(),
                bean.getClass().getInterfaces(),
                (proxy, method, args) -> {
                    long start = System.currentTimeMillis();
                    try {
                        return method.invoke(bean, args);
                    } finally {
                        long cost = System.currentTimeMillis() - start;
                        if (cost > 500) {
                            log.warn("慢调用：{}.{} cost={}ms",
                                beanName, method.getName(), cost);
                        }
                    }
                }
            );
        }
        return bean;
    }
}
```

### 场景5：敏感字段脱敏

自动对返回对象中的敏感字段脱敏。

```java
@Component
public class SensitiveDataProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof UserService) {
            return Proxy.newProxyInstance(
                bean.getClass().getClassLoader(),
                bean.getClass().getInterfaces(),
                (proxy, method, args) -> {
                    Object result = method.invoke(bean, args);
                    if (result instanceof UserVO) {
                        desensitize((UserVO) result);
                    }
                    return result;
                }
            );
        }
        return bean;
    }

    private void desensitize(UserVO user) {
        user.setPhone(user.getPhone().replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2"));
        user.setIdCard(user.getIdCard().replaceAll("(\\d{4})\\d{10}(\\d{4})", "$1**********$2"));
    }
}
```

---

## 四、为什么要代理？

核心原因：不修改源码的前提下增强功能

没有代理的世界——业务代码里到处穿插非业务逻辑：

```java
public void createOrder() {
    log.info("开始创建订单");             // ← 日志
    checkPermission();                     // ← 权限
    TransactionManager.begin();            // ← 事务
    try {
        orderDao.save(order);              // ← 真正的业务
        TransactionManager.commit();       // ← 事务
    } catch (Exception e) {
        TransactionManager.rollback();     // ← 事务
        throw e;
    }
    log.info("订单创建完成");               // ← 日志
    metrics.record("order.create", cost);  // ← 监控
}
```

有代理的世界——业务代码只写业务，增强逻辑由代理层统一处理：

```java
@Transactional
@Log
public void createOrder() {
    orderDao.save(order);                  // ← 只有业务
}
```

### 代理解决了什么问题

| 不用代理 | 用代理 |
|---------|-------|
| 业务代码和非业务代码耦合 | 业务代码纯粹，只关注业务 |
| 每个方法重复写日志/事务/权限 | 声明式，一个注解搞定 |
| 改日志逻辑要改所有方法 | 改切面一处即可 |
| 无法对第三方类增强 | 代理可以包装任意对象 |

本质：开闭原则（OCP）——对扩展开放，对修改封闭。

### 为什么是代理而不是其他方式？

**1. 为什么不直接改源码？**
- 源码不可控：第三方库（MyBatis Mapper、Feign Client）你改不了
- 侵入性强：每个方法加逻辑，改一处动全局
- 违反OCP：增强功能应该扩展，不该修改

**2. 为什么不用继承？**

继承的问题：
- Java 单继承，只能增强一个维度
- 每加一个增强就要多一层子类，类爆炸
  - UserService
    - LogUserService ← 加日志
    - TxUserService ← 加事务
    - LogTxUserService ← 又加日志又加事务？组合爆炸
- 无法对 final 类增强

**3. 为什么代理可以？**

代理 = 组合 + 多态，完美替代继承

```
调用者 → 代理对象.invoke() → 前置增强 → 真实对象.method() → 后置增强 → 返回
```

可以无限嵌套（代理的代理的代理...）：

```
日志代理 → 事务代理 → 权限代理 → 真实对象
```

每个代理只负责一个切面，自由组合，不爆炸

### JDK 动态代理 vs CGLIB

```java
// JDK 动态代理：基于接口
UserService proxy = (UserService) Proxy.newProxyInstance(
    classLoader,
    new Class[]{UserService.class}, // 必须有接口
    invocationHandler
);
// 原理：运行时生成实现接口的代理类，反射调用

// CGLIB 代理：基于继承
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(UserServiceImpl.class); // 不需要接口
enhancer.setCallback(methodInterceptor);
UserService proxy = (UserService) enhancer.create();
// 原理：运行时生成目标类的子类，重写方法
```

| | JDK 动态代理 | CGLIB |
|---|---|---|
| 原理 | 实现接口 | 继承目标类 |
| 要求 | 目标必须实现接口 | 目标不能是 final 类/方法 |
| 性能 | 生成快，调用稍慢（反射） | 生成慢，调用快（直接调用） |
| Spring 默认 | 有接口用 JDK | 无接口用 CGLIB |
| SpringBoot 默认 | — | 默认 CGLIB（spring.aop.proxy-target-class=true） |

### Spring AOP 代理创建过程

1. 容器启动，扫描 @Aspect / @Around 等切面定义
2. 创建每个 Bean 时，BeanPostProcessor.postProcessAfterInitialization()
3. AbstractAutoProxyCreator 判断该 Bean 是否需要代理
   - 有匹配的切面 → 创建代理对象返回
   - 无匹配切面 → 返回原始 Bean
4. 代理对象替换原始 Bean 存入容器
   - 后续注入的都是代理对象
   - 调用时走代理链：日志 → 事务 → 权限 → 真实方法

```java
// Spring 内部核心逻辑（简化）
public Object postProcessAfterInitialization(Object bean, String beanName) {
    Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName);
    if (specificInterceptors != DO_NOT_PROXY) {
        return createProxy(bean.getClass(), specificInterceptors, bean);
    }
    return bean;
}
```

### 代理失效的常见场景

```java
@Service
public class UserService {
    // ✅ 外部调用 → 走代理 → 事务生效
    @Transactional
    public void methodA() {
        db.save();
    }

    // ❌ 内部调用 → this.methodA() → 不走代理 → 事务失效！
    public void methodB() {
        this.methodA();
    }

    // ✅ 解决：注入自身 或 AopContext
    @Autowired
    private UserService self;

    public void methodB() {
        self.methodA(); // 走代理
    }
}
```

代理失效的场景：
1. `this` 内部调用（最常见）→ 绕过代理直接调用原始方法
2. 方法是 private / final / static → 代理无法重写
3. 目标类是 final → CGLIB 无法生成子类
4. 未被 Spring 管理 → 不是 Spring Bean，不走 BeanPostProcessor
5. 异常被 catch 吞掉 → `@Transactional` 感知不到异常，不回滚

---

## 五、代理对象 vs 真实对象

### 本质区别

- **真实对象**：你写的类 new 出来的实例，只包含业务逻辑
- **代理对象**：运行时动态生成的类的实例，持有真实对象的引用，在调用前后插入增强逻辑

```java
// 真实对象
UserService real = new UserServiceImpl();
real.createUser(user); // 直接执行业务逻辑

// 代理对象（CGLIB 生成的子类）
UserService proxy = createProxy(real);
proxy.createUser(user);
// 实际执行：
//   1. proxy.createUser() → 拦截器.intercept()
//   2. 前置增强（开事务、打日志）
//   3. real.createUser() → 真正执行业务
//   4. 后置增强（提交事务、记录耗时）
```

### 核心区别一览

| 维度 | 真实对象 | 代理对象 |
|------|----------|----------|
| 类 | UserServiceImpl | UserServiceImpl$$EnhancerBySpringCGLIB$$xxx |
| 创建方式 | new / Spring 反射 | BeanPostProcessor 运行时生成 |
| 方法执行 | 直接执行 | 拦截 → 增强 → 委托真实对象 |
| 包含逻辑 | 只有业务 | 业务 + 横切增强 |
| 对象身份 | 是目标类本身 | 是目标类的子类或实现类 |
| 容器中存的是 | 被代理对象替换 | 代理对象（真实对象被包裹在内） |

### 内存中的关系

```
容器中: userService → 代理对象（UserServiceImpl$$CGLIB$$123）
                              ↓ 持有引用（target）
                        真实对象（UserServiceImpl）
```

```java
// 验证
@Autowired
private UserService userService;

System.out.println(userService.getClass().getName());
// 输出: com.xxx.UserServiceImpl$$EnhancerBySpringCGLIB$$a1b2c3

System.out.println(userService instanceof UserServiceImpl);
// true - CGLIB 代理是子类，instanceof 仍为 true
```

### 为什么容器里放代理对象而不是真实对象？

Spring 容器初始化流程：
1. `new UserServiceImpl()` → 创建真实对象
2. 属性注入 `@Autowired` → 真实对象属性填充完成
3. `BeanPostProcessor.postProcessAfterInitialization()`
   - 检测到 `@Transactional` 等切面
   - 创建代理对象，包裹真实对象
   - 返回代理对象
4. 容器中 `userService` → 代理对象 ← 容器存的是代理对象
5. 其他 Bean 注入 `UserService` 时 ← 拿到的也是代理对象

关键点：容器里只存代理对象，真实对象被代理对象内部持有，外部不可见。

### 代理对象调用链

```
proxy.createUser()                       // 1. 调用代理方法
→ CGLIB MethodInterceptor.intercept()   // 2. 代理拦截
→ ReflectiveMethodInvocation.proceed()  // 3. 责任链执行
→ 切面1: @Around 前置逻辑                // 4. 如: 开事务
→ 切面2: @Before 逻辑                    // 5. 如: 打日志
→ target.createUser()                    // 6. 调用真实对象 ← 真正的业务
→ 切面2: @After 逻辑                     // 7. 如: 记录结果
→ 切面1: @Around 后置逻辑                // 8. 如: 提交事务
← 返回结果
```

### this 调用为什么绕过代理

```java
@Service
public class UserService {

    @Transactional
    public void methodA() { /* 写数据库 */ }

    public void methodB() {
        this.methodA(); // ← 问题在这
    }
}
```

外部调用 `userService.methodB()` 的链路：

```
代理对象.methodB()
→ 拦截器.intercept()
  → 前置增强
  → target.methodB()              ← 进入真实对象
    → this.methodA()              ← this 是真实对象，不是代理对象！
    → 直接调用，不走拦截器          ← @Transactional 失效
  → 后置增强
```

解决方式：
1. 注入自身：`@Autowired private UserService self; self.methodA();`
2. AopContext：`((UserService) AopContext.currentProxy()).methodA();`
3. 拆分到不同类：把 methodA 移到另一个 Service

根本原因：`this` 指向真实对象而非代理对象，直接调用绕过了代理拦截。

### JDK 动态代理 vs CGLIB 代理对象的区别

**JDK 动态代理：**
- 代理对象.getClass() → `com.sun.proxy.$Proxy23`
- 代理对象 `instanceof` UserServiceImpl → `false`（不是子类，是接口的实现）
- 代理对象 `instanceof` UserService → `true`（实现了接口）

**CGLIB 代理：**
- 代理对象.getClass() → `UserServiceImpl$$EnhancerBySpringCGLIB$$xxx`
- 代理对象 `instanceof` UserServiceImpl → `true`（是子类）
- 代理对象 `instanceof` UserService → `true`

| | JDK 代理对象 | CGLIB 代理对象 |
|---|---|---|
| 生成方式 | 实现接口 | 继承目标类 |
| 类名 | `$ProxyN` | `Xxx$$CGLIB$$xxx` |
| instanceof 目标类 | ❌ false | ✅ true |
| instanceof 接口 | ✅ true | ✅ true |
| 能否调目标类独有方法 | ❌ | ✅（但不走代理） |

### 怎么判断拿到的是代理还是真实对象？

```java
// 方式1：Spring 工具类
AopUtils.isAopProxy(bean)              // 是否代理
AopUtils.isJdkDynamicProxy(bean)       // 是否 JDK 代理
AopUtils.isCglibProxy(bean)            // 是否 CGLIB 代理

// 方式2：类名判断
bean.getClass().getName().contains("$Proxy")      // JDK
bean.getClass().getName().contains("$$Enhancer")  // CGLIB

// 方式3：获取真实对象
Object target = AopProxyUtils.getSingletonTarget(bean);
// 或
if (bean instanceof Advised) {
    Object target = ((Advised) bean).getTargetSource().getTarget();
}
```

---

## 六、其他 Post 接口

### BeanFactoryPostProcessor vs BeanPostProcessor

| | BeanFactoryPostProcessor | BeanPostProcessor |
|---|---|---|
| 作用时机 | Bean 实例化之前 | Bean 实例化之后 |
| 作用对象 | BeanDefinition（元数据） | Bean 实例 |
| 能做什么 | 修改 Bean 定义、属性值 | 修改/替换 Bean 实例 |
| 典型应用 | PropertyPlaceholderConfigurer | AOP 代理 |

```java
@Component
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory factory) {
        BeanDefinition bd = factory.getBeanDefinition("userService");
        bd.getPropertyValues().add("timeout", 5000);
    }
}
```

### InstantiationAwareBeanPostProcessor

比 BeanPostProcessor 更细粒度，在实例化阶段介入。

```java
@Component
public class MyInstantiationProcessor implements InstantiationAwareBeanPostProcessor {

    // 实例化之前：可以直接返回代理对象，跳过 Spring 实例化
    @Override
    public Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) {
        if (beanClass == SpecialBean.class) {
            return new SpecialBeanProxy();   // 返回非null则跳过Spring创建
        }
        return null;   // 返回null继续Spring正常流程
    }

    // 实例化之后，属性注入之前
    @Override
    public boolean postProcessAfterInstantiation(Object bean, String beanName) {
        return true;   // 返回true继续属性注入，false则跳过
    }

    // 属性注入时修改属性值
    @Override
    public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
        return pvs;   // 可修改注入的属性
    }
}
```

### DestructionAwareBeanPostProcessor

销毁前的回调处理。

```java
@Component
public class MyDestructionProcessor implements DestructionAwareBeanPostProcessor {
    @Override
    public void postProcessBeforeDestruction(Object bean, String beanName) {
        if (bean instanceof Disposable) {
            ((Disposable) bean).cleanup();
        }
    }
}
```

### MergedBeanDefinitionPostProcessor

合并 Bean 定义后，收集注解元数据。

```java
// Spring 内部 @Autowired 的实现就靠它
@Component
public class MyMergedDefinitionProcessor implements MergedBeanDefinitionPostProcessor {
    @Override
    public void postProcessMergedBeanDefinition(RootBeanDefinition beanDefinition,
                                                Class<?> beanType, String beanName) {
        // 扫描 @Autowired、@Value 等注解，缓存 InjectionMetadata
    }
}
```

---

## 七、所有 Post 接口执行顺序

```
BeanFactoryPostProcessor.postProcessBeanFactory()              ← 最早，改 BeanDefinition
            ↓
InstantiationAwareBPP.postProcessBeforeInstantiation()         ← 实例化前，可替换实例
            ↓
Constructor → new()                                            ← 实例化
            ↓
MergedBeanDefinitionPostProcessor.postProcessMergedBeanDefinition()
            ↓
InstantiationAwareBPP.postProcessAfterInstantiation()          ← 实例化后，可阻止属性注入
InstantiationAwareBPP.postProcessProperties()                  ← 修改注入属性
            ↓
属性注入 @Autowired / @Value
            ↓
BeanPostProcessor.postProcessBeforeInitialization()            ← 初始化前
            ↓
@PostConstruct / afterPropertiesSet / init-method
            ↓
BeanPostProcessor.postProcessAfterInitialization()             ← 初始化后（AOP代理在这）
            ↓
Bean 就绪
            ↓
DestructionAwareBPP.postProcessBeforeDestruction()             ← 销毁前
@PreDestroy / destroy() / destroy-method
```

---

## 八、面试高频追问

### Q1: BeanPostProcessor 和 BeanFactoryPostProcessor 区别？

> BeanFactoryPostProcessor 在 Bean 实例化前执行，操作的是 BeanDefinition（配置元数据），比如修改属性值、改变作用域。BeanPostProcessor 在 Bean 实例化后执行，操作的是 Bean 实例本身，比如创建代理、增强功能。一个是改图纸，一个是改产品。

### Q2: BeanPostProcessor 会影响所有 Bean 吗？

> 是的，容器中每个 Bean 创建时都会经过所有 BeanPostProcessor。所以实现中必须做类型判断，避免处理不需要的 Bean。同时要注意性能，不要在处理器中做耗时操作。

### Q3: @Autowired 的实现原理？

> 底层是 `AutowiredAnnotationBeanPostProcessor`，它实现了 `MergedBeanDefinitionPostProcessor`（扫描 @Autowired 注解）和 `SmartInstantiationAwareBeanPostProcessor`（实际注入属性）。在 `postProcessMergedBeanDefinition` 阶段收集注入点，在 `postProcessProperties` 阶段完成注入。

### Q4: 为什么 BeanPostProcessor 中不能直接注入其他 Bean？

> BeanPostProcessor 本身的创建早于普通 Bean，如果通过 `@Autowired` 依赖其他 Bean，可能该 Bean 还未创建。正确做法是通过 `BeanFactory.getBean()` 延迟获取，或实现 `Aware` 接口获取。

### Q5: 你项目中哪里用到了 BeanPostProcessor？

> - 自定义注解校验：启动时检查必填配置项
> - 慢接口监控：对 Service 层自动代理，记录超时调用
> - 数据源代理：动态数据源切换
> - 敏感字段脱敏：自动对返回值脱敏处理

---

## 九、一句话总结

> Bean 生命周期 = 实例化 → 注入 → Aware → 前置 → 初始化 → 后置 → 使用 → 销毁。BeanPostProcessor 是 Spring 扩展的灵魂，AOP、@Autowired、@Async 都靠它实现。实际项目中常用于代理创建、注解扫描、监控埋点、自动校验等场景。
