# Flomo to Markdown 转换工具

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC) [![AI: Code Assist](https://img.shields.io/badge/AI-Code%20Assist-EB9FDA)](https://github.com/features/copilot)

一个简单的 Node.js 工具，用于将 [Flomo](https://flomoapp.com/) 导出的 HTML 笔记文件转换为 CSV 文件（暂不支持图片）。

## 特性

- 将 Flomo HTML 导出文件转换为独立的 CSV 文件，CSV 文件可导入 DayOne 中。


## 环境要求

- [Node.js](https://nodejs.org/) (v12 或更高版本)
- [pnpm](https://pnpm.io/) (或 npm/yarn)

## 安装

1. 克隆此仓库：
```bash
git clone https://github.com/leon-zym/flomo-to-markdown.git
cd flomo-to-markdown
```

2. 安装依赖：
```bash
pnpm install
```

## 使用方法

1. [从 Flomo 导出数据](https://help.flomoapp.com/basic/storage.html#%E5%A6%82%E4%BD%95%E5%AF%BC%E5%87%BA%E6%95%B0%E6%8D%AE)，得到一个 .zip 压缩包
2. 解压后，将其中的所有文件复制到项目目录下
3. 在终端中运行转换脚本：
```bash
node convert.js
```
4. 如果成功，则会生成 `output` 目录，查看输出即可

脚本将会：
- 自动检测并使用目录下的第一个 HTML 文件，该文件包含了所有的笔记文字内容
- 创建 `output` 目录
- 生成 CSV 文件

## 贡献

欢迎提出 issues 或提交 pull requests 来改进这个工具。

## 开源协议

本项目使用 ISC 协议。
