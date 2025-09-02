中文 | [English](./README.md)

# 资源保存脚本

一个简单但功能强大的 Node.js 脚本，可以运行一个本地 Web 服务器并自动下载缺失的资源。

### 全局安装

```bash
npm install -g resource-save-script
```

### 使用方法

安装后，您可以在终端中使用 `h` 命令。

```bash
# 使用自定义端口 (例如 8080)
h 8080

# 使用默认端口 (4000)
h
```

运行命令后，脚本将提示您输入存放资源的远程服务器的基础 URL。

```text
→ 请输入资源所在的根 URL: https://your-remote-server.com
```
之后本地服务器将启动，并自动下载任何缺失的文件。