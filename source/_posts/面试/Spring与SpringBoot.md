---
original_dir: Spring与SpringBoot

title: Spring与SpringBoot
date: 2026-05-25 20:36:03
article_id: b7407c1d-7d24-54ef-b954-6704ec7d3dd2
categories:
- Java
- 面试
tags:
- Java
- Spring
- SpringBoot
cover: /img/covers/cover-7.webp
top_img: /img/covers/cover-7.webp

---
## 目录

- [一、Spring 和 Spring Boot 有什么区别](#一spring-和-spring-boot-有什么区别)
  - [一句话](#一句话)
  - [核心区别](#核心区别)
- [自动配置原理（必问）](#自动配置原理必问)
- [关键条件注解](#关键条件注解)
- [面试回答](#面试回答)
- [二、Spring Boot 配置文件优先级](#二spring-boot-配置文件优先级)
  - [优先级从高到低（完整版）](#优先级从高到低完整版)
  - [高频考点：jar 包外 > jar 包内](#高频考点jar-包外--jar-包内)
  - [完整的外部配置覆盖顺序（jar 外）](#完整的外部配置覆盖顺序jar-外)
  - [高频考点：properties vs yml 优先级](#高频考点properties-vs-yml-优先级)
  - [高频考点：多配置文件激活](#高频考点多配置文件激活)
  - [高频考点：配置文件 vs 代码默认值 —— 谁覆盖谁？](#高频考点配置文件-vs-代码默认值--谁覆盖谁)
  - [第一种：`@ConfigurationProperties` 字段初始值 / `@Value` 冒号默认值](#第一种configurationproperties-字段初始值--value-冒号默认值)
  - [验证：](#验证)
  - [第二种：`SpringApplication.setDefaultProperties()` 设置的默认值](#第二种springapplicationsetdefaultproperties-设置的默认值)
  - [完整优先级图示（关键！）](#完整优先级图示关键)
- [三、Spring Boot 怎么接入一个外部组件](#三spring-boot-怎么接入一个外部组件)
  - [第二步：配置连接](#第二步配置连接)
  - [第三步：直接使用](#第三步直接使用)
- [Starter 自动配置原理（面试核心）](#starter-自动配置原理面试核心)
- [自定义 Starter 的标准套路（进阶考点）](#自定义-starter-的标准套路进阶考点)
  - [1. 项目结构](#1-项目结构)
  - [2. 配置属性类](#2-配置属性类)
  - [3. 核心服务](#3-核心服务)
  - [4. 自动配置类](#4-自动配置类)
  - [5. 注册自动配置](#5-注册自动配置)
  - [6. 使用方引入](#6-使用方引入)
- [接入外部组件的三种模式总结](#接入外部组件的三种模式总结)
- [四、面试高频追问](#四面试高频追问)
  - [4.1 `@Conditional` 系列注解有哪些？](#41-conditional-系列注解有哪些)
  - [4.2 Spring Boot 2.x 和 3.x 自动配置注册的区别？](#42-spring-boot-2x-和-3x-自动配置注册的区别)
  - [4.3 `application.yml` 和 `bootstrap.yml` 的区别？](#43-applicationyml-和-bootstrapyml-的区别)
  - [4.4 怎么禁用某个自动配置？](#44-怎么禁用某个自动配置)
  - [4.5 `SpringFactoriesLoader` 机制？](#45-springfactoriesloader-机制)
  - [4.6 Spring Boot 启动流程？](#46-spring-boot-启动流程)
  - [4.7 你项目里怎么接入 SOFA 中间件的？](#47-你项目里怎么接入-sofa-中间件的)
- [引用](#引用)

---

# Spring 与 Spring Boot 

这篇主要整理 Spring 与 Spring Boot 面试中最常见的几个问题：二者区别、自动配置原理、配置文件优先级、外部组件接入方式，以及面试官常追问的细节。回答时可以先讲结论，再补自动配置和 Starter 机制，这样逻辑会更完整。

## 一、Spring 和 Spring Boot 有什么区别
### 一句话
> Spring 是框架，Spring Boot 是 Spring 的自动装配层 + 运维工具层，本质是“用约定消灭配置”。

### 核心区别
| 维度 | Spring | Spring Boot |
| ---- | ---- | ---- |
| 启动方式 | 手动配置 `ApplicationContext` | `@SpringBootApplication` 一键启动 |
| 依赖管理 | 手动选版本，版本冲突频发 | Starter BOM 统一版本，引入即用 |
| 配置方式 | 大量 XML / Java Config | 约定大于配置，`application.yml` 零配置开箱 |
| 内嵌容器 | 需要打 WAR 包部署到 Tomcat | 内嵌 Tomcat/Jetty，`java -jar` 直接跑 |
| 自动配置 | 无，每个 Bean 手动声明 | `@EnableAutoConfiguration` 按条件自动装配 |
| 运维能力 | 无内置 | Actuator 健康检查、指标、环境信息 |
| 生产就绪 | 需要大量额外配置 | 开箱即用（日志、监控、外部化配置） |

Spring Boot 并不是替代 Spring，而是在 Spring 之上补齐了工程化能力。它把依赖版本管理、自动配置、内嵌容器、外部化配置和生产监控统一起来，让开发者少写大量重复配置。

## 自动配置原理（必问）
```
@SpringBootApplication
├── @SpringBootConfiguration → 本质就是 @Configuration
├── @EnableAutoConfiguration → 核心！自动配置入口
└── @ComponentScan           → 扫描当前包及子包的 @Component
```

`@EnableAutoConfiguration` 做了什么：
1. 加载 `META-INF/spring.factories`（Spring Boot 2.x）
   或 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（3.x）
2. 读取所有 AutoConfiguration 类
3. 每个 AutoConfiguration 类上有 `@Conditional` 系列注解
4. 条件满足 → 装配 Bean；条件不满足 → 跳过

可以把自动配置理解成“候选配置列表 + 条件判断”。Spring Boot 先把可能用到的自动配置类加载进来，再根据 classpath、已有 Bean、配置项、Web 环境等条件决定哪些真正生效。

## 关键条件注解
| 注解 | 作用 |
| ---- | ---- |
| `@ConditionalOnClass` | classpath 存在某个类时生效 |
| `@ConditionalOnMissingBean` | 容器中没有该 Bean 时生效 |
| `@ConditionalOnProperty` | 配置项满足条件时生效 |
| `@ConditionalOnWebApplication` | Web 应用时生效 |

> 举例：引入 `spring-boot-starter-data-redis` 后，classpath 有 `RedisTemplate.class`，`RedisAutoConfiguration` 的 `@ConditionalOnClass` 成立，自动创建 `RedisTemplate` Bean。没引入则不生效，零成本。

## 面试回答
> Spring 是 IoC + AOP 的框架基础，Spring Boot 在 Spring 之上做了三件事：一是通过 Starter + 自动配置消灭了样板配置，引入 `starter-web` 就有 Tomcat 和 MVC，引入 `starter-redis` 就有 `RedisTemplate`；二是内嵌容器让应用从 WAR 部署变成 `java -jar` 独立运行；三是 Actuator 提供了生产级运维能力。本质区别不是技术栈不同，而是 Spring Boot 用“约定大于配置”把 Spring 的使用成本降了一个量级。

---

## 二、Spring Boot 配置文件优先级

自动配置解决的是“Bean 怎么自动装配”，配置优先级解决的是“同一个属性到底听谁的”。Spring Boot 的外部化配置非常灵活，面试时最容易考 jar 包内外、profile、默认值之间的覆盖关系。

### 优先级从高到低（完整版）
1. 命令行参数
2. JNDI 属性
3. Java 系统属性
4. 操作系统环境变量
5. random.* 属性
6. jar 包外 `application-{profile}.yml` ← 最常用
7. jar 包内 `application-{profile}.yml`
8. jar 包外 `application.yml` ← 最常用
9. jar 包内 `application.yml`
10. `@PropertySource` 注解指定的配置
11. `SpringApplication.setDefaultProperties()` 的默认值

### 高频考点：jar 包外 > jar 包内
```
myapp/
├── config/
│   └── application.yml ← 优先级最高（jar 外 config 目录）
├── application.yml     ← 次之（jar 外根目录）
├── myapp.jar
│   └── BOOT-INF/classes/
│       └── application.yml ← 最低（jar 内）
```

### 完整的外部配置覆盖顺序（jar 外）
`config/application-{profile}.yml` ← 最高

同一层级内，profile 配置永远覆盖默认配置。

### 高频考点：properties vs yml 优先级
同一位置同时存在 `application.properties` 和 `application.yml`：
- properties 优先级高于 yml
- 但实际项目不应同时存在，容易混乱

### 高频考点：多配置文件激活
```yaml
spring:
  profiles:
    active: dev         # 激活 dev
    include:            # 额外包含（补充配置）
      - redis
      - mq
    group:              # Spring Boot 2.4+ 配置组
      production:
        - prod
        - redis
        - mq
```

| 属性 | 作用 | 版本 |
| ---- | ---- | ---- |
| `spring.profiles.active` | 激活某个 profile | 全版本 |
| `spring.profiles.include` | 在当前 profile 基础上追加 profile | 全版本 |
| `spring.profiles.group` | 定义 profile 组，激活组名等于激活组内所有 | 2.4+ |

配置优先级的核心规律可以先记三句话：命令行参数优先级最高，外部配置覆盖内部配置，profile 配置覆盖默认配置。再进一步区分代码里的默认值，就能回答大多数追问。

### 高频考点：配置文件 vs 代码默认值 —— 谁覆盖谁？
结论：配置文件 > 代码默认值，但有两种“代码默认值”，优先级完全不同。

### 第一种：`@ConfigurationProperties` 字段初始值 / `@Value` 冒号默认值
```java
// 写法1：字段初始值
@ConfigurationProperties(prefix = "my.service")
public class MyProperties {
    private int timeout = 3000; // ← 代码默认值
}

// 写法2：@Value 冒号默认值
@Value("${my.service.timeout:3000}") // ← 冒号后面是代码默认值
private int timeout;
```

这两种默认值的优先级低于所有配置源——只要任何一层配置文件里写了 `my.service.timeout=5000`，就会覆盖代码默认值。

> 优先级（高→低）：
> 命令行参数 > 系统属性 > 环境变量 > jar外配置 > jar内配置 > 代码默认值
> ↑ 最底层

### 验证：
```
# application.yml 不配置 my.service.timeout
# → timeout = 3000（代码默认值生效）

# application.yml 配置 my.service.timeout=5000
# → timeout = 5000（配置文件覆盖代码默认值）
```

### 第二种：`SpringApplication.setDefaultProperties()` 设置的默认值
```java
SpringApplication app = new SpringApplication(App.class);
Properties defaults = new Properties();
defaults.setProperty("server.port", "8080");
app.setDefaultProperties(defaults); // ← 这种默认值
app.run(args);
```

这个默认值的优先级比所有配置文件都低，甚至低于 `@PropertySource`。它在优先级列表的最末尾（第 11 位）。

### 完整优先级图示（关键！）
```
高
┌─────────────────────────────────────────────────────────────────┐
│ 1. 命令行参数                   --server.port=8081                │
│ 2. JNDI 属性                                                      │
│ 3. Java 系统属性                -Dserver.port=8081                │
│ 4. 操作系统环境变量              SERVER_PORT=8081                  │
│ 5. random.*                                                       │
│ 6. jar外 application-{profile}.yml                                │
│ 7. jar内 application-{profile}.yml                                │
│ 8. jar外 application.yml                                          │
│ 9. jar内 application.yml                                          │
│ 10. @PropertySource 指定的配置                                     │
│ 11. setDefaultProperties() 的默认值                                │
├─────────────────────────────────────────────────────────────────┤
│ ↓ 更低 ↓                                                          │
│ @ConfigurationProperties 字段初始值 / @Value(:默认)                │
│ ← 最底层，任何配置源都能覆盖它                                     │
└─────────────────────────────────────────────────────────────────┘
低
```

> 面试易错点：`setDefaultProperties()` 和 `@ConfigurationProperties` 字段默认值是两回事。前者是 Environment 里的一个配置源，后者只是属性绑定阶段的兜底值。

```java
// 我们项目里 DRM 动态配置的写法
@ConfigurationProperties(prefix = "sofa.ai.antllm.chat")
public class AntLlmChatProperties {
    private String baseUrl = "https://antchat.alipay.com"; // 代码默认值
    private String appToken;                                // 无默认值，必须配置
}
```

> 优先级：
> DRM 运行时推送的值 > application.properties 中的值 > 代码默认值 `"https://antchat.alipay.com"`

DRM 推送 > 配置文件 > 代码默认值，三层覆盖，运行时可热更新。

> Spring Boot 配置优先级的核心规则是“外部覆盖内部、profile 覆盖默认、命令行覆盖一切”。具体来说：命令行参数优先级最高，然后是系统属性和环境变量；文件配置中，jar 包外覆盖 jar 包内，config 目录覆盖根目录，`application-{profile}.yml` 覆盖 `application.yml`。
>
> 关于配置文件和代码默认值的关系——配置文件一定大于代码默认值。但要区分两种“代码默认值”：`@ConfigurationProperties` 的字段初始值和 `@Value("${key:default}")` 的冒号默认值，它们是属性绑定的兜底值，优先级低于所有配置源，任何一层配置文件写了就覆盖；而 `setDefaultProperties()` 是 Environment 的一个配置源，优先级排在第 11 位，高于前者但低于所有配置文件。我们项目里用这个机制做环境隔离——代码里写默认值兜底，jar 内配置文件放开发环境值，jar 外 config 目录放生产环境值，DRM 运行时推送覆盖一切。

---

## 三、Spring Boot 怎么接入一个外部组件
以接入 Redis 为例，完整链路通常是：引入 Starter、编写连接配置、直接注入使用。这里体现的还是 Spring Boot 的核心思想：依赖存在时自动装配，用户有自定义 Bean 时优先生效。

引入 Starter 做了什么？
- 自动引入 `spring-data-redis`、`lettuce-core`（或 jedis）等依赖
- BOM 管理版本，不需要手动指定

### 第二步：配置连接
```yaml
spring:
  data:
    redis:
      host: 127.0.0.1
      port: 6379
      password: xxx
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
```

### 第三步：直接使用
```java
@Autowired
private RedisTemplate<String, Object> redisTemplate;

public void set(String key, Object value) {
    redisTemplate.opsForValue().set(key, value, 30, TimeUnit.MINUTES);
}
```

不需要手动创建 `RedisTemplate` Bean——`RedisAutoConfiguration` 已经自动配好了。

## Starter 自动配置原理（面试核心）
引入 `spring-boot-starter-data-redis`
→ classpath 出现 `RedisTemplate.class`
→ `spring.factories` 声明了 `RedisAutoConfiguration`
→ `@ConditionalOnClass(RedisTemplate.class)` 成立
→ `@ConditionalOnMissingBean(RedisTemplate.class)` 成立（用户没自定义）
→ 自动创建 `RedisTemplate` Bean

如果用户自己定义了 `RedisTemplate` Bean 呢？
> `@ConditionalOnMissingBean` 不成立 → 自动配置跳过 → 用户自定义的生效。这就是 Spring Boot 的“用户优先”原则。

如果面试官继续追问“公司内部组件怎么接入”，就可以从使用 Starter 过渡到自定义 Starter。标准答案不是把所有 Bean 都手写在业务项目里，而是把可复用的装配逻辑沉淀成自动配置。

## 自定义 Starter 的标准套路（进阶考点）
面试官问“你自己写过 Starter 吗”，用这个结构回答：

### 1. 项目结构
```
my-spring-boot-starter/
├── my-starter-autoconfigure/
│   ├── MyProperties.java              ← 配置属性类
│   ├── MyService.java                 ← 核心服务
│   ├── MyAutoConfiguration.java       ← 自动配置类
│   └── META-INF/spring/
│       └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
└── my-starter/                         ← 依赖聚合模块（空壳）
    └── pom.xml                         ← 只引入 autoconfigure + 核心依赖
```

### 2. 配置属性类
```java
@ConfigurationProperties(prefix = "my.service")
public class MyProperties {
    private String endpoint = "http://localhost:8080";
    private int timeout = 3000;
    private boolean enabled = true;
    // getter/setter
}
```

### 3. 核心服务
```java
public class MyService {
    private final MyProperties properties;

    public MyService(MyProperties properties) {
        this.properties = properties;
    }

    public String call(String request) {
        // 使用 properties.getEndpoint()、properties.getTimeout()
    }
}
```

### 4. 自动配置类
```java
@AutoConfiguration
@ConditionalOnClass(MyService.class)
@EnableConfigurationProperties(MyProperties.class)
public class MyAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(prefix = "my.service", name = "enabled", havingValue = "true", matchIfMissing = true)
    public MyService myService(MyProperties properties) {
        return new MyService(properties);
    }
}
```

### 5. 注册自动配置
Spring Boot 3.x:
```
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.MyAutoConfiguration
```

Spring Boot 2.x:
```
# META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.example.MyAutoConfiguration
```

### 6. 使用方引入
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>my-starter</artifactId>
</dependency>
```

```yaml
my:
  service:
    endpoint: http://prod-server:8080
    timeout: 5000
```

## 接入外部组件的三种模式总结
| 模式 | 做法 | 适用场景 | 举例 |
| ---- | ---- | ---- | ---- |
| Starter 自动配置 | 引入 Starter + 配置文件 | 社区有现成 Starter | Redis、MyBatis、Kafka |
| 自定义 Starter | 写 AutoConfiguration + 注册 | 内部中间件、公司组件 | SOFA Boot Starter、内部 SDK |
| 手动集成 | `@Configuration` + `@Bean` | 无 Starter、需要精细控制 | 自研组件、老系统对接 |

> 接入外部组件分三种情况。如果社区有 Starter，引入依赖加配置就行，Spring Boot 的自动配置会通过 `@ConditionalOnClass` 检测 classpath，条件满足就自动创建 Bean。如果是我们内部的中间件，我会按 Starter 规范自己写一个——定义 `@ConfigurationProperties` 绑定配置，写 `@AutoConfiguration` 类用 `@ConditionalOnMissingBean` 保证用户可覆盖，注册到 `AutoConfiguration.imports`。如果组件没有 Starter 也不值得封装，就手动写 `@Configuration` + `@Bean`。核心原则是“约定大于配置，用户定义优先于自动配置”。

---

## 四、面试高频追问

前面几个问题覆盖了主线，下面这些是面试里常见的追问点。准备时重点记住每个问题的“一句话结论”，再补一两个关键细节即可。

### 4.1 `@Conditional` 系列注解有哪些？
| 注解 | 条件 |
| ---- | ---- |
| `@ConditionalOnClass` | classpath 存在指定类 |
| `@ConditionalOnMissingClass` | classpath 不存在指定类 |
| `@ConditionalOnBean` | 容器中存在指定 Bean |
| `@ConditionalOnMissingBean` | 容器中不存在指定 Bean |
| `@ConditionalOnProperty` | 配置属性满足条件 |
| `@ConditionalOnWebApplication` | 是 Web 应用 |
| `@ConditionalOnNotWebApplication` | 不是 Web 应用 |
| `@ConditionalOnExpression` | SpEL 表达式为 true |

最常用的是 `@ConditionalOnClass`（检测依赖是否存在）和 `@ConditionalOnMissingBean`（用户可覆盖）。

### 4.2 Spring Boot 2.x 和 3.x 自动配置注册的区别？
| | Spring Boot 2.x | Spring Boot 3.x |
| ---- | ---- | ---- |
| 注册文件 | `META-INF/spring.factories` | `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` |
| 注解 | `@Configuration` | `@AutoConfiguration`（新注解，支持 `after` / `before` 排序） |
| 条件注解 | 同 3.x | 同 2.x，但部分移到 `spring-boot-autoconfigure` 新包路径 |

迁移：2.x 的 `spring.factories` 在 3.x 仍然兼容但已 deprecated，建议迁移到新文件。

### 4.3 `application.yml` 和 `bootstrap.yml` 的区别？
| | application.yml | bootstrap.yml |
| ---- | ---- | ---- |
| 加载时机 | 应用上下文创建时 | 引导上下文（Bootstrap Context）创建时，更早 |
| 用途 | 应用自身配置 | 配置中心地址、加解密配置 |
| Spring Cloud | 后加载 | 先加载，用于拉取远程配置 |
| Spring Boot 单体 | 唯一配置文件 | 不需要 |

Spring Cloud 2020+ 默认禁用了 bootstrap 上下文，改用 `spring.config.import` 导入配置中心。

### 4.4 怎么禁用某个自动配置？
```java
// 方式1：排除指定自动配置类
@SpringBootApplication(exclude = {RedisAutoConfiguration.class})
```

```yaml
# 方式2：配置文件
spring:
  autoconfigure:
    exclude: org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```

```yaml
# 方式3：@ConditionalOnProperty 控制开关
my:
  feature:
    enabled: false
```

### 4.5 `SpringFactoriesLoader` 机制？
```
SpringFactoriesLoader.loadFactoryNames(type, classLoader)
→ 扫描所有 jar 包的 META-INF/spring.factories
→ 读取 key=type 对应的 value（全限定类名列表）
→ 返回类名列表
```

这是 Spring Boot 自动配置的底层机制——`@EnableAutoConfiguration` 通过 `SpringFactoriesLoader` 扫描所有 jar 包的 `spring.factories`，找到 `EnableAutoConfiguration` key 对应的所有自动配置类。

Spring Boot 3.x 改用 `AutoConfiguration.imports` 文件，但底层思想一致：约定文件路径 + 全限定类名列表 = SPI 机制。

### 4.6 Spring Boot 启动流程？
```
main()
→ new SpringApplication()
   → 推断应用类型（Servlet / Reactive / None）
   → 加载 ApplicationContextInitializer
   → 加载 ApplicationListener
   → 推断主配置类
→ SpringApplication.run()
   → 创建 Bootstrap Context（Spring Cloud）
   → 创建 ApplicationContext
   → 准备环境（Environment）← 配置文件在这里加载
   → 执行 ApplicationContextInitializer
   → 刷新上下文（refresh）
      → 执行 @Bean 注册
      → 执行 AutoConfiguration
      → 完成依赖注入
   → 执行 CommandLineRunner / ApplicationRunner
→ 应用就绪
```

启动流程可以和前面的自动配置、配置优先级串起来理解：配置文件在准备 Environment 阶段加载，自动配置在刷新上下文阶段参与 Bean 注册，最终完成依赖注入和应用启动。

### 4.7 你项目里怎么接入 SOFA 中间件的？
通过 SOFABoot Starter。比如接入 AntLLM，引入 `sofa-ai-antllm-sofa-boot-starter`，在 `application.properties` 配置 `sofa.ai.antllm.chat.base-url` 和 `sofa.ai.antllm.chat.app-token`，Starter 自动创建 `AntLlmChatClient` Bean，直接 `@Autowired` 注入使用。

接入 DRM 动态配置，引入 `drm-client`，用 `@DrmResource` 注解标记配置类，运行时通过 DRM 控制台热更新，不需要重启。本质和 Spring Boot 官方 Starter 一样，只是蚂蚁内部的中间件封装。

## 引用
