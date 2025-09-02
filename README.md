English | [中文](./README_zh.md)

# Resource Saving Script

A Node.js tool for local development that starts a local server while automatically fetching missing remote resource files.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Usage Example](#usage-example)
- [Use Cases](#use-cases)

## Installation

```bash
npm install -g resource-save-script
```

## Usage

Once installed, use the `h` command in your terminal:

```bash
# Run on a custom port
h 8080

# Run on the default port 4000
h
```

You'll be prompted to enter the remote server URL:

```text
→ Please enter the base URL for resources: https://your-remote-server.com
```

## How It Works

The script monitors 404 requests on the local server. When a missing file is detected, it automatically downloads the file from the specified remote server to your local directory.

## Usage Example

Let's say you want to debug a page from `luckfunc.com` locally:

**1. Create and enter project directory**
```bash
mkdir my-project
cd my-project
```

**2. Download the main page**
```bash
curl -o index.html https://luckfunc.com/
```

**3. Start the script in your project directory**
```bash
h
# Enter: https://luckfunc.com/
```

**4. Access the page**

Open your browser and visit `http://127.0.0.1:4000/index.html`

When the page loads, if it references local files like `i18n.js` that don't exist, the script will automatically download them from `luckfunc.com` to your local directory.

Terminal output will show download progress:
```text
Missing file detected: /i18n.js
Download complete: /path/to/your/project/i18n.js (1234 bytes)
```

Refresh the page and all resources will load properly.

## Use Cases

- Local debugging of live websites
- Setting up offline development environments
- Bulk downloading of static resources
