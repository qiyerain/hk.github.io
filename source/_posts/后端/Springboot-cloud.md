---
title: SpringCloud & SpringBoot
date: 2024/08/01 20:46:25
article_id: c59a3aa0-5197-5657-9d52-ba4046844ab1
categories:
- Java
tags:
- Java
- SpringBoot
- SpringCloud
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-19.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-19.webp

---

## 目录

- [一、SpringBoot 核心注解](#一springboot-核心注解)
- [二、配置管理](#二配置管理)
  - [YAML 语法](#yaml-语法)
  - [@Value 与 @ConfigurationProperties](#@value-与-@configurationproperties)
  - [@PropertySource 加载指定配置文件](#@propertysource-加载指定配置文件)
  - [多环境配置](#多环境配置)
- [三、Spring 配置](#三spring-配置)
  - [@ImportResource 导入 XML 配置](#@importresource-导入-xml-配置)
  - [全注解方式 @Configuration + @Bean](#全注解方式-@configuration-@bean)
- [四、HTTP 请求与 RESTful](#四http-请求与-restful)
  - [@RestController](#@restcontroller)
  - [RESTful 风格注解](#restful-风格注解)
  - [GET 与 POST 的区别](#get-与-post-的区别)
- [五、集合迭代 - Iterator](#五集合迭代-iterator)
- [六、Kafka 基础](#六kafka-基础)
- [七、Swagger 接口文档](#七swagger-接口文档)
- [八、JWT 认证](#八jwt-认证)

---

# SpringBoot & SpringCloud 核心知识

---

## 一、SpringBoot 核心注解

### @RestController

```java
@RestController = @Controller + @ResponseBody
```
- 表示该类是一个 REST 风格的控制器
- 所有方法的返回值都会直接写入 HTTP 响应体中，而不会解析为视图路径

---

## 二、配置管理

### YAML 语法

YAML 数据格式是 JSON 的超集，非常适合配置文件。

**YAML 数组写法：**
```yaml
pets:
  - dog
  - cat
  - pig
```

对应传统 properties 写法：
```properties
pets[0]=dog
pets[1]=cat
pets[2]=pig
```

**注意**：如果 properties 和 yml 配置文件同时存在于 SpringBoot 项目中，**两类配置文件都会生效**。

### @Value 与 @ConfigurationProperties

| 特性 | @ConfigurationProperties | @Value |
|------|-------------------------|------|
| 功能 | 批量绑定配置文件中的属性 | 单个指定属性 |
| SpEL 表达式 | ❌ | ✅ |
| 松散绑定（relaxed binding） | ✅ | ❌ |
| JSR303 数据校验 | ✅ | ❌ |
| 复杂类型（Map、List、对象） | ✅ | ❌ |

### @PropertySource 加载指定配置文件

```java
@PropertySource(value = "classpath:person.properties")
@Component
@ConfigurationProperties(prefix = "person")
public class Person {
    private String lastName;
    private Integer age;
    private Boolean boss;
    private Date birth;
    private Map<String, Object> maps;
    private List<Object> lists;
    private Dog dog;

    // getters and setters...
}
```

配置文件 `person.properties` 内容：
```properties
person.last-name=李四
person.age=12
person.birth=2000/12/15
person.boss=false
person.maps.k1=v1
person.maps.k2=14
person.lists=a,b,c
person.dog.name=dog
person.dog.age=2
```

### 多环境配置

**Properties 方式：**
```properties
spring.profiles.active=dev
```

**YAML 方式（推荐）：**
```yaml
server:
  port: 8080
spring:
  profiles:
    active: dev
---
server:
  port: 8081
spring:
  profiles: dev
---
server:
  port: 8082
spring:
  profiles: test
```

通过 `spring.profiles.active` 切换激活的环境配置。

---

## 三、Spring 配置

### @ImportResource 导入 XML 配置

```java
@ImportResource(locations = {"classpath:/beans.xml"})
```
将 Spring 传统的 beans.xml 配置文件加载到项目中。

### 全注解方式 @Configuration + @Bean

使用 `@Configuration` 注解定义配置类，完全替换 XML 配置文件。

```java
/**
 * @Configuration 注解用于定义一个配置类，相当于 Spring 的配置文件
 * 配置类中包含一个或多个被 @Bean 注解的方法，该方法相当于配置文件中的 <bean> 标签
 */
@Configuration
public class MyAppConfig {
    /**
     * 与 <bean id="personService" class="PersonServiceImpl"></bean> 等价
     * 该方法返回值以组件的形式添加到容器中
     * 方法名是组件 id（相当于 <bean> 标签的 id 属性)
     */
    @Bean
    public PersonService personService() {
        System.out.println("在容器中添加了一个组件:peronService");
        return new PersonServiceImpl();
    }
}
```

**测试代码：**
```java
@SpringBootTest
class HelloworldApplicationTests {
    @Autowired
    Person person;
    
    // IOC 容器
    @Autowired
    ApplicationContext ioc;
    
    @Test
    public void testHelloService() {
        // 校验 IOC 容器中是否包含组件 personService
        boolean b = ioc.containsBean("personService");
        if (b) {
            System.out.println("personService 已经添加到 IOC 容器中");
        } else {
            System.out.println("personService 没添加到 IOC 容器中");
        }
    }
    
    @Test
    void contextLoads() {
        System.out.println(person);
    }
}
```

---

## 四、HTTP 请求与 RESTful

### @RestController

见上面 [一、SpringBoot 核心注解](#一springboot-核心注解)

### RESTful 风格注解

| 注解 | 描述 | 传统写法 |
|------|------|---------|
| @GetMapping | 处理 GET 请求 | @RequestMapping(method = RequestMethod.GET) |
| @PostMapping | 处理 POST 请求 | @RequestMapping(method = RequestMethod.POST) |
| @PutMapping | 处理 PUT 请求（完整更新） | @RequestMapping(method = RequestMethod.PUT) |
| @PatchMapping | 处理 PATCH 请求（部分更新） | @RequestMapping(method = RequestMethod.PATCH) |
| @DeleteMapping | 处理 DELETE 请求 | @RequestMapping(method = RequestMethod.DELETE) |

```java
@GetMapping("/get/{id}")
public User getUser(@PathVariable Long id) { ... }

@PostMapping("/add")
public User addUser(@RequestBody User user) { ... }

@PutMapping("/update/{id}")
public User updateUser(@PathVariable Long id, @RequestBody User user) { ... }

@PatchMapping("/update/{id}/status")
public User updateStatus(@PathVariable Long id, @RequestParam Integer status) { ... }

@DeleteMapping("/delete/{id}")
public void deleteUser(@PathVariable Long id) { ... }
```

### GET 与 POST 的区别

| 特性 | GET | POST |
|------|-----|------|
| 参数位置 | 请求路径后面（Query String） | 请求体中（Request Body） |
| 参数数量 | 有限（大约 2K） | 可传输大量数据 |
| 安全性 | 不安全（参数可见于地址栏） | 相对安全 |
| 中文编码 | 默认 ISO-8859-1，易乱码 | 可指定编码 |
| 浏览器缓存 | 默认会被缓存 | 不缓存（除非特殊配置） |
| 浏览器历史 | 保存在历史记录中 | 不保存 |
| 书签 | 可以收藏为书签 | 不行 |

---

## 五、集合迭代 - Iterator

Iterator 用于遍历 Collection 集合（List、Set），支持在遍历过程中删除元素。

```java
List<String> list = new ArrayList<>();
list.add("one");
list.add("two");
list.add("three");

Iterator<String> iterator = list.iterator();
while (iterator.hasNext()) {
    String element = iterator.next();
    System.out.println(element);
    // 安全删除当前元素
    iterator.remove();
}
```

Iterator 和 Iterable 的关系：实现了 Iterable 接口的类可以使用增强 for 循环（foreach）。

---

## 六、Kafka 基础

### Kafka 是什么

Kafka 是一个 **分布式流式平台**，具备以下三个核心能力：

1. **订阅发布** - 订阅和发布记录流，类似消息队列或企业消息系统
2. **容错存储** - 以容错的持久化方式存储记录流
3. **实时处理** - 实时处理记录流

### 四个核心 API

| API | 说明 |
|------|------|
| Producer API | 允许应用程序向一个或多个 topic 发送消息 |
| Consumer API | 允许应用程序订阅并处理 topic 中的消息流 |
| Streams API | 允许应用程序作为流处理器，处理输入流并输出到目标 topic |
| Connector API | 允许构建和运行连接器，连接 Kafka 和现有系统（如数据库） |

### 底层架构

Kafka 底层使用 **Zookeeper** 存储集群元数据。

---

## 七、Swagger 接口文档

Swagger 是用于自动生成 API 文档的工具，核心配置对象是 **Docket**。

```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {
    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.example"))
                .paths(PathSelectors.any())
                .build();
    }
    
    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("项目 RESTful API 文档")
                .description("简单优雅的 RESTful 文档风格")
                .contact(new Contact("作者名", "url", "email"))
                .version("1.0")
                .build();
    }
}
```

访问地址：`http://localhost:端口/swagger-ui.html`

---

## 八、JWT 认证

### JWT 结构

JWT 由三部分组成，中间用 `.` 分隔：

```
Header.Payload.Signature
```

#### 1. Header（头部）

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```
- `alg`: 使用的签名算法，常用 HMAC SHA256 或 RSA
- `typ`: token 类型，JWT

**最终**：经过 Base64Url 编码后的字符串 → JWT 第一部分

#### 2. Payload（载荷）

包含声明（Claims），分为三类：

| 声明类型 | 说明 |
|---------|-----|
| Reserved Claims（保留声明） | 预定义的声明：`iss(issuer)`、`exp(expiration time)`、`sub(subject)`、`aud(audience)` 等 |
| Public Claims（公共声明） | 可自定义，建议遵循规范 |
| Private Claims（私有声明） | 供需双方自定义的声明 |

示例：
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
}
```

**最终**：经过 Base64Url 编码 → JWT 第二部分

#### 3. Signature（签名）

签名用于验证消息没有被篡改，并确认发送者身份。

生成流程：
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

签名 = 使用 Header 里的算法，对 `编码后的Header.编码后的Payload` 加上密钥进行加密

---

## 面试高频问题回顾

1. **SpringBoot 如何处理配置文件？**
2. **YAML 和 Properties 的区别？**
3. **@ConfigurationProperties 和 @Value 对比？**
4. **GET 和 POST 的区别？**
5. **JWT 由哪几部分组成？每部分的作用？**
6. **Kafka 核心组件和 API？**

---
