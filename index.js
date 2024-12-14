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
function downloadFile(url, filePath) {
	ensureDirectoryExists(filePath);

	// 如果文件已存在，跳过下载
	if (fs.existsSync(filePath)) {
		console.log(`File already exists: ${filePath}`);
		return;
	}

	const file = fs.createWriteStream(filePath);
	https.get(url, response => {
		response.pipe(file);
		file.on('finish', () => {
			file.close();
			console.log(`Downloaded: ${filePath}`);
		});
	}).on('error', err => {
		fs.unlink(filePath, () => { }); // 删除未完成的文件
		console.error(`Download failed for ${filePath}:`, err.message);
	});
}

// 获取标准输出
server.stdout.on('data', (data) => {
	const output = data.toString();

	// 使用正则表达式匹配包含 404 错误的行并提取路径
	const match = output.match(/GET\s+([^\s]+)\s+Error\s+\(404\)/);

	if (match) {
		const missingFile = match[1].replace(/"/g, '');  // 移除引号
		console.log('Missing file:', missingFile);

		// 构建完整的本地文件路径（从项目根目录开始）
		const localPath = path.join(process.cwd(), missingFile);

		// 使用命令行传入的baseUrl构建下载URL
		const downloadUrl = `${baseUrl}${missingFile}`;

		// 下载文件
		downloadFile(downloadUrl, localPath);
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