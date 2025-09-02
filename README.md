English | [中文](./README_zh.md)

# Resource Saving Script

A simple but powerful Node.js script that runs a local web server and automatically downloads missing resources.

### Global Installation

```bash
npm install -g resource-save-script
```

### Usage

Once installed, you can use the `h` command in your terminal.

```bash
# Run on a custom port (e.g., 8080)
h 8080

# Run on the default port (4000)
h
```

After running the command, the script will prompt you to enter the base URL of the remote server where the resources are located.

```text
→ Please enter the base URL for resources: https://your-remote-server.com
```
The local server will then start, and any missing files will be downloaded automatically.