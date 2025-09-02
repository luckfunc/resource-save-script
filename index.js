#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const userInputReader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let port = parseInt(process.argv[2] || '4000', 10);
if (isNaN(port) || port < 1 || port > 65535) {
  console.error('端口号无效，使用默认端口 4000');
  port = 4000;
}

const promptArrow = '\x1b[38;2;0;200;255m\u2192\x1b[0m';
const promptLabel = '\x1b[37m';
const promptValue = '\x1b[38;2;0;255;255m';

console.log(`${promptArrow}${promptLabel}Local server running at: ${promptValue}http://127.0.0.1:${port}\x1b[0m`);

function streamDownload(url, filePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {});
        reject(new Error(`Request failed, status code: ${response.statusCode}`));
        return;
      }
      response.pipe(fileStream);
    });
    fileStream.on('finish', () => {
      fileStream.close(() => {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          fs.unlink(filePath, () => {});
          reject(new Error('Downloaded file is empty'));
        } else {
          resolve(stats.size);
        }
      });
    });
    request.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(new Error(`Request error: ${err.message}`));
    });
    fileStream.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(new Error(`File stream error: ${err.message}`));
    });
  });
}

async function downloadFileWithRetries(url, filePath, maxRetries = 3) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    console.log(`文件已存在，跳过下载: ${filePath}`);
    return;
  }
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileSize = await streamDownload(url, filePath);
      console.log(`下载完成: ${filePath} (${fileSize} bytes)`);
      return;
    } catch (error) {
      console.log(`第 ${attempt}/${maxRetries} 次尝试失败: ${filePath}: ${error.message}`);
      if (attempt === maxRetries) {
        console.error(`重试 ${maxRetries} 次后，下载失败: ${filePath}`);
      }
    }
  }
}

userInputReader.question(`${promptArrow}${promptLabel}请输入资源所在的根 URL: \x1b[0m`, (baseUrl) => {
  console.log(`${promptArrow}${promptLabel}根 URL 已设置为: ${promptValue}${baseUrl}\x1b[0m`);
  userInputReader.close();

  console.log('\n--------------------------------------------------------');
  console.log(`${promptArrow}${promptLabel}监控已启动。`);
  console.log(`${promptArrow}${promptLabel}下一步: 请用浏览器打开 ${promptValue}http://127.0.0.1:${port}${promptLabel}`);
  console.log(`${promptArrow}${promptLabel}脚本将会自动从 ${promptValue}${baseUrl}${promptLabel} 下载任何缺失的资源。`);
  console.log('--------------------------------------------------------\n');

  const httpServerProcess = exec(`http-server -p ${port}`);

  httpServerProcess.stdout.on('data', async (data) => {
    const output = data.toString();
    const missingFileRegex = /"GET (\/.*?)" Error \(404\):/g;
    const missingFileMatches = [...output.matchAll(missingFileRegex)];
    if (missingFileMatches.length > 0) {
      const ignoreList = [
        '/.well-known/appspecific/com.chrome.devtools.json',
      ];
      for (const match of missingFileMatches) {
        const encodedFilePath = match[1].replace(/"/g, '');
        const decodedFilePath = decodeURIComponent(encodedFilePath);
        if (ignoreList.includes(decodedFilePath)) {
          continue;
        }
        console.log('检测到缺失文件:', decodedFilePath);
        const localFilePath = path.join(process.cwd(), decodedFilePath);
        const remoteFileUrl = `${baseUrl}${encodedFilePath}`;
        await downloadFileWithRetries(remoteFileUrl, localFilePath);
      }
    }
  });

  httpServerProcess.stderr.on('data', (data) => {
    console.error('http-server 错误:', data.toString());
  });

  httpServerProcess.on('close', (code) => {
    console.log(`http-server 进程已退出，退出码: ${code}`);
  });
});
