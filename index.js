#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 获取命令行参数中的端口号和baseUrl
let port = process.argv[2] || 4000;
const baseUrl = process.argv[3] || 'https://your-resource-domain.com';

// 验证端口号是否有效
port = parseInt(port);
if (isNaN(port) || port < 1 || port > 65535) {
	console.error('Invalid port number. Using default port 4000');
	port = 4000;
}

// 原来的颜色代码是 0,115,128，我们改成更亮的蓝绿色
const arrow = '\x1b[38;2;0;200;255m\u2192\x1b[0m';  // 更亮的箭头颜色
const label = '\x1b[37m';  // 更亮的白色文本
const value = '\x1b[38;2;0;255;255m';  // 更亮的青色值

console.log(`${arrow}${label} Local: ${value}http://127.0.0.1:${port}\x1b[0m`);
console.log(`${arrow}${label} Base URL: ${value}${baseUrl}\x1b[0m`);
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

	// 如果文件已存在，跳过下载
	if (fs.existsSync(filePath)) {
		console.log(`File already exists: ${filePath}`);
		return;
	}

	const file = fs.createWriteStream(filePath);
	let fileSize = 0;
	let currentRetry = 0;

	const startDownload = () => {
		fileSize = 0; // 重置文件大小计数
		
		https.get(url, response => {
			// 检查响应状态码
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
					// 检查文件大小
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
		}).on('error', err => {
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

	// 添加文件写入错误处理
	file.on('error', err => {
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

	// 开始首次下载
	startDownload();
}

// 获取标准输出
server.stdout.on('data', (data) => {
	const output = data.toString();

	// 定义正则表达式，支持任意文件后缀
	const regex = /"GET (\/.*?\.[a-zA-Z0-9]+)" Error \(404\):/g;

	// 使用正则表达式匹配包含 404 错误的行并提取路径
	const matches = [...output.matchAll(regex)];
	if (matches.length > 0) {
		matches.forEach((match) => {
			const missingFile = match[1].replace(/"/g, '');  // 移除引号
			console.log('Missing file:', missingFile);

			// 构建完整的本地文件路径（从项目根目录开始）
			const localPath = path.join(process.cwd(), missingFile);

			// 使用命令行传入的baseUrl构建下载URL
			const downloadUrl = `${baseUrl}${missingFile}`;

			// 下载文件
			downloadFile(downloadUrl, localPath);
		});
	}
});

// 获取标准错误输出
server.stderr.on('data', (data) => {
	console.error('stderr:', data.toString());
});

// 监听进程结束
server.on('close', (code) => {
	console.log(`http-server process exited with code ${code}`);
});
