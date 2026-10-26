---
title: SpringMVC
date: 2024/08/01 20:46:25
article_id: 2e0825b6-318a-5cb6-89a1-e3a7dc308ea9
categories:
- Java
tags:
- Java
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-20.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-20.webp

---

# SpringMVC

## 目录

- [1. MVC设计模式](#1-mvc设计模式)
- [2. SpringMVC执行流程](#2-springmvc执行流程)
- [3. 常用注解](#3-常用注解)
  - [@RequestMapping](#requestmapping)
  - [@RequestParam](#requestparam)
  - [@PathVariable](#pathvariable)
  - [@RequestBody](#requestbody)
  - [@ResponseBody](#responsebody)
  - [@Controller vs @RestController](#controller-vs-restcontroller)
- [4. 请求转发与重定向](#4-请求转发与重定向)
  - [通过Servlet API实现](#通过servlet-api实现)
  - [通过SpringMVC实现（无视图解析器）](#通过springmvc实现无视图解析器)
  - [通过SpringMVC实现（有视图解析器）](#通过springmvc实现有视图解析器)
- [5. 数据显示到前端](#5-数据显示到前端)
  - [第一种：通过ModelAndView](#第一种通过modelandview)
  - [第二种：通过ModelMap](#第二种通过modelmap)
  - [第三种：通过Model](#第三种通过model)
  - [三者区别](#三者区别)
- [6. 拦截器](#6-拦截器)
  - [Filter与Interceptor的区别](#filter与interceptor的区别)
- [7. 全局异常处理](#7-全局异常处理)
  - [@ControllerAdvice + @ExceptionHandler](#controlleradvice--exceptionhandler)
- [8. 常见问题](#8-常见问题)
  - [获取项目名](#获取项目名)
  - [DispatcherServlet屏蔽了html页面的访问](#dispatcherservlet屏蔽了html页面的访问)
  - [中文乱码问题](#中文乱码问题)

---

## 1. MVC设计模式

MVC是一种设计规范，主要作用是**降低了视图与业务逻辑间的双向耦合**。

- **Model（模型）**：数据模型，提供要展示的数据，因此包含数据和行为，可以认为是领域模型或JavaBean组件（包含数据和行为），不过现在一般都分离开来：Value Object（数据Dao）和服务层（行为Service）。也就是模型提供了模型数据查询和模型数据的状态更新等功能，包括数据和业务。
- **View（视图）**：负责进行模型的展示，一般就是我们见到的用户界面，客户想看到的东西。
- **Controller（控制器）**：接收用户请求，委托给模型进行处理（状态改变），处理完毕后把返回的模型数据返回给视图，由视图负责展示。也就是说控制器做了个调度员的工作。

最典型的MVC就是JSP + Servlet + JavaBean的模式。

## 2. SpringMVC执行流程

1. 用户发送请求到**DispatcherServlet**（前端控制器）
2. DispatcherServlet调用**HandlerMapping**（处理器映射器）根据URL找到对应的Handler
3. HandlerMapping返回HandlerExecutionChain（包含Handler和拦截器链）
4. DispatcherServlet调用**HandlerAdapter**（处理器适配器）执行Handler
5. HandlerAdapter执行Controller中的业务方法，返回**ModelAndView**
6. DispatcherServlet将ModelAndView传给**ViewResolver**（视图解析器）
7. ViewResolver解析后返回具体的**View**（视图）
8. DispatcherServlet对View进行渲染（将模型数据填充至视图中）
9. DispatcherServlet响应结果给用户

> 核心组件：DispatcherServlet、HandlerMapping、HandlerAdapter、ViewResolver

## 3. 常用注解

### @RequestMapping

映射访问路径，可指定请求方法：

```java
@RequestMapping(value = "/hello", method = {RequestMethod.GET})
public String index2(Model model){
    model.addAttribute("msg", "hello!");
    return "test";
}
```

衍生注解（简化写法）：

- `@GetMapping`：等价于 `@RequestMapping(method = RequestMethod.GET)`
- `@PostMapping`：等价于 `@RequestMapping(method = RequestMethod.POST)`
- `@PutMapping`、`@DeleteMapping`、`@PatchMapping`

### @RequestParam

绑定请求参数到方法参数：

```java
@GetMapping("/user")
public String getUser(@RequestParam("id") Long id,
                      @RequestParam(value = "name", required = false) String name) {
    // ...
}
```

### @PathVariable

获取路径中的变量：

```java
@GetMapping("/user/{id}")
public String getUser(@PathVariable("id") Long id) {
    // ...
}
```

### @RequestBody

获取请求体中的JSON数据，常用于POST请求：

```java
@PostMapping("/user")
public String addUser(@RequestBody User user) {
    // ...
}
```

### @ResponseBody

将方法返回值直接作为响应体返回，而不是解析为视图名：

```java
@GetMapping("/api/user")
@ResponseBody
public User getUser() {
    return new User("张三", 20);
}
```

`@RestController` = `@Controller` + `@ResponseBody`

### @Controller vs @RestController

- `@Controller`：返回视图名，需要配合视图解析器使用
- `@RestController`：返回JSON/XML数据，适用于RESTful API

## 4. 请求转发与重定向

### 通过Servlet API实现

```java
@Controller
public class ResultGo {

    // 直接输出
    @RequestMapping("/result/t1")
    public void test1(HttpServletRequest req, HttpServletResponse rsp) throws IOException {
        rsp.getWriter().println("Hello,Spring BY servlet API");
    }

    // 重定向
    @RequestMapping("/result/t2")
    public void test2(HttpServletRequest req, HttpServletResponse rsp) throws IOException {
        rsp.sendRedirect("/index.jsp");
    }

    // 请求转发
    @RequestMapping("/result/t3")
    public void test3(HttpServletRequest req, HttpServletResponse rsp) throws Exception {
        req.setAttribute("msg", "/result/t3");
        req.getRequestDispatcher("/WEB-INF/jsp/test.jsp").forward(req, rsp);
    }
}
```

### 通过SpringMVC实现（无视图解析器）

```java
@Controller
public class ResultSpringMVC {
    @RequestMapping("/rsm/t1")
    public String test1(){
        // 转发
        return "/index.jsp";
    }

    @RequestMapping("/rsm/t2")
    public String test2(){
        // 转发二
        return "forward:/index.jsp";
    }

    @RequestMapping("/rsm/t3")
    public String test3(){
        // 重定向
        return "redirect:/index.jsp";
    }
}
```

### 通过SpringMVC实现（有视图解析器）

```java
@Controller
public class ResultSpringMVC2 {
    @RequestMapping("/rsm2/t1")
    public String test1(){
        // 转发（视图解析器会拼接前缀后缀）
        return "test";
    }

    @RequestMapping("/rsm2/t2")
    public String test2(){
        // 重定向，不需要视图解析器，本质就是重新请求一个新地方
        return "redirect:/index.jsp";
        // return "redirect:hello.do"; // hello.do为另一个请求
    }
}
```

> 转发（forward）是服务器内部跳转，地址栏不变；重定向（redirect）是客户端重新发起请求，地址栏改变。

## 5. 数据显示到前端

### 第一种：通过ModelAndView

```java
public class ControllerTest1 implements Controller {

    public ModelAndView handleRequest(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws Exception {
        // 返回一个模型视图对象
        ModelAndView mv = new ModelAndView();
        mv.addObject("msg", "ControllerTest1");
        mv.setViewName("test");
        return mv;
    }
}
```

### 第二种：通过ModelMap

```java
@RequestMapping("/hello")
public String hello(@RequestParam("username") String name, ModelMap model){
    // 封装要显示到视图中的数据
    // 相当于req.setAttribute("name", name);
    model.addAttribute("name", name);
    return "hello";
}
```

### 第三种：通过Model

```java
@RequestMapping("/ct2/hello")
public String hello(@RequestParam("username") String name, Model model){
    // 封装要显示到视图中的数据
    model.addAttribute("msg", name);
    return "test";
}
```

### 三者区别

| 方式 | 说明 |
|------|------|
| Model | 只有寥寥几个方法，适合存储数据 |
| ModelMap | 继承了LinkedHashMap，拥有Map的所有方法 |
| ModelAndView | 可以存储数据，也可以设置视图名，功能最全 |

## 6. 拦截器

SpringMVC的拦截器（HandlerInterceptor）类似于Servlet中的Filter，用于对处理器进行预处理和后处理。

```java
public class MyInterceptor implements HandlerInterceptor {

    // 在请求处理之前执行（预处理），返回true放行，返回false拦截
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        System.out.println("预处理...");
        return true;
    }

    // 在请求处理之后，视图渲染之前执行（后处理）
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        System.out.println("后处理...");
    }

    // 在视图渲染之后执行（清理工作）
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        System.out.println("清理...");
    }
}
```

拦截器配置：

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new MyInterceptor())
                .addPathPatterns("/**")          // 拦截所有路径
                .excludePathPatterns("/login");   // 排除login路径
    }
}
```

### Filter与Interceptor的区别

| 对比项 | Filter | Interceptor |
|--------|--------|-------------|
| 规范 | Servlet规范 | SpringMVC规范 |
| 作用范围 | 所有请求 | 只拦截Controller请求 |
| 执行时机 | 在DispatcherServlet前后 | 在Handler前后 |
| 获取Bean | 不能直接获取Spring Bean | 可以直接获取Spring Bean |

## 7. 全局异常处理

### @ControllerAdvice + @ExceptionHandler

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ArithmeticException.class)
    public String handleArithmeticException(Exception e, Model model) {
        model.addAttribute("error", e.getMessage());
        return "error";
    }

    @ExceptionHandler(Exception.class)
    @ResponseBody
    public Map<String, Object> handleException(Exception e) {
        Map<String, Object> map = new HashMap<>();
        map.put("code", 500);
        map.put("msg", e.getMessage());
        return map;
    }
}
```

## 8. 常见问题

### 获取项目名

```jsp
${pageContext.request.contextPath}
```

### DispatcherServlet屏蔽了html页面的访问

默认配置下DispatcherServlet会拦截所有请求，包括静态资源。需要在web.xml中添加：

```xml
<servlet-mapping>
    <servlet-name>default</servlet-name>
    <url-pattern>*.html</url-pattern>
</servlet-mapping>
```

或在SpringMVC配置中添加：

```xml
<mvc:default-servlet-handler/>
```

### 中文乱码问题

在web.xml中配置字符编码过滤器：

```xml
<filter>
    <filter-name>encodingFilter</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
    <init-param>
        <param-name>encoding</param-name>
        <param-value>UTF-8</param-value>
    </init-param>
</filter>
<filter-mapping>
    <filter-name>encodingFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

**请使用80%的时间打好扎实的基础，剩下18%的时间研究框架，2%的时间去学点英文，框架的官方文档永远是最好的教程。**
