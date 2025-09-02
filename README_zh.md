中文 | [English](./README.md)

# 资源保存脚本

一个用于本地开发的 Node.js 工具，启动本地服务器的同时自动抓取缺失的远程资源文件。

## 目录

- [安装](#安装)
- [使用](#使用)
- [工作原理](#工作原理)
- [使用场景示例](#使用场景示例)
- [适用场景](#适用场景)

## 安装

```bash
npm install -g resource-save-script
```

## 使用

安装完成后，在终端中使用 `h` 命令启动：

```bash
# 指定端口号
h 8080

# 使用默认端口 4000
h
```

启动时会提示输入远程服务器地址：

```text
→ 请输入资源所在的根 URL: https://your-remote-server.com
```

## 工作原理

脚本会监听本地服务器的 404 请求，当检测到缺失文件时自动从指定的远程服务器下载到本地。

## 使用场景示例

假设你想在本地调试 `luckfunc.com` 的页面：

**1. 创建并进入项目目录**
```bash
mkdir my-project
cd my-project
```

**2. 下载主页面**
```bash
curl -o index.html https://luckfunc.com/
```

**3. 在项目目录下启动脚本**
```bash
h
# 输入: https://luckfunc.com/
```

**3. 访问页面**

打开浏览器访问 `http://127.0.0.1:4000/index.html`

当页面加载时，如果引用了本地不存在的 `i18n.js` 等文件，脚本会自动从 `luckfunc.com` 下载这些文件到本地目录。

终端会显示下载进度：
```text
检测到缺失文件: /i18n.js
下载完成: /path/to/your/project/i18n.js (1234 bytes)
```

再次刷新页面，所有资源都能正常加载了。

## 适用场景

- 本地调试线上页面
- 离线开发环境搭建
- 静态资源批量下载
