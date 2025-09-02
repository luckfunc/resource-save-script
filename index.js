#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 获取命令行参数中的端口号
let port = process.argv[2] || 4000;

// 验证端口号是否有效
port = parseInt(port);
if (isNaN(port) || port < 1 || port > 65535) {
  console.error('Invalid port number. Using default port 4000');
  port = 4000;
}

// 颜色代码
const arrow = '\x1b[38;2;0;200;255m\u2192\x1b[0m';
const label = '\x1b[37m';
const value = '\x1b[38;2;0;255;255m';

console.log(`${arrow}${label} Local: ${value}http://127.0.0.1:${port}\x1b[0m`);

rl.question(`${arrow}${label} Please enter the base URL: \x1b[0m`, (baseUrl) => {
  console.log(`${arrow}${label} Base URL: ${value}${baseUrl}\x1b[0m`);
  rl.close();

  const server = exec(`http-server -p ${port}`);

  // 创建目录的函数
  function ensureDirectoryExists(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExists(dirname);
    fs.mkdirSync(dirname);
  }

  // 下载文件的函数
  function downloadFile(url, filePath, retryCount = 3) {
    ensureDirectoryExists(filePath);

    if (fs.existsSync(filePath)) {
      console.log(`File already exists: ${filePath}`);
      return;
    }

    const file = fs.createWriteStream(filePath);
    let fileSize = 0;

    let currentRetry = 0;

    const startDownload = () => {
      fileSize = 0;

      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(filePath, () => {});
          if (currentRetry < retryCount) {
            currentRetry++;
            console.log(`Retrying download (${currentRetry}/${retryCount}) for ${filePath} due to HTTP status ${response.statusCode}`);
            startDownload();
          } else {
            console.error(`Failed to download ${filePath}: HTTP Status ${response.statusCode} after ${retryCount} retries`);
          }
          return;
        }

        response.on('data', (chunk) => {
          fileSize += chunk.length;
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            if (fileSize === 0) {
              fs.unlink(filePath, () => {
                if (currentRetry < retryCount) {
                  currentRetry++;
                  console.log(`Retrying download (${currentRetry}/${retryCount}) for ${filePath} due to empty file`);
                  startDownload();
                } else {
                  console.error(`Failed to download ${filePath}: File is empty after ${retryCount} retries`);
                }
              });
            } else {
              console.log(`Downloaded: ${filePath} (${fileSize} bytes)`);
            }
          });
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(filePath, () => {
          if (currentRetry < retryCount) {
            currentRetry++;
            console.log(`Retrying download (${currentRetry}/${retryCount}) for ${filePath} due to error: ${err.message}`);
            startDownload();
          } else {
            console.error(`Download failed for ${filePath} after ${retryCount} retries:`, err.message);
          }
        });
      });
    };

    file.on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {
        if (currentRetry < retryCount) {
          currentRetry++;
          console.log(`Retrying download (${currentRetry}/${retryCount}) for ${filePath} due to file write error: ${err.message}`);
          startDownload();
        } else {
          console.error(`File write error for ${filePath} after ${retryCount} retries:`, err.message);
        }
      });
    });

    startDownload();
  }

  server.stdout.on('data', (data) => {
    const output = data.toString();
    const regex = /"GET (\/.*?\.[a-zA-Z0-9]+)" Error \(404\):/g;
    const matches = [...output.matchAll(regex)];

    if (matches.length > 0) {
      matches.forEach((match) => {
        const encodedMissingFile = match[1].replace(/"/g, '');
        const decodedMissingFile = decodeURIComponent(encodedMissingFile);
        console.log('Missing file:', decodedMissingFile);

        const localPath = path.join(process.cwd(), decodedMissingFile);
        const downloadUrl = `${baseUrl}${encodedMissingFile}`;

        downloadFile(downloadUrl, localPath);
      });
    }
  });

  server.stderr.on('data', (data) => {
    console.error('stderr:', data.toString());
  });

  server.on('close', (code) => {
    console.log(`http-server process exited with code ${code}`);
  });
});
