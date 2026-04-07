const fs = require('fs');
const crypto = require('crypto');
const cheerio = require('cheerio');
const moment = require('moment');
const path = require('path');

// Constants
const OUTPUT_DIR = 'output';
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'export.json');
const CSV_OUTPUT = path.join(OUTPUT_DIR, 'journal.csv');

// Find the first HTML file in current directory
// 读取当前目录下的导出 html 文件
const htmlFiles = fs.readdirSync('.')
    .filter(file => file.endsWith('.html'));

if (htmlFiles.length === 0) {
    console.error('No HTML files found in current directory');
    process.exit(1);
}

const INPUT_FILE = htmlFiles[0];
const INPUT_DIR = path.dirname(path.resolve(INPUT_FILE));
console.log(`Using ${INPUT_FILE} as input`);

// Read and parse HTML file
// 读取 HTML 文件
const html = fs.readFileSync(INPUT_FILE, 'utf8');
// 使用 cheerio 解析 HTML 文件
const $ = cheerio.load(html);

// Create output directory if not exists
// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

/** @returns {string} 32 hex chars, uppercase, no dashes (same shape as prior random filenames) */
// 生成 32 位大写十六进制 uuid
function randomUuidHex() {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
}

/** @param {import('moment').Moment} m */
// 将 moment 对象转换为 ISO 时间
function toCreationDateIsoUtc(m) {
    return m.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
}

/** RFC 4180: 含逗号、换行、双引号时用双引号包裹，字段内 " 写成 "". */
// 将字符串转换为 CSV 格式
function escapeCsvField(value) {
    const s = value == null ? '' : String(value);
    if (s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    if (/[,\r\n]/.test(s)) {
        return `"${s}"`;
    }
    return s;
}

/**
 * Build the same string that was previously written to each .md file.
 */
// 构建 memo 文本
// 参数：$memo - cheerio 对象，表示 memo 元素；date - 日期字符串
function buildMemoText($memo, date) {
    // 获取 memo 的创建时间
    const timestamp = $memo.find('.time').text().trim();
    // 获取 memo 的内容
    const $content = $memo.find('.content');
    // 获取 memo 的附件
    const $files = $memo.find('.files');

    const markdownParts = [];

    const baseTitle = `${date}`;
    markdownParts.push(`# ${baseTitle}\n`);

    if ($content.length) {
        $content.find('p').each((_, p) => {
            const text = $(p).text().trim();
            text && markdownParts.push(`${text}\n`);
        });

        $content.find('ul').each((_, ul) => {
            $(ul).find('li').each((_, li) => {
                markdownParts.push(`- ${$(li).text().trim()}`);
            });
            markdownParts.push('');
        });

        $content.find('ol').each((_, ol) => {
            let itemNum = 1;
            $(ol).find('li').each((_, li) => {
                markdownParts.push(`${itemNum}. ${$(li).text().trim()}`);
                itemNum++;
            });
            markdownParts.push('');
        });
    }

    markdownParts.push(`Created: ${timestamp}\n`);

    if ($files.length) {
        const $images = $files.find('img');
        $images.each((_, img) => {
            const imgSrc = $(img).attr('src');
            if (!imgSrc) return;

            const imageName = path.basename(imgSrc);
            const imageDir = path.dirname(imgSrc);
            const outputImageDir = path.join(OUTPUT_DIR, imageDir);

            fs.mkdirSync(outputImageDir, { recursive: true });

            markdownParts.push(`![${imageName}](${imgSrc})`);

            const sourceImagePath = path.join(INPUT_DIR, imgSrc);
            const targetImagePath = path.join(OUTPUT_DIR, imgSrc);

            if (fs.existsSync(sourceImagePath)) {
                fs.copyFileSync(sourceImagePath, targetImagePath);
            }
        });
    }

    return markdownParts.join('\n');
}

// First pass: Count memos per date and collect them
// 【主流程】1、第一次遍历：统计每个日期的 memo 数量并收集它们
const memoStats = new Map();

$('.memo').each((_, element) => {
    // 获取 memo 元素
    const $memo = $(element);
    const timeText = $memo.find('.time').text().trim();
    if (!timeText) return;

    const memoDate = moment(timeText, 'YYYY-MM-DD HH:mm:ss');
    if (!memoDate.isValid()) return;

    const dateKey = memoDate.format('YYYY-MM-DD');
    const dateStats = memoStats.get(dateKey) || { memos: [] };

    dateStats.memos.push({
        element: $memo,
        memoDate
    });

    memoStats.set(dateKey, dateStats);
});

const entries = [];
const csvLines = ['date,text'];

// 【主流程】2、第二次遍历：将 memo 转换为 JSON 和 CSV 格式
memoStats.forEach(({ memos }, date) => {
    memos.forEach(({ element: $memo, memoDate }) => {
        const text = buildMemoText($memo, date);
        // 将 memo 转换为 JSON 格式
        entries.push({
            creationDate: toCreationDateIsoUtc(memoDate),
            text,
            tags: ['DayOne'],
            uuid: randomUuidHex()
        });
        // 将 memo 转换为 CSV 格式
        csvLines.push(`${memoDate.toISOString()},${escapeCsvField(text)}`);
    });
});

// 【主流程】3、将 JSON 和 CSV 格式写入文件
const payload = {
    metadata: {
        version: '1.0'
    },
    entries
};

// 将 JSON 格式写入文件
fs.writeFileSync(JSON_OUTPUT, JSON.stringify(payload, null, 2), 'utf8');

// 将 CSV 格式写入文件
const csvBody = csvLines.join('\n');
fs.writeFileSync(CSV_OUTPUT, `\uFEFF${csvBody}`, 'utf8');

// 输出转换完成信息
console.log(`Conversion completed! JSON: ${JSON_OUTPUT}`);
console.log(`CSV (Sample-CSV-Journal style): ${CSV_OUTPUT}`);
