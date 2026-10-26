---
original_dir: SpringBoot自动装配原理
---

## 目录

- [一、什么是自动装配](#一什么是自动装配)
- [二、从 @SpringBootApplication 开始](#二从-springbootapplication-开始)
- [三、@EnableAutoConfiguration 核心流程](#三enableautoconfiguration-核心流程)
- [四、SPI 机制与 spring.factories](#四spi-机制与-springfactories)
- [五、条件注解：装配的守门人](#五条件注解装配的守门人)
- [六、自动装配完整流程图](#六自动装配完整流程图)
- [七、自定义 Starter 实战](#七自定义-starter-实战)
- [八、Spring Boot 2.7+ 变化](#八spring-boot-27-变化)
- [九、常见面试追问](#九常见面试追问)
- [十、面试回答模板](#十面试回答模板)

---

# SpringBoot 自动装配原理

## 一、什么是自动装配

在 Spring Boot 出现之前的 Spring 时代，搭建一个项目要做大量重复工作：

- 手动写 `<bean>` 或 `@Bean` 配置每个组件
- 手动配数据源、事务管理器、视图解析器……
- 一个项目往往要写几百行 XML 或几十个 `@Bean`

而有了 Spring Boot 之后，整个流程被极大简化——只要引入对应的 starter 依赖，相关组件就会自动配置好，直接拿来用：

- 引入 `spring-boot-starter-web` → Tomcat、`DispatcherServlet`、Jackson 自动配好
- 引入 `spring-boot-starter-data-redis` → `RedisTemplate`、连接池自动配好
- 引入 `mybatis-spring-boot-starter` → `SqlSessionFactory`、`MapperScanner` 自动配好

一句话概括：

> **自动装配 = 约定大于配置 + 条件化注册 Bean**

核心思想是：**你引入了什么依赖，框架就自动帮你配什么，不需要你手动写。**

---

## 二、从 @SpringBootApplication 开始

要理解自动装配是怎么发生的，必须从启动类上那个最常见的注解 `@SpringBootApplication` 入手。

### 注解拆解

```java
@SpringBootApplication
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);
    }
}
```

这个注解看起来简单，但其实是个组合注解，把它拆开看就是：

```java
@SpringBootConfiguration        // 本质就是 @Configuration，标记当前类是配置类
@EnableAutoConfiguration        // 🔥 核心！开启自动装配
@ComponentScan                  // 组件扫描，扫描当前包及子包下的 @Component/@Service/@Repository 等
public @interface SpringBootApplication {
    // ...
}
```

可以用一张关系图来理解：

```
@SpringBootApplication
├─ @SpringBootConfiguration → 我是配置类
├─ @EnableAutoConfiguration → 开启自动装配（核心入口）
└─ @ComponentScan           → 扫描当前包下的组件
```

其中真正驱动自动装配的，就是 `@EnableAutoConfiguration` 这个注解。

### @EnableAutoConfiguration 拆解

继续拆开 `@EnableAutoConfiguration`，可以看到两个关键的元注解：

```java
@AutoConfigurationPackage                       // 将主类所在包注册为自动配置包
@Import(AutoConfigurationImportSelector.class)  // 🔥 导入自动配置选择器
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.autoconfigure.exclude";

    Class<?>[] exclude() default {};           // 排除特定自动配置类
    String[] excludeName() default {};         // 按类名排除
}
```

重点在 `@Import(AutoConfigurationImportSelector.class)`——它通过 `@Import` 把 `AutoConfigurationImportSelector` 这个选择器导入到容器中，所有的自动装配逻辑都从这里展开。

---

## 三、@EnableAutoConfiguration 核心流程

`AutoConfigurationImportSelector` 是整个自动装配的发动机。它实现了 `DeferredImportSelector` 接口，会在合适的时机决定要把哪些配置类导入 Spring 容器。

### AutoConfigurationImportSelector 做了什么

入口方法是 `selectImports()`：

```java
public class AutoConfigurationImportSelector implements DeferredImportSelector {

    @Override
    public String[] selectImports(AnnotationMetadata annotationMetadata) {
        if (!isEnabled(annotationMetadata)) {
            return NO_IMPORTS;
        }
        // 1. 获取自动配置条目
        AutoConfigurationEntry autoConfigurationEntry =
                getAutoConfigurationEntry(annotationMetadata);
        // 2. 返回需要装配的配置类全限定名数组
        return StringUtils.toStringArray(
                autoConfigurationEntry.getConfigurations()
        );
    }
```

核心逻辑都在 `getAutoConfigurationEntry()` 里，按编号梳理一下每一步在做什么：

```java
    protected AutoConfigurationEntry getAutoConfigurationEntry(
            AnnotationMetadata annotationMetadata) {
        // ① 检查自动装配是否开启 (spring.autoconfigure.enable)
        if (!isEnabled(annotationMetadata)) {
            return EMPTY_ENTRY;
        }

        // ② 获取注解属性 (exclude 等)
        AnnotationAttributes attributes = getAttributes(annotationMetadata);

        // ③ 🔥 从 spring.factories 加载所有自动配置类
        List<String> configurations = getCandidateConfigurations(
                annotationMetadata, attributes);

        // ④ 去重
        configurations = removeDuplicates(configurations);

        // ⑤ 处理 exclude 配置，剔除用户显式排除的类
        Set<String> exclusions = getExclusions(annotationMetadata, attributes);
        checkExcludedClasses(configurations, exclusions);
        configurations.removeAll(exclusions);

        // ⑥ 🔥 过滤：根据条件注解筛选最终生效的配置类
        configurations = filter(configurations, autoConfigurationMetadata);

        // ⑦ 触发自动配置导入事件
        fireAutoConfigurationImportEvents(configurations, exclusions);

        return new AutoConfigurationEntry(configurations, exclusions);
    }
}
```

### 流程总结

可以用一张流程图把上面这段代码串起来：

```mermaid
flowchart TD
A[@SpringBootApplication] --> B[@EnableAutoConfiguration]
B --> C[@Import AutoConfigurationImportSelector]
C --> D[selectImports]
D --> E[③ getCandidateConfigurations<br/>从 spring.factories 读取候选配置类]
E --> F[④ removeDuplicates 去重]
F --> G[⑤ getExclusions 排除]
G --> H[⑥ filter 根据条件注解过滤]
H --> I[返回生效的配置类全限定名]
I --> J[Spring 容器加载这些配置类]
J --> K[配置类中的 @Bean 注册到容器]
```

整个流程的关键点：**先把所有候选都搜出来，再用条件注解一层层筛，最后只把"该生效的"配置类交给 Spring 容器去注册 Bean。**

那"所有候选"是从哪里来的？这就要讲到 SPI 机制和 `spring.factories` 了。

---

## 四、SPI 机制与 spring.factories

### 什么是 SPI

SPI（Service Provider Interface）是一种服务发现机制，思路非常简单：

- 框架方定义接口
- 第三方提供实现
- 运行时通过约定的位置（如配置文件）自动发现实现类

Java 自带的 `ServiceLoader` 就是经典的 SPI 实现，而 Spring 在此基础上做了自己的一套 SPI——这套机制就是自动装配的"目录文件系统"。

### spring.factories 文件

约定的位置是：`META-INF/spring.factories`

举个例子，`spring-boot-autoconfigure` 这个 jar 里的 `spring.factories` 大致长这样：

```properties
# spring-boot-autoconfigure 包中的 spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration,\
org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration,\
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,\
org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,\
org.springframework.boot.autoconfigure.mybatis.MybatisAutoConfiguration,\
# ... 100+ 个自动配置类
```

每一行 `XxxAutoConfiguration` 就是一个"候选"自动配置类。

### 加载流程

`getCandidateConfigurations()` 内部最终会调用 `SpringFactoriesLoader.loadFactoryNames()`，把所有 jar 包里的 `spring.factories` 都扫一遍，读取 `EnableAutoConfiguration` 对应的配置类列表，再合并去重后返回。

简化后的核心逻辑如下：

```java
// SpringFactoriesLoader 核心逻辑
public static List<String> loadFactoryNames(Class<?> factoryType, ClassLoader classLoader) {
    String factoryTypeName = factoryType.getName();
    return loadSpringFactories(classLoader)
            .getOrDefault(factoryTypeName, Collections.emptyList());
}

private static Map<String, List<String>> loadSpringFactories(ClassLoader classLoader) {
    // 缓存检查
    Map<String, List<String>> result = cache.get(classLoader);
    if (result != null) return result;

    // 扫描所有 META-INF/spring.factories
    Enumeration<URL> urls = classLoader.getResources("META-INF/spring.factories");
    result = new LinkedHashMap<>();
    while (urls.hasMoreElements()) {
        URL url = urls.nextElement();
        Properties properties = PropertiesLoaderUtils.loadProperties(
                new UrlResource(url));
        for (Map.Entry<?, ?> entry : properties.entrySet()) {
            String factoryTypeName = ((String) entry.getKey()).trim();
            // 按逗号分割多个实现类
            for (String factoryImplementationName :
                    StringUtils.commaDelimitedListToStringArray(
                            ((String) entry.getValue()).trim())) {
                result.computeIfAbsent(factoryTypeName, k -> new ArrayList<>())
                        .add(factoryImplementationName.trim());
            }
        }
    }
    cache.put(classLoader, result);
    return result;
}
```

### 关键点

理解这一层，有几个结论要记住：

1. `spring.factories` **不是 Spring Boot 的发明**，它本质上是 Spring Framework 提供的 SPI 机制
2. 所有 jar 包的 `spring.factories` **都会被扫描，最后合并到一起**
3. 这就是为什么"引入 starter 依赖就能自动装配"——starter 的 jar 里都带着自己的 `spring.factories`
4. 这一步加载出来的只是**候选**配置类，**是否真正生效要看条件注解**

---

## 五、条件注解：装配的守门人

从 `spring.factories` 里加载出 100+ 个候选配置类，并不是每个都会真的生效。决定它们命运的，是一系列 `@Conditional*` 条件注解。

### 条件注解体系

Spring Boot 在 Spring 4.0 的 `@Conditional` 基础上扩展出了一整套语义化的条件注解：

```
@Conditional                       ← Spring 4.0 基础注解
├─ @ConditionalOnClass             ← classpath 中存在某个类时生效
├─ @ConditionalOnMissingClass      ← classpath 中不存在某个类时生效
├─ @ConditionalOnBean              ← 容器中存在某个 Bean 时生效
├─ @ConditionalOnMissingBean       ← 容器中不存在某个 Bean 时生效
├─ @ConditionalOnProperty          ← 配置文件中某个属性匹配时生效
├─ @ConditionalOnWebApplication    ← 当前是 Web 应用时生效
├─ @ConditionalOnNotWebApplication ← 当前不是 Web 应用时生效
├─ @ConditionalOnExpression        ← SpEL 表达式为 true 时生效
└─ @ConditionalOnSingleCandidate   ← 容器中某个 Bean 只有一个候选时生效
```

### 以 DataSourceAutoConfiguration 为例

看 Spring Boot 自己的源码就能体会到这套条件注解是怎么用的：

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)                // ① classpath 有 DataSource 类
@ConditionalOnMissingBean(DataSource.class)          // ② 容器中没有自定义 DataSource
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource dataSource(DataSourceProperties properties) {
        return DataSourceBuilder.create()
                .url(properties.getUrl())
                .username(properties.getUsername())
                .password(properties.getPassword())
                .driverClassName(properties.getDriverClassName())
                .build();
    }
}
```

它的生效条件有两个：

1. classpath 里有 `DataSource.class`（也就是引入了 `spring-boot-starter-jdbc` 之类的依赖）
2. 容器里没有用户自定义的 `DataSource` Bean

如果用户自己定义了 `DataSource`，`@ConditionalOnMissingBean` 就不满足，这个自动配置就不会生效，最终用的是用户自己那一份。

### 以 RedisAutoConfiguration 为例

Redis 的自动配置思路完全一致：

```java
@AutoConfiguration
@ConditionalOnClass(RedisOperations.class)        // classpath 有 Redis
@EnableConfigurationProperties(RedisProperties.class)
public class RedisAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate") // 没有自定义 RedisTemplate
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }
}
```

生效条件：

1. classpath 里有 `RedisOperations.class`（引入了 `spring-boot-starter-data-redis`）
2. 容器里没有名字叫 `redisTemplate` 的 Bean

配置项则统一从 `RedisProperties` 读取：

```properties
spring.redis.host=localhost
spring.redis.port=6379
```

### @ConditionalOnMissingBean 的设计哲学

`@ConditionalOnMissingBean` 不是一个普通的条件注解，它体现的是 Spring Boot 整个自动装配体系的核心哲学——**"用户优先"原则**：

- 用户自定义的 Bean 优先
- 自动配置只是兜底（用户没配才自动配）
- **这就是为什么自动配置不会覆盖你的自定义配置**

---

## 六、自动装配完整流程图

把前面所有环节串起来，整个 Spring Boot 启动 + 自动装配的流程是这样的：

```mermaid
flowchart TD
A[启动 SpringApplication.run]
A --> B[1. 创建 ApplicationContext]
A --> C[2. 扫描 @SpringBootApplication]
C --> C1[@ComponentScan → 扫描主类包下的 @Component/@Service/@Repository/@Controller]
C --> C2[@EnableAutoConfiguration → 进入自动装配流程]
C2 --> D[3. AutoConfigurationImportSelector.selectImports]
D --> D1[3.1 从所有 jar 的 META-INF/spring.factories 读取候选配置类<br/>加载 100+ 个 xxxAutoConfiguration]
D --> D2[3.2 去重 + 排除<br/>- @SpringBootApplication exclude<br/>- spring.autoconfigure.exclude]
D --> D3[3.3 🔥 条件过滤 核心<br/>- @ConditionalOnClass → classpath 有这个类吗<br/>- @ConditionalOnBean → 容器里有这个 Bean 吗<br/>- @ConditionalOnProperty → 配置文件有这个属性吗<br/>- @ConditionalOnMissingBean → 用户没自定义才生效<br/>不满足条件的配置类被过滤掉]
D --> D4[3.4 返回生效的配置类列表]
D4 --> E[4. Spring 容器加载生效的配置类<br/>解析 @Bean 方法 → 注册 BeanDefinition → 实例化 Bean]
E --> F[5. 自动装配完成<br/>用户可以直接 @Autowired 注入自动配置的 Bean]
```

### 以 spring-boot-starter-web 为例的完整链路

光看流程图还是有些抽象，拿最常见的 `spring-boot-starter-web` 来看一遍完整链路。

**引入依赖：**

```
spring-boot-starter-web
├─ spring-boot-starter          ← 自动装配基础
├─ spring-boot-starter-tomcat   ← 内嵌 Tomcat
├─ spring-webmvc                ← Spring MVC
└─ spring-boot-starter-json     ← Jackson
```

**spring.factories 加载后的候选与判定结果：**

```
ServletWebServerFactoryAutoConfiguration    ← @ConditionalOnClass(ServletRequest.class) ✅
WebMvcAutoConfiguration                     ← @ConditionalOnClass(DispatcherServlet.class) ✅
JacksonHttpMessageConvertersConfiguration   ← @ConditionalOnClass(ObjectMapper.class) ✅
RedisAutoConfiguration                      ← @ConditionalOnClass(RedisOperations.class) ❌ 没引入 Redis
DataSourceAutoConfiguration                 ← @ConditionalOnClass(DataSource.class) ❌ 没引入 JDBC
```

**最终生效的效果：**

- ✅ Tomcat 自动启动
- ✅ DispatcherServlet 自动注册
- ✅ Jackson 自动配置
- ✅ 静态资源处理自动配置
- ❌ Redis 自动配置不生效（没有依赖）
- ❌ DataSource 自动配置不生效（没有依赖）

到这里就完整呈现了"引入 starter → 自动装配生效"的全过程。

---

## 七、自定义 Starter 实战

理论看完了，最好的方式还是自己动手做一个 starter。下面以 Redis 为例，从零写一个简化版的 `redis-spring-boot-starter`。

### 目标：做一个 redis-spring-boot-starter

#### 1. 项目结构

```
redis-spring-boot-starter/
├─ pom.xml
└─ src/main/
   ├─ java/com/example/redis/
   │  ├─ RedisAutoConfiguration.java    ← 自动配置类
   │  └─ RedisProperties.java           ← 配置属性类
   └─ resources/
      └─ META-INF/
         └─ spring.factories            ← SPI 声明
```

#### 2. 配置属性类

```java
@ConfigurationProperties(prefix = "my.redis")
public class RedisProperties {
    private String host = "localhost";
    private int port = 6379;
    private String password;
    private int database = 0;
    private int timeout = 3000;

    // getter/setter ...
}
```

#### 3. 自动配置类

```java
@AutoConfiguration
@ConditionalOnClass(RedisOperations.class)            // 有 Redis 依赖才生效
@EnableConfigurationProperties(RedisProperties.class) // 激活配置属性
public class RedisAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate") // 用户没自定义才生效
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        // key 用 String 序列化
        template.setKeySerializer(new StringRedisSerializer());
        // value 用 JSON 序列化
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    @ConditionalOnMissingBean
    public StringRedisTemplate stringRedisTemplate(
            RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}
```

#### 4. spring.factories

最关键的一步——告诉 Spring Boot "我这里有自动配置类"：

```
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.redis.RedisAutoConfiguration
```

#### 5. 使用

业务项目里只要引入依赖、写一点配置，就可以直接注入 `RedisTemplate` 了：

```xml
<!-- 引入 starter -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>redis-spring-boot-starter</artifactId>
</dependency>
```

```yaml
# application.yml
my:
  redis:
    host: 192.168.1.100
    port: 6379
    password: secret
```

```java
@Autowired
private RedisTemplate<String, Object> redisTemplate;  // 直接注入，自动配好了
```

是不是和我们平时用各种官方 starter 的体验一模一样？这就是自动装配赋予我们的"开箱即用"能力。

---

## 八、Spring Boot 2.7+ 变化

到目前为止讲的都是基于 `spring.factories` 的"老方式"。但从 Spring Boot 2.7 开始，自动配置的注册方式发生了变化。

### spring.factories → AutoConfiguration.imports

**旧方式（2.7 之前）：**

```
META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.XxxAutoConfiguration
```

**新方式（2.7+）：**

```
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.XxxAutoConfiguration    ← 每行一个类名
```

到了 **Spring Boot 3.0**，`spring.factories` 里的 `EnableAutoConfiguration` 配置彻底废弃，框架只认 `AutoConfiguration.imports` 文件。

### 为什么要改

这个调整不是为了改而改，背后有几条非常实际的原因：

1. **`spring.factories` 是全局 SPI，被很多框架滥用**：一个文件里塞了各种接口的实现，不好管理
2. **`AutoConfiguration.imports` 专用于自动配置**：职责单一，只管自动配置类
3. **性能优化**：不需要解析 Properties 格式，直接按行读取类名，启动速度更快
4. **更清晰**：文件名就是用途，一看就知道是自动配置

### 迁移方式

迁移成本非常低，把原来的内容换个文件就行：

**旧文件：`META-INF/spring.factories`**

```
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.AutoConfig1,\
  com.example.AutoConfig2
```

**新文件：`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`**

```
com.example.AutoConfig1
com.example.AutoConfig2
```

如果你在维护一个自定义 starter，建议同时保留两个文件以兼容不同版本的 Spring Boot。

---

## 九、常见面试追问

理解了原理，面试时再追问几个细节也能从容应对。

### Q1：自动装配的配置类什么时候加载？和 @ComponentScan 有什么区别？

`@ComponentScan` 的行为：

- 启动时立即扫描，注册所有扫到的 `@Component`
- 扫描范围：主类所在包及子包

自动配置类（`AutoConfiguration`）的行为：

- 通过 `@Import(AutoConfigurationImportSelector.class)` 导入
- 实现 `DeferredImportSelector` 接口 → **延迟加载**
- 在 `@ComponentScan` 扫描完之后才处理

为什么要"延迟"？

> 确保用户自定义的 Bean 先注册，这样 `@ConditionalOnMissingBean` 才能正确判断"用户有没有自定义"，从而保证自动配置永远是兜底，不会覆盖用户的配置。

### Q2：如何排除不需要的自动配置？

```java
// 方式1：@SpringBootApplication 注解排除
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    RedisAutoConfiguration.class
})

// 方式2：配置文件排除
spring.autoconfigure.exclude=\
  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration

// 方式3：@ConditionalOnProperty 条件控制
// 自动配置类本身有条件注解，不满足条件就不生效
```

### Q3：自动装配会不会导致启动很慢？

会有影响，但 Spring Boot 做了不少优化：

1. **条件注解过滤**：大部分配置类在过滤阶段就被排除了，不会真正实例化
2. 100+ 个候选配置类 → 过滤后通常只剩 20-30 个实际生效
3. 启动时间增加约 1-2 秒，在大部分场景下是可以接受的

### Q4：如何查看哪些自动配置生效了？

最简单的办法是开启自动配置报告：

```yaml
# application.yml 开启自动配置报告
debug: true
```

启动日志里会打印类似这样的内容：

```
=========================
CONDITIONS EVALUATION REPORT
=========================

Positive matches:（生效的自动配置）
-----------------

   WebMvcAutoConfiguration matched:
      - @ConditionalOnClass found required class 'DispatcherServlet' (OnClassCondition)

Negative matches:（未生效的自动配置）
-----------------

   RedisAutoConfiguration:
      Did not match:
         - @ConditionalOnClass did not find required class 'RedisOperations' (OnClassCondition)
```

如果引入了 Actuator，也可以通过端点查看：

```
GET /actuator/conditions
GET /actuator/beans
```

### Q5：@ConditionalOnMissingBean 为什么能保证用户优先？

关键在于**加载顺序**：

1. `@ComponentScan` 扫描用户自定义的 `@Component`/`@Bean` → **先注册**
2. `DeferredImportSelector` 延迟加载自动配置类 → **后处理**

因为自动配置类是 `DeferredImportSelector`，它在 `@ComponentScan` 之后执行，此时用户自定义的 Bean 已经在容器中了，`@ConditionalOnMissingBean` 检测到已存在，自动配置的 `@Bean` 就不会生效。

这就是 Spring Boot "约定大于配置"的核心——**自动配置是兜底，用户可以随时覆盖**。

---

## 十、面试回答模板

最后给一份精简的口述版本，用于面试回答：

> Spring Boot 自动装配的核心流程是这样的：
>
> 入口是 `@SpringBootApplication` 注解，它里面包含了 `@EnableAutoConfiguration`，通过 `@Import` 导入了 `AutoConfigurationImportSelector`。
>
> 第一步，`AutoConfigurationImportSelector` 通过 `SpringFactoriesLoader` 扫描所有 jar 包的 `META-INF/spring.factories` 文件，读取 `EnableAutoConfiguration` 对应的自动配置类列表，大概有 100 多个。
>
> 第二步，对这些配置类进行去重和排除，排除掉 `@SpringBootApplication(exclude)` 和配置文件中指定的类。
>
> 第三步是关键，通过条件注解进行过滤。比如 `@ConditionalOnClass` 检查 classpath 是否有某个类，`@ConditionalOnMissingBean` 检查容器中是否已有自定义的 Bean。只有条件满足的配置类才会真正生效。
>
> 最后，生效的配置类被 Spring 容器加载，里面的 `@Bean` 方法把 Bean 注册到容器，完成自动装配。
>
> 这里有个重要的设计原则：自动配置类实现了 `DeferredImportSelector`，是延迟加载的，在 `@ComponentScan` 之后执行，所以 `@ConditionalOnMissingBean` 能保证用户自定义的 Bean 优先，自动配置只是兜底。
>
> Spring Boot 2.7 之后，`spring.factories` 方式被 `AutoConfiguration.imports` 文件取代，更简洁也更高效。
