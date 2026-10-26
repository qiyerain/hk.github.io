---
title: Java Stream流与函数式编程
date: 2024/08/01 20:46:25
article_id: 8fc6e0e8-e96b-5c9b-a9af-66f32ff0b549
categories:
- Java
- 函数式编程
tags:
- Java
- Stream
- Lambda
- 函数式编程
cover: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-22.webp
top_img: https://pfa-oss-example.oss-cn-hangzhou.aliyuncs.com/blog/dedup-22.webp

---

# Webflow

## 目录

- [函数式编程与Stream流概述](#函数式编程与stream流概述)
  - [1.1 为什么使用Stream流](#11-为什么使用stream流)
  - [1.2 函数式编程思想](#12-函数式编程思想)
- [Lambda表达式](#lambda表达式)
  - [2.1 基本格式](#21-基本格式)
  - [2.2 Lambda简化规则](#22-lambda简化规则)
- [Stream流详解](#stream流详解)
  - [3.1 Stream操作流程图](#31-stream操作流程图)
  - [3.2 流的特性](#32-流的特性)
  - [3.3 创建流的方式](#33-创建流的方式)
  - [3.4 常用中间操作](#34-常用中间操作)
    - [filter - 过滤](#filter---过滤)
    - [map - 映射转换](#map---映射转换)
    - [flatMap - 扁平化映射](#flatmap---扁平化映射)
    - [distinct - 去重](#distinct---去重)
    - [sorted - 排序](#sorted---排序)
    - [limit & skip - 限制与跳过](#limit--skip---限制与跳过)
  - [3.5 常用终结操作](#35-常用终结操作)
    - [forEach - 遍历](#foreach---遍历)
    - [collect - 收集](#collect---收集)
    - [count - 计数](#count---计数)
    - [max & min - 最大最小值](#max--min---最大最小值)
    - [匹配与查找](#匹配与查找)
    - [reduce - 归约](#reduce---归约)
- [Optional类](#optional类)
  - [4.1 为什么需要Optional](#41-为什么需要optional)
  - [4.2 Optional的创建](#42-optional的创建)
  - [4.3 Optional常用方法](#43-optional常用方法)
- [函数式接口](#函数式接口)
  - [5.1 四大核心函数式接口](#51-四大核心函数式接口)
  - [5.2 代码示例](#52-代码示例)
    - [Consumer - 消费型接口](#consumer---消费型接口)
    - [Supplier - 供给型接口](#supplier---供给型接口)
    - [Function - 函数型接口](#function---函数型接口)
    - [Predicate - 断言型接口](#predicate---断言型接口)
  - [5.3 其他常用函数式接口](#53-其他常用函数式接口)
- [方法引用](#方法引用)
  - [6.1 方法引用的四种形式](#61-方法引用的四种形式)
  - [6.2 代码示例](#62-代码示例)
- [Stream高级用法](#stream高级用法)
  - [7.1 基本类型优化](#71-基本类型优化)
  - [7.2 并行流](#72-并行流)
  - [7.3 高级收集操作](#73-高级收集操作)
- [实际案例](#实际案例)
  - [8.1 数据统计报表](#81-数据统计报表)
  - [8.2 集合操作实战](#82-集合操作实战)
- [常见问题与面试题](#常见问题与面试题)
  - [9.1 常见误区](#91-常见误区)
  - [9.2 面试题精选](#92-面试题精选)
- [附录：完整的实体类参考](#附录完整的实体类参考)

---

## 函数式编程与Stream流概述

### 1.1 为什么使用Stream流

**传统方式 vs Stream方式对比**

```java
// 示例：查询未成年作家评分在70分以上的书籍，并去重
// 传统写法
@Test
public void testTraditional() {
    List<Book> bookList = new ArrayList<>();
    List<Author> authorList = getAuthors();
    Set<Book> uniqueBookValues = new HashSet<>();
    Set<Author> uniqueAuthorValues = new HashSet<>();
    
    for (Author author : authorList) {
        if (uniqueAuthorValues.add(author)) {
            if (author.getAge() < 18) {
                List<Book> books = author.getBookList();
                for (Book book : books) {
                    if (book.getScore() > 70D) {
                        if (uniqueBookValues.add(book)) {
                            bookList.add(book);
                        }
                    }
                }
            }
        }
    }
    System.out.println(bookList);
}

// Stream写法
@Test
public void testStream() {
    List<Author> authorList = getAuthors();
    List<Book> collect = authorList.stream()
            .distinct()
            .filter(author -> author.getAge() < 18)
            .map(Author::getBookList)
            .flatMap(Collection::stream)
            .filter(book -> book.getScore() > 70)
            .distinct()
            .collect(Collectors.toList());
    System.out.println(collect);
}
```

**Stream流的优势**：
- 代码更简洁，可读性更强
- 避免嵌套过深
- 声明式编程，关注"做什么"而非"怎么做"
- 便于并行处理
- 不影响原数据

---

### 1.2 函数式编程思想

| 特点 | 说明 |
|------|------|
| 函数是一等公民 | 函数可以作为参数传递、作为返回值 |
| 声明式 | 关注做什么，而不是怎么做 |
| 无副作用 | 不修改外部状态 |
| 惰性求值 | 只在需要时才计算 |

---

## Lambda表达式

### 2.1 基本格式

```java
(参数列表) -> {代码}
```

**示例**：
```java
// 传统匿名内部类
new Thread(new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
}).start();

// Lambda写法
new Thread(() -> System.out.println("Hello")).start();
```

### 2.2 Lambda简化规则

```java
// 1. 参数类型可以省略
Comparator<Integer> comparator = (o1, o2) -> o1 - o2;

// 2. 只有一个参数时，括号可以省略
Consumer<String> consumer = s -> System.out.println(s);

// 3. 方法体只有一行时，大括号、return和分号可以省略
Comparator<Integer> comparator = (o1, o2) -> o1 - o2;
```

---

## Stream流详解

### 3.1 Stream操作流程图

```
┌─────────────┐
│   源数据    │
│ (集合/数组) │
└──────┬──────┘
       │
       ▼
┌───────────────────────────────────────┐
│        创建流                           │
│  stream() / parallelStream()           │
└──────┬────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│      中间操作 (0个或多个)              │
│  filter / map / flatMap / distinct    │
│  sorted / limit / skip                │
│  (返回新Stream，惰性求值)              │
└──────┬────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│       终结操作 (1个)                   │
│  forEach / collect / count / max      │
│  min / reduce / anyMatch / allMatch   │
│  (触发计算，流关闭)                    │
└───────────────────────────────────────┘
```

### 3.2 流的特性

1. **不存储元素**：通过计算操作流水线传递元素
2. **不修改源**：产生新的流，不改变原集合
3. **惰性求值**：只有遇到终结操作才执行
4. **一次性使用**：流经过终结操作后不能再次使用

---

### 3.3 创建流的方式

```java
// 1. 集合创建流
List<String> list = Arrays.asList("a", "b", "c");
Stream<String> stream = list.stream();

// 2. 数组创建流
String[] array = {"a", "b", "c"};
Stream<String> stream2 = Arrays.stream(array);

// 3. Stream.of()
Stream<String> stream3 = Stream.of("a", "b", "c");

// 4. 无限流
Stream<Integer> infinite = Stream.iterate(0, x -> x + 2); // 偶数流
Stream<Double> randoms = Stream.generate(Math::random); // 随机数

// 5. 并行流
List<String> list = Arrays.asList("a", "b", "c");
Stream<String> parallelStream = list.parallelStream();
```

---

### 3.4 常用中间操作

#### filter - 过滤

```java
// 过滤年龄小于18的作家
authorList.stream()
        .filter(author -> author.getAge() < 18)
        .forEach(System.out::println);
```

#### map - 映射转换

```java
// 获取所有作家的姓名
List<String> names = authorList.stream()
        .map(Author::getName)
        .collect(Collectors.toList());

// 类型转换
List<Integer> lengths = authorList.stream()
        .map(Author::getName)
        .map(String::length)
        .collect(Collectors.toList());
```

#### flatMap - 扁平化映射

```java
// map - 得到的是流中流
Stream<List<Book>> stream = authorList.stream()
        .map(Author::getBookList);

// flatMap - 扁平化，得到单一的流
List<Book> allBooks = authorList.stream()
        .map(Author::getBookList)
        .flatMap(Collection::stream)
        .collect(Collectors.toList());
```

#### distinct - 去重

```java
// 依赖equals和hashCode方法
List<Author> uniqueAuthors = authorList.stream()
        .distinct()
        .collect(Collectors.toList());
```

#### sorted - 排序

```java
// 自然排序
List<Integer> sorted = Arrays.asList(3, 1, 4, 1, 5).stream()
        .sorted()
        .collect(Collectors.toList());

// 自定义排序
List<Author> sortedByAge = authorList.stream()
        .sorted((o1, o2) -> o1.getAge() - o2.getAge())
        .collect(Collectors.toList());

// 使用Comparator
List<Author> sortedByAgeDesc = authorList.stream()
        .sorted(Comparator.comparing(Author::getAge).reversed())
        .collect(Collectors.toList());
```

#### limit & skip - 限制与跳过

```java
// 取前3个
List<Author> first3 = authorList.stream()
        .limit(3)
        .collect(Collectors.toList());

// 跳过前2个，取后面的
List<Author> after2 = authorList.stream()
        .skip(2)
        .collect(Collectors.toList());

// 分页 - 第2页，每页3条
List<Author> page2 = authorList.stream()
        .skip(3)
        .limit(3)
        .collect(Collectors.toList());
```

---

### 3.5 常用终结操作

#### forEach - 遍历

```java
authorList.stream()
        .forEach(author -> System.out.println(author.getName()));

// 方法引用
authorList.stream()
        .forEach(System.out::println);
```

#### collect - 收集

```java
// 1. 收集为List
List<String> names = authorList.stream()
        .map(Author::getName)
        .collect(Collectors.toList());

// 2. 收集为Set
Set<String> nameSet = authorList.stream()
        .map(Author::getName)
        .collect(Collectors.toSet());

// 3. 收集为Map
Map<Long, Author> authorMap = authorList.stream()
        .collect(Collectors.toMap(Author::getId, author -> author));

// 4. 分组
Map<Integer, List<Author>> ageGroup = authorList.stream()
        .collect(Collectors.groupingBy(Author::getAge));

// 5. 字符串拼接
String allNames = authorList.stream()
        .map(Author::getName)
        .collect(Collectors.joining(", "));

// 6. 统计
Double avgAge = authorList.stream()
        .collect(Collectors.averagingInt(Author::getAge));

Long count = authorList.stream()
        .collect(Collectors.counting());

Integer sumAge = authorList.stream()
        .collect(Collectors.summingInt(Author::getAge));
```

#### count - 计数

```java
long count = authorList.stream()
        .filter(author -> author.getAge() > 18)
        .count();
```

#### max & min - 最大最小值

```java
// 年龄最大的作家
Optional<Author> maxAgeAuthor = authorList.stream()
        .max(Comparator.comparingInt(Author::getAge));

// 年龄最小的作家
Optional<Author> minAgeAuthor = authorList.stream()
        .min(Comparator.comparingInt(Author::getAge));
```

#### 匹配与查找

```java
// 是否有任一匹配
boolean hasYoung = authorList.stream()
        .anyMatch(author -> author.getAge() < 18);

// 是否全部匹配
boolean allOld = authorList.stream()
        .allMatch(author -> author.getAge() >= 18);

// 是否都不匹配
boolean noneYoung = authorList.stream()
        .noneMatch(author -> author.getAge() < 18);

// 查找任意一个
Optional<Author> anyAuthor = authorList.stream()
        .findAny();

// 查找第一个
Optional<Author> firstAuthor = authorList.stream()
        .findFirst();
```

#### reduce - 归约

```java
// 求和
Integer sumAge = authorList.stream()
        .map(Author::getAge)
        .reduce(0, (a, b) -> a + b);

// 求最大值
Optional<Integer> maxAge = authorList.stream()
        .map(Author::getAge)
        .reduce(Integer::max);

// 拼接字符串
String allNames = authorList.stream()
        .map(Author::getName)
        .reduce("", (a, b) -> a + " " + b);
```

---

## Optional类

### 4.1 为什么需要Optional

```java
// 传统写法 - 层层判空
String name = null;
if (author != null) {
    if (author.getBook() != null) {
        if (author.getBook().getName() != null) {
            name = author.getBook().getName().toUpperCase();
        }
    }
}

// Optional写法
String name = Optional.ofNullable(author)
        .map(Author::getBook)
        .map(Book::getName)
        .map(String::toUpperCase)
        .orElse("未知");
```

### 4.2 Optional的创建

```java
// 1. of() - 不能为null
Optional<Author> author = Optional.of(getAuthor());

// 2. ofNullable() - 可以为null（推荐）
Optional<Author> author = Optional.ofNullable(getAuthor());

// 3. empty() - 空Optional
Optional<Author> empty = Optional.empty();
```

### 4.3 Optional常用方法

```java
// 1. ifPresent - 存在才执行
Optional.ofNullable(author)
        .ifPresent(a -> System.out.println(a.getName()));

// 2. orElse - 获取值，为空返回默认值
String name = Optional.ofNullable(author)
        .map(Author::getName)
        .orElse("未知");

// 3. orElseGet - 获取值，为空由函数生成
String name = Optional.ofNullable(author)
        .map(Author::getName)
        .orElseGet(() -> "默认值");

// 4. orElseThrow - 获取值，为空抛出异常
String name = Optional.ofNullable(author)
        .map(Author::getName)
        .orElseThrow(() -> new RuntimeException("作者不存在"));

// 5. filter - 过滤
Optional<Author> youngAuthor = Optional.ofNullable(author)
        .filter(a -> a.getAge() < 18);

// 6. isPresent - 判断是否有值（不推荐，用ifPresent）
if (Optional.ofNullable(author).isPresent()) {
    System.out.println("存在");
}

// 7. map - 转换
Optional<String> authorName = Optional.ofNullable(author)
        .map(Author::getName);
```

---

## 函数式接口

### 5.1 四大核心函数式接口

| 接口名 | 方法 | 说明 |
|--------|------|------|
| `Consumer<T>` | `void accept(T t)` | 消费型，有入参无返回 |
| `Supplier<T>` | `T get()` | 供给型，无入参有返回 |
| `Function<T,R>` | `R apply(T t)` | 函数型，有入参有返回 |
| `Predicate<T>` | `boolean test(T t)` | 断言型，有入参返回boolean |

### 5.2 代码示例

#### Consumer - 消费型接口

```java
// 打印字符串
Consumer<String> printer = s -> System.out.println(s);
printer.accept("Hello");

// 方法引用
Consumer<String> printer2 = System.out::println;

// andThen - 组合
Consumer<String> c1 = s -> System.out.println("1: " + s);
Consumer<String> c2 = s -> System.out.println("2: " + s);
c1.andThen(c2).accept("Hello");
```

#### Supplier - 供给型接口

```java
// 获取随机数
Supplier<Double> randomSupplier = () -> Math.random();
System.out.println(randomSupplier.get());

// 创建对象
Supplier<Author> authorSupplier = () -> new Author();
Author author = authorSupplier.get();
```

#### Function - 函数型接口

```java
// 字符串转长度
Function<String, Integer> lengthFunc = String::length;
Integer len = lengthFunc.apply("Hello");

// compose / andThen 组合
Function<Integer, Integer> multiply = x -> x * 2;
Function<Integer, Integer> add = x -> x + 3;

// 先乘再加
System.out.println(multiply.andThen(add).apply(5)); // 13

// 先加再乘
System.out.println(multiply.compose(add).apply(5)); // 16
```

#### Predicate - 断言型接口

```java
// 判断大于0
Predicate<Integer> positive = x -> x > 0;
System.out.println(positive.test(10)); // true

// and / or / negate 组合
Predicate<Integer> gt10 = x -> x > 10;
Predicate<Integer> lt20 = x -> x < 20;

// 大于10且小于20
Predicate<Integer> between = gt10.and(lt20);

// 大于10或小于20
Predicate<Integer> either = gt10.or(lt20);

// 取反
Predicate<Integer> notPositive = positive.negate();
```

### 5.3 其他常用函数式接口

```java
// BiFunction - 两个入参
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// UnaryOperator - 一元运算，入参和出参同类型
UnaryOperator<Integer> square = x -> x * x;

// BinaryOperator - 二元运算，两个入参和出参同类型
BinaryOperator<Integer> multiply = (a, b) -> a * b;
```

---

## 方法引用

### 6.1 方法引用的四种形式

| 形式 | 语法 | 示例 |
|------|------|------|
| 静态方法引用 | `类名::静态方法` | `Integer::parseInt` |
| 实例方法引用 | `对象::实例方法` | `str::substring` |
| 类的实例方法引用 | `类名::实例方法` | `String::substring` |
| 构造方法引用 | `类名::new` | `ArrayList::new` |

### 6.2 代码示例

```java
// 1. 静态方法引用
Function<String, Integer> parser1 = s -> Integer.parseInt(s);
Function<String, Integer> parser2 = Integer::parseInt;

// 2. 实例方法引用
String str = "Hello";
Function<Integer, String> sub1 = index -> str.substring(index);
Function<Integer, String> sub2 = str::substring;

// 3. 类的实例方法引用
Function<String, Integer> len1 = s -> s.length();
Function<String, Integer> len2 = String::length;

// 4. 构造方法引用
Supplier<List<String>> listSup1 = () -> new ArrayList<>();
Supplier<List<String>> listSup2 = ArrayList::new;

Function<String, Author> authorFunc1 = name -> new Author(name);
Function<String, Author> authorFunc2 = Author::new;
```

---

## Stream高级用法

### 7.1 基本类型优化

```java
// mapToInt - 避免自动装箱拆箱
int sumAge = authorList.stream()
        .mapToInt(Author::getAge)
        .sum();

// 其他方法
IntStream intStream = authorList.stream().mapToInt(Author::getAge);
LongStream longStream = authorList.stream().mapToLong(Author::getId);
DoubleStream doubleStream = bookList.stream().mapToDouble(Book::getScore);

// 基本类型流的统计
IntSummaryStatistics stats = authorList.stream()
        .mapToInt(Author::getAge)
        .summaryStatistics();
System.out.println("最大值: " + stats.getMax());
System.out.println("最小值: " + stats.getMin());
System.out.println("平均值: " + stats.getAverage());
System.out.println("总和: " + stats.getSum());
System.out.println("数量: " + stats.getCount());
```

### 7.2 并行流

```java
// 使用并行流
long count = authorList.parallelStream()
        .filter(author -> author.getAge() > 18)
        .count();

// 普通流转并行流
long count2 = authorList.stream()
        .parallel()
        .filter(author -> author.getAge() > 18)
        .count();

// 并行流转顺序流
long count3 = authorList.parallelStream()
        .sequential()
        .filter(author -> author.getAge() > 18)
        .count();
```

**注意事项**：
- 数据量较大时才有收益
- 操作需要是无状态的
- 集合需要是高效可分解的（ArrayList优于LinkedList）
- 避免在并行流中使用非线程安全的集合

### 7.3 高级收集操作

```java
// 1. 分组后统计
Map<Integer, Long> ageCountMap = authorList.stream()
        .collect(Collectors.groupingBy(
                Author::getAge,
                Collectors.counting()
        ));

// 2. 分组后求和
Map<Integer, Double> scoreSumByAge = authorList.stream()
        .collect(Collectors.groupingBy(
                Author::getAge,
                Collectors.summingDouble(
                        author -> author.getBookList().stream()
                                .mapToDouble(Book::getScore)
                                .sum()
                )
        ));

// 3. 分区
Map<Boolean, List<Author>> partition = authorList.stream()
        .collect(Collectors.partitioningBy(author -> author.getAge() >= 18));

// 4. 多级分组
Map<Integer, Map<String, List<Author>>> multiLevelGroup = authorList.stream()
        .collect(Collectors.groupingBy(
                Author::getAge,
                Collectors.groupingBy(Author::getGender)
        ));
```

---

## 实际案例

### 8.1 数据统计报表

```java
/**
 * 书店销售统计
 */
public class BookStoreStats {
    
    // 按作者统计销量
    public Map<String, Integer> getSalesByAuthor(List<Order> orders) {
        return orders.stream()
                .flatMap(order -> order.getItems().stream())
                .collect(Collectors.groupingBy(
                        OrderItem::getAuthorName,
                        Collectors.summingInt(OrderItem::getQuantity)
                ));
    }
    
    // 计算总销售额
    public Double getTotalRevenue(List<Order> orders) {
        return orders.stream()
                .flatMap(order -> order.getItems().stream())
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
    }
    
    // 获取销量前N的书籍
    public List<Book> getTopNSellingBooks(List<Order> orders, int n) {
        return orders.stream()
                .flatMap(order -> order.getItems().stream())
                .collect(Collectors.groupingBy(
                        OrderItem::getBook,
                        Collectors.summingInt(OrderItem::getQuantity)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<Book, Integer>comparingByValue().reversed())
                .limit(n)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}
```

### 8.2 集合操作实战

```java
/**
 * 数据处理工具类
 */
public class DataProcessor {
    
    // 查找重复元素
    public static <T> Set<T> findDuplicates(List<T> list) {
        Set<T> seen = new HashSet<>();
        return list.stream()
                .filter(item -> !seen.add(item))
                .collect(Collectors.toSet());
    }
    
    // 检查列表是否有重复
    public static <T> boolean hasDuplicates(List<T> list) {
        return list.stream()
                .distinct()
                .count() != list.size();
    }
    
    // 找到出现次数最多的元素
    public static <T> Optional<T> findMostFrequent(List<T> list) {
        return list.stream()
                .collect(Collectors.groupingBy(
                        Function.identity(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey);
    }
}
```

---

## 常见问题与面试题

### 9.1 常见误区

1. **修改流源数据**
```java
// 错误：在流操作中修改原集合
List<String> list = new ArrayList<>(Arrays.asList("a", "b", "c"));
list.stream().forEach(s -> list.remove(s)); // 可能出问题
```

2. **流重复使用**
```java
Stream<String> stream = Arrays.asList("a", "b").stream();
stream.forEach(System.out::println);
stream.forEach(System.out::println); // 报错！流已关闭
```

3. **过早使用收集**
```java
// 不好的做法：每次中间操作都收集
List<String> list = authorList.stream()
        .map(Author::getName)
        .collect(Collectors.toList()); // 不必要的收集

List<String> filtered = list.stream()
        .filter(name -> name.length() > 2)
        .collect(Collectors.toList());

// 好的做法：最后一次收集
List<String> result = authorList.stream()
        .map(Author::getName)
        .filter(name -> name.length() > 2)
        .collect(Collectors.toList());
```

### 9.2 面试题精选

**1. Stream流的操作分为哪几类？**
- 创建操作：创建流的方法
- 中间操作：不触发计算，返回新Stream
- 终结操作：触发计算，关闭流

**2. 什么是惰性求值？**
- 中间操作只记录操作，不执行
- 只有遇到终结操作才执行
- 好处：可以进行优化，如短路操作

**3. 并行流使用的线程池是哪个？**
- 使用ForkJoinPool.commonPool()
- 默认线程数是CPU核心数

**4. collect()和reduce()的区别？**
- collect：用于收集结果到容器，可变累加
- reduce：用于归约，不可变累加

**5. map()和flatMap()的区别？**
- map：一对一转换，T -> R
- flatMap：一对多转换，T -> Stream<R>，扁平化处理

---

## 附录：完整的实体类参考

```java
/**
 * 作者实体类
 */
class Author {
    private Long id;
    private String name;
    private Integer age;
    private String gender;
    private List<Book> bookList;

    // 构造器、getter、setter、equals、hashCode、toString
}

/**
 * 书籍实体类
 */
class Book {
    private Long id;
    private String name;
    private Double score;
    private String category;

    // 构造器、getter、setter、equals、hashCode、toString
}

/**
 * 订单实体类
 */
class Order {
    private Long id;
    private List<OrderItem> items;

    // getter、setter
}

/**
 * 订单项
 */
class OrderItem {
    private Book book;
    private String authorName;
    private Integer quantity;
    private Double price;

    // getter、setter
}
```

