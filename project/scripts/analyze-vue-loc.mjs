#!/usr/bin/env node

/**
 * analyze-vue-loc.mjs
 *
 * 前端源码行数统计工具。
 *
 * 支持：
 *   - .vue：拆分 template / script / style，并进一步区分 css / scss / styleOther
 *   - .js/.mjs/.cjs/.ts/.jsx/.tsx：计入 script
 *   - .css：计入 style + css
 *   - .scss/.sass：计入 style + scss
 *   - .less/.styl/.stylus：计入 style + styleOther
 *   - .html/.htm：计入 template
 *
 * 默认：
 *   - 扫描 src
 *   - 只显示总行数 >= 100 的文件
 *   - 按 total 行数倒序排序
 *   - 输出 Markdown
 *
 * 常用：
 *   npm run num
 *   npm run num -- 200
 *   npm run num -- 100 50
 *
 * 完整：
 *   node scripts/analyze-vue-loc.mjs
 *   node scripts/analyze-vue-loc.mjs 200
 *   node scripts/analyze-vue-loc.mjs 100 50
 *   node scripts/analyze-vue-loc.mjs --root src --min 100
 *   node scripts/analyze-vue-loc.mjs --root src --min 100 --out frontend-loc-report.md
 *   node scripts/analyze-vue-loc.mjs --root src --min 100 --top 50
 *   node scripts/analyze-vue-loc.mjs --root src --ext vue
 *   node scripts/analyze-vue-loc.mjs --root src --ext vue,js,ts,scss
 *   node scripts/analyze-vue-loc.mjs --root src --kind vue
 *   node scripts/analyze-vue-loc.mjs --root src --kind script
 *   node scripts/analyze-vue-loc.mjs --root src --style css
 *   node scripts/analyze-vue-loc.mjs --root src --style scss
 *   node scripts/analyze-vue-loc.mjs --root src --type style-heavy
 *   node scripts/analyze-vue-loc.mjs --root src --sort style --order desc
 *   node scripts/analyze-vue-loc.mjs --root src --format json --out frontend-loc-report.json
 *   node scripts/analyze-vue-loc.mjs --root src --format csv --out frontend-loc-report.csv
 */

import fs from 'node:fs'
import path from 'node:path'

const args = parseArgs(process.argv.slice(2))

if (args.help || args.h) {
  printHelp()
  process.exit(0)
}

const DEFAULT_EXTENSIONS = [
  'vue',
  'js',
  'mjs',
  'cjs',
  'ts',
  'jsx',
  'tsx',
  'css',
  'scss',
  'sass',
  'less',
  'styl',
  'stylus',
  'html',
  'htm'
]

const SCRIPT_EXTENSIONS = new Set(['js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx'])
const CSS_EXTENSIONS = new Set(['css'])
const SCSS_EXTENSIONS = new Set(['scss', 'sass'])
const OTHER_STYLE_EXTENSIONS = new Set(['less', 'styl', 'stylus'])
const TEMPLATE_EXTENSIONS = new Set(['html', 'htm'])

const rootDir = path.resolve(process.cwd(), args.root || 'src')

// 支持：
//   npm run num -- 200
//   npm run num -- --min 200
const minLines = toNumber(args.min ?? args._[0], 100)

// 支持：
//   npm run num -- 100 50
//   npm run num -- --top 50
const top = toNullableNumber(args.top ?? args._[1])

const outFile = args.out ? path.resolve(process.cwd(), args.out) : null
const format = normalizeFormat(args.format || 'markdown')
const sortBy = normalizeSortKey(args.sort || 'total')
const order = normalizeOrder(args.order || (args.asc ? 'asc' : 'desc'))
const typeFilter = parseList(args.type)
const kindFilter = normalizeKindFilter(args.kind || 'all')
const styleFilter = normalizeStyleFilter(args.style || 'all')
const extensions = normalizeExtensions(args.ext || args.extensions || DEFAULT_EXTENSIONS.join(','))
const summaryOnly = Boolean(args['summary-only'])

const EXCLUDE_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.vite',
  '.nuxt',
  '.output'
])

const EXCLUDE_PATH_PARTS = [
  path.normalize('public/data'),
  path.normalize('public/tutorial')
]

main()

function main() {
  if (!fs.existsSync(rootDir)) {
    console.error(`[ERROR] root not found: ${rootDir}`)
    process.exit(1)
  }

  const sourceFiles = []
  walk(rootDir, sourceFiles)

  const analyzedRows = sourceFiles
    .map(analyzeSourceFile)
    .filter(Boolean)

  const matchedRows = analyzedRows
    .filter(row => row.total >= minLines)
    .filter(row => matchTypeFilter(row, typeFilter))
    .filter(row => matchKindFilter(row, kindFilter))
    .filter(row => matchStyleFilter(row, styleFilter))

  sortRows(matchedRows, sortBy, order)

  const shownRows = top ? matchedRows.slice(0, top) : matchedRows

  const reportData = {
    rootDir,
    minLines,
    top,
    format,
    sortBy,
    order,
    typeFilter,
    kindFilter,
    styleFilter,
    extensions,
    summaryOnly,
    totalSourceFiles: sourceFiles.length,
    analyzedFiles: analyzedRows.length,
    matchedFiles: matchedRows.length,
    shownFiles: shownRows.length,
    matchedRows,
    rows: shownRows
  }

  const report = renderReport(reportData)

  if (outFile) {
    fs.writeFileSync(outFile, report, 'utf8')
    console.log(`已输出：${normalizeSlash(path.relative(process.cwd(), outFile))}`)
  } else {
    console.log(report)
  }
}

function parseArgs(argv) {
  const result = {
    _: []
  }

  for (let i = 0; i < argv.length; i++) {
    const item = argv[i]

    if (item.startsWith('--')) {
      const key = item.slice(2)
      const next = argv[i + 1]

      if (!next || next.startsWith('--')) {
        result[key] = true
      } else {
        result[key] = next
        i++
      }
    } else if (item.startsWith('-') && item.length > 1) {
      // 简单支持 -h
      const key = item.slice(1)
      result[key] = true
    } else {
      result._.push(item)
    }
  }

  return result
}

function walk(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (shouldSkipDir(fullPath, entry.name)) continue
      walk(fullPath, files)
      continue
    }

    if (!entry.isFile()) continue

    const ext = getExt(entry.name)

    if (extensions.has(ext)) {
      files.push(fullPath)
    }
  }
}

function shouldSkipDir(fullPath, dirName) {
  if (EXCLUDE_DIR_NAMES.has(dirName)) return true

  const normalized = path.normalize(fullPath)
  return EXCLUDE_PATH_PARTS.some(part => normalized.includes(part))
}

function analyzeSourceFile(filePath) {
  try {
    const source = fs.readFileSync(filePath, 'utf8')
    const ext = getExt(filePath)

    if (ext === 'vue') {
      return analyzeVueFile(filePath, source)
    }

    if (SCRIPT_EXTENSIONS.has(ext)) {
      return analyzeScriptFile(filePath, source, ext)
    }

    if (CSS_EXTENSIONS.has(ext)) {
      return analyzeCssFile(filePath, source, ext)
    }

    if (SCSS_EXTENSIONS.has(ext)) {
      return analyzeScssFile(filePath, source, ext)
    }

    if (OTHER_STYLE_EXTENSIONS.has(ext)) {
      return analyzeOtherStyleFile(filePath, source, ext)
    }

    if (TEMPLATE_EXTENSIONS.has(ext)) {
      return analyzeTemplateFile(filePath, source, ext)
    }

    return analyzeOtherFile(filePath, source, ext)
  } catch (error) {
    console.error(`[WARN] failed to read: ${filePath}`)
    console.error(error.message)
    return null
  }
}

function analyzeVueFile(filePath, source) {
  const total = countLines(source)
  const template = countBlocks(source, 'template')
  const script = countBlocks(source, 'script')

  const styleStats = countStyleBlocks(source)
  const style = styleStats.total
  const css = styleStats.css
  const scss = styleStats.scss
  const styleOther = styleStats.other

  // other 包括：
  // 1. <template> / </template> / <script> / </script> / <style> / </style> 标签行
  // 2. SFC 顶层注释
  // 3. 块之间的空白行
  // 4. 未归入 template/script/style 的内容
  const other = Math.max(0, total - template - script - style)

  return buildRow({
    filePath,
    ext: 'vue',
    kind: 'vue',
    total,
    template,
    script,
    style,
    css,
    scss,
    styleOther,
    other
  })
}

function analyzeScriptFile(filePath, source, ext) {
  const total = countLines(source)

  return buildRow({
    filePath,
    ext,
    kind: 'script',
    total,
    template: 0,
    script: total,
    style: 0,
    css: 0,
    scss: 0,
    styleOther: 0,
    other: 0
  })
}

function analyzeCssFile(filePath, source, ext) {
  const total = countLines(source)

  return buildRow({
    filePath,
    ext,
    kind: 'style',
    total,
    template: 0,
    script: 0,
    style: total,
    css: total,
    scss: 0,
    styleOther: 0,
    other: 0
  })
}

function analyzeScssFile(filePath, source, ext) {
  const total = countLines(source)

  return buildRow({
    filePath,
    ext,
    kind: 'style',
    total,
    template: 0,
    script: 0,
    style: total,
    css: 0,
    scss: total,
    styleOther: 0,
    other: 0
  })
}

function analyzeOtherStyleFile(filePath, source, ext) {
  const total = countLines(source)

  return buildRow({
    filePath,
    ext,
    kind: 'style',
    total,
    template: 0,
    script: 0,
    style: total,
    css: 0,
    scss: 0,
    styleOther: total,
    other: 0
  })
}

function analyzeTemplateFile(filePath, source, ext) {
  const total = countLines(source)

  return buildRow({
    filePath,
    ext,
    kind: 'template',
    total,
    template: total,
    script: 0,
    style: 0,
    css: 0,
    scss: 0,
    styleOther: 0,
    other: 0
  })
}

function analyzeOtherFile(filePath, source, ext) {
  const total = countLines(source)

  return buildRow({
    filePath,
    ext,
    kind: 'other',
    total,
    template: 0,
    script: 0,
    style: 0,
    css: 0,
    scss: 0,
    styleOther: 0,
    other: total
  })
}

function buildRow({
  filePath,
  ext,
  kind,
  total,
  template,
  script,
  style,
  css,
  scss,
  styleOther,
  other
}) {
  const templateRatio = total > 0 ? template / total : 0
  const scriptRatio = total > 0 ? script / total : 0
  const styleRatio = total > 0 ? style / total : 0

  return {
    file: normalizeSlash(path.relative(process.cwd(), filePath)),
    ext,
    kind,
    total,
    template,
    script,
    style,
    css,
    scss,
    styleOther,
    other,
    templateRatio,
    scriptRatio,
    styleRatio,
    type: getDominantType({ templateRatio, scriptRatio, styleRatio })
  }
}

function countBlocks(source, tagName) {
  const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi')
  let total = 0
  let match

  while ((match = regex.exec(source)) !== null) {
    const content = match[1] || ''
    total += countLines(content)
  }

  return total
}

function countStyleBlocks(source) {
  const regex = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi

  const stats = {
    total: 0,
    css: 0,
    scss: 0,
    other: 0
  }

  let match

  while ((match = regex.exec(source)) !== null) {
    const attrs = match[1] || ''
    const content = match[2] || ''
    const lines = countLines(content)
    const lang = getStyleLang(attrs)

    stats.total += lines

    if (!lang || lang === 'css') {
      stats.css += lines
    } else if (lang === 'scss' || lang === 'sass') {
      stats.scss += lines
    } else {
      stats.other += lines
    }
  }

  return stats
}

function getStyleLang(attrs) {
  const match = attrs.match(/\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)

  if (!match) return ''

  return String(match[1] || match[2] || match[3] || '')
    .trim()
    .toLowerCase()
}

function countLines(text) {
  if (!text) return 0

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')

  // 避免文件末尾最后一个换行导致多算一行
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines.length
}

function getDominantType({ templateRatio, scriptRatio, styleRatio }) {
  if (scriptRatio >= 0.5) return 'script-heavy'
  if (styleRatio >= 0.4) return 'style-heavy'
  if (templateRatio >= 0.5) return 'template-heavy'
  return 'mixed'
}

function summarizeRows(rows) {
  const summary = {
    total: 0,
    template: 0,
    script: 0,
    style: 0,
    css: 0,
    scss: 0,
    styleOther: 0,
    other: 0,
    typeCounts: {},
    kindCounts: {},
    extCounts: {},
    styleFileCounts: {
      css: 0,
      scss: 0,
      styleOther: 0,
      noStyle: 0
    }
  }

  for (const row of rows) {
    summary.total += row.total
    summary.template += row.template
    summary.script += row.script
    summary.style += row.style
    summary.css += row.css || 0
    summary.scss += row.scss || 0
    summary.styleOther += row.styleOther || 0
    summary.other += row.other

    summary.typeCounts[row.type] = (summary.typeCounts[row.type] || 0) + 1
    summary.kindCounts[row.kind] = (summary.kindCounts[row.kind] || 0) + 1

    if (!summary.extCounts[row.ext]) {
      summary.extCounts[row.ext] = {
        files: 0,
        total: 0,
        template: 0,
        script: 0,
        style: 0,
        css: 0,
        scss: 0,
        styleOther: 0,
        other: 0
      }
    }

    const extSummary = summary.extCounts[row.ext]
    extSummary.files += 1
    extSummary.total += row.total
    extSummary.template += row.template
    extSummary.script += row.script
    extSummary.style += row.style
    extSummary.css += row.css
    extSummary.scss += row.scss
    extSummary.styleOther += row.styleOther
    extSummary.other += row.other

    if (row.css > 0) summary.styleFileCounts.css += 1
    if (row.scss > 0) summary.styleFileCounts.scss += 1
    if (row.styleOther > 0) summary.styleFileCounts.styleOther += 1
    if (row.style === 0) summary.styleFileCounts.noStyle += 1
  }

  return summary
}

function percent(value, total) {
  if (!total) return '0.00%'
  return `${((value / total) * 100).toFixed(2)}%`
}

function renderReport(data) {
  if (format === 'json') return renderJsonReport(data)
  if (format === 'csv') return renderCsvReport(data)
  return renderMarkdownReport(data)
}

function renderMarkdownReport({
  rootDir,
  minLines,
  top,
  format,
  sortBy,
  order,
  typeFilter,
  kindFilter,
  styleFilter,
  extensions,
  summaryOnly,
  totalSourceFiles,
  analyzedFiles,
  matchedFiles,
  shownFiles,
  matchedRows,
  rows
}) {
  const summary = summarizeRows(matchedRows)
  const lines = []

  lines.push(`# 前端源码行数统计`)
  lines.push('')
  lines.push(`- 扫描目录：\`${normalizeSlash(path.relative(process.cwd(), rootDir) || '.')}\``)
  lines.push(`- 扫描扩展名：\`${Array.from(extensions).join(', ')}\``)
  lines.push(`- 源码文件总数：${totalSourceFiles}`)
  lines.push(`- 成功分析文件数：${analyzedFiles}`)
  lines.push(`- 最小总行数：${minLines}`)
  lines.push(`- top 限制：${top || '无'}`)
  lines.push(`- 输出格式：${format}`)
  lines.push(`- 排序字段：${sortBy}`)
  lines.push(`- 排序方向：${order}`)
  lines.push(`- kind 筛选：${kindFilter}`)
  lines.push(`- 类型筛选：${typeFilter.length ? typeFilter.join(', ') : '全部'}`)
  lines.push(`- style 筛选：${styleFilter}`)
  lines.push(`- 匹配文件数：${matchedFiles}`)
  lines.push(`- 当前展示文件数：${shownFiles}`)
  lines.push('')

  lines.push(`## 总体汇总`)
  lines.push('')
  lines.push(`| 部分 | 行数 | 占比 |`)
  lines.push(`|---|---:|---:|`)
  lines.push(`| template | ${summary.template} | ${percent(summary.template, summary.total)} |`)
  lines.push(`| script | ${summary.script} | ${percent(summary.script, summary.total)} |`)
  lines.push(`| style | ${summary.style} | ${percent(summary.style, summary.total)} |`)
  lines.push(`| other | ${summary.other} | ${percent(summary.other, summary.total)} |`)
  lines.push(`| **total** | **${summary.total}** | **100%** |`)
  lines.push('')

  lines.push(`## style 细分`)
  lines.push('')
  lines.push(`| 类型 | 行数 | 占 style 比例 | 占 total 比例 | 涉及文件数 |`)
  lines.push(`|---|---:|---:|---:|---:|`)
  lines.push(`| CSS / 无 lang | ${summary.css} | ${percent(summary.css, summary.style)} | ${percent(summary.css, summary.total)} | ${summary.styleFileCounts.css} |`)
  lines.push(`| SCSS / Sass | ${summary.scss} | ${percent(summary.scss, summary.style)} | ${percent(summary.scss, summary.total)} | ${summary.styleFileCounts.scss} |`)
  lines.push(`| other style lang | ${summary.styleOther} | ${percent(summary.styleOther, summary.style)} | ${percent(summary.styleOther, summary.total)} | ${summary.styleFileCounts.styleOther} |`)
  lines.push(`| no style | 0 | 0.00% | 0.00% | ${summary.styleFileCounts.noStyle} |`)
  lines.push('')

  lines.push(`## 文件种类汇总`)
  lines.push('')
  lines.push(`| kind | 文件数 |`)
  lines.push(`|---|---:|`)

  Object.entries(summary.kindCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([kind, count]) => {
      lines.push(`| ${kind} | ${count} |`)
    })

  lines.push('')
  lines.push(`## 扩展名汇总`)
  lines.push('')
  lines.push(`| ext | files | total | template | script | style | css | scss | styleOther | other |`)
  lines.push(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|`)

  Object.entries(summary.extCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([ext, item]) => {
      lines.push(
        `| .${ext} ` +
        `| ${item.files} ` +
        `| ${item.total} ` +
        `| ${item.template} ` +
        `| ${item.script} ` +
        `| ${item.style} ` +
        `| ${item.css} ` +
        `| ${item.scss} ` +
        `| ${item.styleOther} ` +
        `| ${item.other} |`
      )
    })

  lines.push('')
  lines.push(`## 类型汇总`)
  lines.push('')
  lines.push(`| 类型 | 文件数 |`)
  lines.push(`|---|---:|`)

  Object.entries(summary.typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      lines.push(`| ${type} | ${count} |`)
    })

  if (!summaryOnly) {
    lines.push('')
    lines.push(`## 文件明细`)
    lines.push('')
    lines.push(`| 排名 | total | template | script | style | css | scss | styleOther | other | ext | kind | 类型 | 文件 |`)
    lines.push(`|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|`)

    rows.forEach((row, index) => {
      lines.push(
        `| ${index + 1} ` +
        `| ${row.total} ` +
        `| ${row.template} ` +
        `| ${row.script} ` +
        `| ${row.style} ` +
        `| ${row.css} ` +
        `| ${row.scss} ` +
        `| ${row.styleOther} ` +
        `| ${row.other} ` +
        `| .${row.ext} ` +
        `| ${row.kind} ` +
        `| ${row.type} ` +
        `| \`${row.file}\` |`
      )
    })
  }

  lines.push('')
  lines.push(`## 参数说明`)
  lines.push('')
  lines.push(`| 参数 | 含义 | 示例 |`)
  lines.push(`|---|---|---|`)
  lines.push(`| 第 1 个数字 | min，最小总行数 | \`npm run num -- 200\` |`)
  lines.push(`| 第 2 个数字 | top，只展示前 N 个 | \`npm run num -- 100 50\` |`)
  lines.push(`| \`--root\` | 扫描目录 | \`--root src/main\` |`)
  lines.push(`| \`--min\` | 最小总行数 | \`--min 100\` |`)
  lines.push(`| \`--top\` | 只展示前 N 个 | \`--top 50\` |`)
  lines.push(`| \`--ext\` | 扫描扩展名 | \`--ext vue,js,ts,scss\` |`)
  lines.push(`| \`--kind\` | 文件种类筛选：all/vue/script/style/template/other | \`--kind script\` |`)
  lines.push(`| \`--out\` | 输出文件 | \`--out frontend-loc-report.md\` |`)
  lines.push(`| \`--format\` | \`markdown\` / \`json\` / \`csv\` | \`--format json\` |`)
  lines.push(`| \`--sort\` | 排序字段 | \`--sort style\` |`)
  lines.push(`| \`--order\` | \`desc\` / \`asc\` | \`--order asc\` |`)
  lines.push(`| \`--type\` | 类型筛选 | \`--type style-heavy\` |`)
  lines.push(`| \`--style\` | 样式筛选 | \`--style css\` |`)
  lines.push(`| \`--summary-only\` | 只输出汇总 | \`--summary-only\` |`)
  lines.push('')

  lines.push(`## 类型说明`)
  lines.push('')
  lines.push(`- \`script-heavy\`：script 占比 >= 50%，通常说明 JS/TS 逻辑偏重。`)
  lines.push(`- \`style-heavy\`：style 占比 >= 40%，通常说明 CSS/SCSS 样式偏重。`)
  lines.push(`- \`template-heavy\`：template 占比 >= 50%，通常说明模板结构偏重。`)
  lines.push(`- \`mixed\`：template / script / style 都比较多，适合进一步拆组件或抽 composable。`)
  lines.push('')

  lines.push(`## 注意`)
  lines.push('')
  lines.push(`- \`.vue\` 会拆分 \`template / script / style\`。`)
  lines.push(`- 独立 \`.js/.ts/.jsx/.tsx\` 会整体计入 \`script\`。`)
  lines.push(`- 独立 \`.css\` 会整体计入 \`style + css\`。`)
  lines.push(`- 独立 \`.scss/.sass\` 会整体计入 \`style + scss\`。`)
  lines.push(`- 独立 \`.less/.styl/.stylus\` 会整体计入 \`styleOther\`。`)
  lines.push(`- 独立 \`.html/.htm\` 会整体计入 \`template\`。`)
  lines.push(`- \`other\` 在 \`.vue\` 中主要包含 SFC 标签行、块间空行、顶层注释等。`)
  lines.push('')

  return lines.join('\n')
}

function renderJsonReport({
  rootDir,
  minLines,
  top,
  format,
  sortBy,
  order,
  typeFilter,
  kindFilter,
  styleFilter,
  extensions,
  totalSourceFiles,
  analyzedFiles,
  matchedFiles,
  shownFiles,
  matchedRows,
  rows
}) {
  const summary = summarizeRows(matchedRows)

  return JSON.stringify(
    {
      meta: {
        root: normalizeSlash(path.relative(process.cwd(), rootDir) || '.'),
        min: minLines,
        top,
        format,
        sortBy,
        order,
        typeFilter,
        kindFilter,
        styleFilter,
        extensions: Array.from(extensions),
        totalSourceFiles,
        analyzedFiles,
        matchedFiles,
        shownFiles
      },
      summary,
      rows
    },
    null,
    2
  )
}

function renderCsvReport({ rows }) {
  const header = [
    'rank',
    'total',
    'template',
    'script',
    'style',
    'css',
    'scss',
    'styleOther',
    'other',
    'ext',
    'kind',
    'type',
    'file'
  ]

  const lines = [header.join(',')]

  rows.forEach((row, index) => {
    lines.push([
      index + 1,
      row.total,
      row.template,
      row.script,
      row.style,
      row.css,
      row.scss,
      row.styleOther,
      row.other,
      escapeCsv(row.ext),
      escapeCsv(row.kind),
      escapeCsv(row.type),
      escapeCsv(row.file)
    ].join(','))
  })

  return lines.join('\n')
}

function sortRows(rows, key, direction) {
  const factor = direction === 'asc' ? 1 : -1

  rows.sort((a, b) => {
    if (key === 'file' || key === 'ext' || key === 'kind' || key === 'type') {
      return String(a[key]).localeCompare(String(b[key])) * factor
    }

    const av = Number(a[key] || 0)
    const bv = Number(b[key] || 0)

    if (av === bv) {
      return a.file.localeCompare(b.file)
    }

    return (av - bv) * factor
  })
}

function matchTypeFilter(row, filters) {
  if (!filters.length) return true
  return filters.includes(row.type)
}

function matchKindFilter(row, filter) {
  if (filter === 'all') return true
  return row.kind === filter
}

function matchStyleFilter(row, filter) {
  if (filter === 'all') return true
  if (filter === 'css') return row.css > 0
  if (filter === 'scss') return row.scss > 0
  if (filter === 'other') return row.styleOther > 0
  if (filter === 'no-style') return row.style === 0
  return true
}

function parseList(value) {
  if (!value || value === true) return []

  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeExtensions(value) {
  const list = parseList(value)
    .map(item => item.replace(/^\./, '').trim().toLowerCase())
    .filter(Boolean)

  if (!list.length) {
    console.error(`[ERROR] --ext cannot be empty`)
    process.exit(1)
  }

  return new Set(list)
}

function normalizeFormat(value) {
  const allowed = new Set(['markdown', 'md', 'json', 'csv'])
  const normalized = String(value || 'markdown').toLowerCase()

  if (!allowed.has(normalized)) {
    console.error(`[ERROR] invalid --format: ${value}`)
    console.error(`Allowed: markdown, json, csv`)
    process.exit(1)
  }

  return normalized === 'md' ? 'markdown' : normalized
}

function normalizeSortKey(value) {
  const keyMap = {
    total: 'total',
    template: 'template',
    script: 'script',
    style: 'style',
    css: 'css',
    scss: 'scss',
    styleother: 'styleOther',
    'style-other': 'styleOther',
    other: 'other',
    file: 'file',
    ext: 'ext',
    kind: 'kind',
    type: 'type'
  }

  const normalized = String(value || 'total').toLowerCase()
  const key = keyMap[normalized]

  if (!key) {
    console.error(`[ERROR] invalid --sort: ${value}`)
    console.error(`Allowed: total, template, script, style, css, scss, styleOther, other, file, ext, kind, type`)
    process.exit(1)
  }

  return key
}

function normalizeOrder(value) {
  const normalized = String(value || 'desc').toLowerCase()

  if (!['asc', 'desc'].includes(normalized)) {
    console.error(`[ERROR] invalid --order: ${value}`)
    console.error(`Allowed: asc, desc`)
    process.exit(1)
  }

  return normalized
}

function normalizeKindFilter(value) {
  const normalized = String(value || 'all').toLowerCase()

  if (!['all', 'vue', 'script', 'style', 'template', 'other'].includes(normalized)) {
    console.error(`[ERROR] invalid --kind: ${value}`)
    console.error(`Allowed: all, vue, script, style, template, other`)
    process.exit(1)
  }

  return normalized
}

function normalizeStyleFilter(value) {
  const normalized = String(value || 'all').toLowerCase()

  if (!['all', 'css', 'scss', 'other', 'no-style'].includes(normalized)) {
    console.error(`[ERROR] invalid --style: ${value}`)
    console.error(`Allowed: all, css, scss, other, no-style`)
    process.exit(1)
  }

  return normalized
}

function toNumber(value, defaultValue) {
  if (value === undefined || value === null || value === true || value === '') {
    return defaultValue
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    console.error(`[ERROR] invalid number: ${value}`)
    process.exit(1)
  }

  return number
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === true || value === '') {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    console.error(`[ERROR] invalid number: ${value}`)
    process.exit(1)
  }

  return number
}

function escapeCsv(value) {
  const text = String(value ?? '')

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function getExt(filePath) {
  return path.extname(filePath).replace(/^\./, '').toLowerCase()
}

function normalizeSlash(value) {
  return value.split(path.sep).join('/')
}

function printHelp() {
  console.log(`
前端源码行数统计工具

用法：
  node scripts/analyze-vue-loc.mjs
  node scripts/analyze-vue-loc.mjs 200
  node scripts/analyze-vue-loc.mjs 100 50
  node scripts/analyze-vue-loc.mjs --root src --min 100
  node scripts/analyze-vue-loc.mjs --root src --min 100 --top 50
  node scripts/analyze-vue-loc.mjs --root src --out frontend-loc-report.md
  node scripts/analyze-vue-loc.mjs --root src --format json --out frontend-loc-report.json
  node scripts/analyze-vue-loc.mjs --root src --ext vue,js,ts,scss
  node scripts/analyze-vue-loc.mjs --root src --kind vue
  node scripts/analyze-vue-loc.mjs --root src --kind script
  node scripts/analyze-vue-loc.mjs --root src --style css
  node scripts/analyze-vue-loc.mjs --root src --type style-heavy
  node scripts/analyze-vue-loc.mjs --root src --sort style --order desc

参数：
  第 1 个数字             min，最小总行数，例如：200
  第 2 个数字             top，只展示前 N 个，例如：100 50

  --root <dir>            扫描目录，默认 src
  --min <number>          最小总行数，默认 100
  --top <number>          只展示前 N 个
  --ext <list>            扩展名列表，默认 vue,js,mjs,cjs,ts,jsx,tsx,css,scss,sass,less,styl,stylus,html,htm
  --kind <type>           all / vue / script / style / template / other，默认 all
  --out <file>            输出文件
  --format <type>         markdown / json / csv，默认 markdown
  --sort <key>            total / template / script / style / css / scss / styleOther / other / file / ext / kind / type
  --order <type>          desc / asc，默认 desc
  --type <type>           style-heavy / script-heavy / template-heavy / mixed，可逗号分隔
  --style <type>          all / css / scss / other / no-style，默认 all
  --summary-only          只输出汇总，不输出文件明细
  --help, -h              显示帮助

例子：
  npm run num
  npm run num -- 200
  npm run num -- 100 50
  npm run num -- --ext vue
  npm run num -- --ext vue,js,ts,scss
  npm run num -- --kind script
  npm run num -- --kind style
  npm run num -- --style css
  npm run num -- --style scss
  npm run num -- --type style-heavy
  npm run num -- --sort css --order desc
  npm run num -- --out frontend-loc-report.md
`)
}