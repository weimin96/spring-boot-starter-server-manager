
# Spring Boot Starter Server Manager

[![Java CI](https://github.com/weimin96/spring-boot-starter-server-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/weimin96/spring-boot-starter-server-manager/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/weimin96/spring-boot-starter-server-manager)](https://github.com/weimin96/spring-boot-starter-server-manager/releases/)
[![Maven Central Version](https://img.shields.io/maven-central/v/io.github.weimin96/spring-boot-starter-server-manager)](https://repo1.maven.org/maven2/io/github/weimin96/spring-boot-starter-server-manager/)
[![GitHub repo size](https://img.shields.io/github/repo-size/weimin96/spring-boot-starter-server-manager)](https://github.com/weimin96/spring-boot-starter-server-manager/releases/)
[![License](https://img.shields.io/:license-apache-brightgreen.svg)](https://www.apache.org/licenses/LICENSE-2.0.html)
[![Last Commit](https://img.shields.io/github/last-commit/weimin96/spring-boot-starter-server-manager.svg)](https://github.com/weimin96/spring-boot-starter-server-manager)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/weimin96/spring-boot-starter-server-manager.svg)](https://github.com/weimin96/spring-boot-starter-server-manager)

## 简介

基于springboot的分布式的服务监控管理组件

## 功能特性

- health : 显示应用程序运行状况信息(必须)；
- info：显示任意应用程序信息；
- env： 公开 Spring 的 ConfigurableEnvironment 中的属性；
- metrics： 显示当前应用程序的“指标”信息；
- httptrace： 显示 HTTP 跟踪信息（默认情况下，为最近 100 次 HTTP 请求-响应交换）。需要 HttpTraceRepository bean；
- threaddump：执行线程转储；
- heapdump: 返回堆转储文件。在 HotSpot JVM 上，返回 HPROF 格式文件。在 OpenJ9 JVM 上，返回 PHD 格式文件;
- jolokia：当 Jolokia 位于类路径上时，通过 HTTP 公开 JMX bean（不适用于 WebFlux）。需要依赖 jolokia-core ；
- logfile：返回日志文件的内容（如果已设置 logging.file.name 或 logging.file.path 属性）。支持使用 HTTP Range 标头来检索日志文件的部分内容；
- loggers: 显示和修改应用程序中记录器的配置;
- auditevents:公开当前应用程序的审核事件信息。需要 AuditEventRepository bean;
- mappings: 显示所有 @RequestMapping 路径的排序列表;
- scheduledtasks: 显示应用程序中的计划任务;
- configprops: 显示所有 @ConfigurationProperties 的排序列表;
- beans: 显示应用程序中所有 Spring Bean 的完整列表;
- caches: 公开可用的缓存;
- conditions: 显示在配置类和自动配置类上评估的条件，以及它们匹配或不匹配的原因
- sessions: 允许从 Spring Session 支持的会话存储中检索和删除用户会话。需要一个使用 Spring Session 的基于 servlet 的 Web 应用程序;
- quartz: 显示有关 Quartz Scheduler 作业的信息;
- shutdown: 允许正常关闭应用程序。仅在使用 jar 包装时有效。默认情况下处于禁用状态;
- startup: 显示 ApplicationStartup 收集的启动步骤数据。需要为 SpringApplication 配置 BufferingApplicationStartup
- logcontent: 日志内容
- logdir： 日志列表


