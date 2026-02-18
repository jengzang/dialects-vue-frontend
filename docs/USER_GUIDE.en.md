# User Guide

> Complete guide to using the 方音圖鑑 (Chinese Dialect Atlas) platform

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Phonological Query System](#phonological-query-system)
3. [Map Visualization](#map-visualization)
4. [Phonology Analysis Tools](#phonology-analysis-tools)
5. [Praat Audio Analysis](#praat-audio-analysis)
6. [Data Management](#data-management)
7. [User Account](#user-account)
8. [Tips & Best Practices](#tips--best-practices)
9. [FAQ](#faq)

---

## Getting Started

### Accessing the Platform

Visit [https://dialects.yzup.top](https://dialects.yzup.top) in your web browser.

**Supported Browsers:**
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

### Navigation

The platform has two main sections:

1. **Menu** (`/menu`) - Main application
   - Query - Search for phonological data
   - Result - View query results
   - Map - Visualize data on map
   - Setting - User settings and account

2. **Explore** (`/explore`) - Analysis tools
   - Phonology Statistics - Sound system analysis
   - Syllable Counting - Phoneme distribution
   - Custom Classification - Custom phoneme matrices
   - Praat - Audio analysis
   - Data Tools - Character table validation, merging, conversion

### User Roles

**Anonymous User:**
- Limited query capabilities (2 locations, 5 characters)
- View public data
- No data saving

**Registered User:**
- Extended query limits (100 locations, 100 characters)
- Save custom annotations
- Create custom regions
- Access full features

**Administrator:**
- Unlimited queries
- Batch data operations
- User management
- System configuration

---

## Phonological Query System

### Overview

The query system supports four modes:
1. **Character Search** - Query by Chinese characters
2. **Middle Chinese** - Search by historical phonology
3. **Phoneme Search** - Query by IPA phonemes
4. **Tone Search** - Find tone systems

### Character Search (查字)

**Purpose:** Find pronunciations of Chinese characters across dialects.

**Steps:**

1. Navigate to `/menu?tab=query`
2. Select the **"查字"** tab
3. Enter Chinese characters in the input field
   - Example: `你好世界`
   - Supports multiple characters
4. Select locations or regions
   - Click "地点" to select specific locations
   - Click "地区" to select entire regions
5. Click **"运行查询"** button
6. View results in the **"结果"** tab

**Example Query:**
```
Characters: 你好
Locations: 广州, 深圳, 香港
→ Returns pronunciations of "你" and "好" in these three locations
```

**Result Fields:**
- **字** - Character
- **地点** - Location
- **读音** - Pronunciation (romanization)
- **IPA** - International Phonetic Alphabet
- **声母** - Initial consonant
- **韵母** - Final
- **调** - Tone
- **注释** - Notes

### Middle Chinese Search (查中古)

**Purpose:** Find modern reflexes of Middle Chinese phonology.

**Steps:**

1. Select the **"查中古"** tab
2. Build Middle Chinese path:
   - **声母** (Initial) - Select from dropdown (帮, 端, 知, etc.)
   - **韵母** (Final) - Select from dropdown (东, 冬, 江, etc.)
   - **调类** (Tone) - Select from dropdown (平, 上, 去, 入)
3. Select features to display:
   - ☑ 声母 (Initial)
   - ☑ 韵母 (Final)
   - ☑ 调类 (Tone category)
4. Select locations or regions
5. Click **"运行查询"**

**Example Query:**
```
Path: 帮_东_平 (Middle Chinese: 帮母 + 东韵 + 平声)
Features: 声母, 韵母
Locations: 广州
→ Returns modern Guangzhou pronunciations of characters with this Middle Chinese origin
```

**Understanding Results:**
- Shows how Middle Chinese sounds evolved in modern dialects
- Useful for historical phonology research
- Reveals sound change patterns

### Phoneme Search (查音位)

**Purpose:** Find characters with specific phonemes.

**Steps:**

1. Select the **"查音位"** tab
2. Select phoneme group:
   - 声母组 (Initial group)
   - 韵母组 (Final group)
   - 调类组 (Tone group)
3. Enter phoneme values (IPA):
   - Example: `p, t, k` for voiceless stops
   - Example: `a, e, i` for vowels
4. Select features to display
5. Select locations or regions
6. Click **"运行查询"**

**Example Query:**
```
Group: 声母组
Values: p, pʰ, m
Features: 声母
Locations: 广州, 深圳
→ Returns all characters with [p], [pʰ], or [m] initials in these locations
```

**Use Cases:**
- Phoneme inventory analysis
- Sound pattern research
- Comparative phonology

### Tone Search (查调)

**Purpose:** Query tone systems of dialects.

**Steps:**

1. Select the **"查调"** tab
2. Select locations or regions
3. Click **"运行查询"**

**Example Query:**
```
Locations: 广州, 深圳, 香港
→ Returns complete tone systems for these three locations
```

**Result Information:**
- **调类** - Tone category (阴平, 阳平, 阴上, etc.)
- **调值** - Tone value (55, 33, 21, etc.)
- **例字** - Example characters

**Understanding Tone Values:**
- 5 = highest pitch
- 1 = lowest pitch
- 55 = high level tone
- 21 = low falling tone
- 35 = mid rising tone

### Viewing Results

After running a query, navigate to the **"结果"** tab.

**Result Display Options:**

1. **List View** - Tabular display with all fields
2. **Map View** - Geographic visualization (click "地图" tab)
3. **Export** - Download results as Excel file

**Result Actions:**
- **Sort** - Click column headers to sort
- **Filter** - Use search box to filter results
- **Pagination** - Navigate through pages (50 rows per page)
- **Details** - Click row to view detailed information

---

## Map Visualization

### Overview

The map visualization displays query results geographically using MapLibre GL.

### Accessing the Map

1. Run a query in the Query tab
2. Navigate to **"地图"** tab
3. Map automatically loads with query results

### Map Features

**Base Map Styles:**
- **Street** - Default street map
- **Satellite** - Satellite imagery
- **Terrain** - Topographic map

**Controls:**
- **Zoom** - Mouse wheel or +/- buttons
- **Pan** - Click and drag
- **Rotate** - Right-click and drag (or Ctrl+drag)
- **Tilt** - Ctrl+drag vertically

### Map Modes

#### 1. Query Mode (查询模式)

Displays results from phonological queries.

**Features:**
- Color-coded markers by phonological feature
- Automatic clustering for dense areas
- Click marker to view details
- Legend shows color mapping

**Color Assignment:**
- Smart algorithm maximizes visual distinction
- Similar sounds get similar colors
- Distinct sounds get contrasting colors

#### 2. Custom Mode (自定义模式)

Add your own markers and annotations.

**Steps:**
1. Click **"自定义"** tab in map view
2. Click **"添加标记"** button
3. Click on map to place marker
4. Enter label and notes
5. Click **"保存"**

**Use Cases:**
- Mark fieldwork locations
- Annotate interesting patterns
- Create custom visualizations

#### 3. Divide Mode (分区模式)

Organize locations into custom regions.

**Steps:**
1. Click **"分区"** tab in map view
2. Click **"创建分区"** button
3. Enter region name
4. Select locations to include
5. Click **"保存"**

**Benefits:**
- Group related locations
- Simplify queries
- Organize research areas

### Exporting Map Data

1. Click **"导出"** button
2. Choose format:
   - **GeoJSON** - For GIS software
   - **Excel** - For spreadsheet analysis
   - **Image** - Screenshot of current view

---

## Phonology Analysis Tools

### Phonology Statistics (音系统计)

**Purpose:** Generate complete sound system matrix for a dialect.

**Access:** `/explore?tab=phonology`

**Steps:**
1. Enter location name
2. Click **"查询"**
3. View phonology matrix

**Matrix Display:**
- **Rows** - Finals (韵母)
- **Columns** - Initials (声母)
- **Cells** - Tones (声调)
- **Content** - Example characters

**Features:**
- Progressive rendering for smooth performance
- Click cell to view all characters with that combination
- Export matrix as Excel file
- Print-friendly layout

**Use Cases:**
- Complete phoneme inventory
- Sound system documentation
- Comparative analysis

### Syllable Counting (音节统计)

**Purpose:** Analyze phoneme distribution and compare locations.

**Access:** `/explore?tab=countphos`

**Steps:**
1. Enter multiple locations (comma-separated)
2. Click **"统计"**
3. View statistics

**Statistics Provided:**
- **声母数量** - Number of initials
- **韵母数量** - Number of finals
- **声调数量** - Number of tones
- **音节总数** - Total syllables
- **分布图表** - Distribution charts

**Comparison View:**
- Side-by-side comparison of locations
- Highlight differences
- Identify patterns

### Custom Classification (自定义音素表)

**Purpose:** Generate custom phoneme classification matrices.

**Access:** `/explore?tab=custom`

**Steps:**
1. Select feature type:
   - 声母 (Initials)
   - 韵母 (Finals)
   - 声调 (Tones)
2. Configure classification dimensions:
   - **横向** (Horizontal) - e.g., 清浊 (voicing)
   - **纵向** (Vertical) - e.g., 部位 (place of articulation)
   - **单元格** (Cell) - e.g., 方式 (manner of articulation)
3. Select locations
4. Click **"生成"**

**Example:**
```
Feature: 声母
Horizontal: 清浊 (Voicing)
Vertical: 部位 (Place)
Cell: 方式 (Manner)
→ Generates matrix showing initials organized by voicing, place, and manner
```

**Use Cases:**
- Phonological feature analysis
- Typological research
- Teaching materials

---

## Praat Audio Analysis

### Overview

Integrated Praat audio analysis for acoustic phonetics research.

**Access:** `/explore?tab=praat`

### Uploading Audio

**Supported Formats:**
- WAV (recommended)
- MP3
- Sample rate: 16kHz - 48kHz

**Methods:**

1. **File Upload**
   - Click **"选择文件"** button
   - Select audio file from computer
   - File uploads automatically

2. **Direct Recording**
   - Click **"录音"** button
   - Allow microphone access
   - Click **"开始"** to start recording
   - Click **"停止"** to finish
   - Recording uploads automatically

### Analysis Settings

**Pitch (F0) Settings:**
- **Minimum F0** - Default: 75 Hz (male voice)
- **Maximum F0** - Default: 500 Hz (female voice)
- Adjust based on speaker gender and age

**Formant Settings:**
- **Formant Ceiling** - Default: 5500 Hz (female), 5000 Hz (male)
- **Number of Formants** - Default: 5
- **Window Length** - Default: 0.025 seconds

**Time Settings:**
- **Time Step** - Default: 0.01 seconds
- Smaller = more detailed, slower processing

### Running Analysis

**Analysis Modes:**

1. **Single Mode** - Analyze entire file as one unit
2. **Continuous Mode** - Segment and analyze separately

**Steps:**
1. Upload or record audio
2. Configure settings
3. Select analysis mode
4. Click **"开始分析"**
5. Wait for processing (progress bar shows status)
6. View results

### Viewing Results

**Waveform Display:**
- Time-domain representation
- Zoom and pan controls
- Selection tools

**Spectrogram:**
- Frequency-time representation
- Formant overlays
- Pitch contour overlay

**Formant Analysis:**
- F1, F2, F3 values over time
- Vowel space plot (F1 vs F2)
- Export formant data

**Pitch Analysis:**
- F0 contour over time
- Tone classification
- Pitch statistics (mean, range, etc.)

**Intensity Analysis:**
- Acoustic energy over time
- Loudness contour
- Intensity statistics

### Exporting Results

**Export Options:**
- **CSV** - Formant and pitch data
- **Image** - Spectrogram and plots
- **Praat TextGrid** - For further analysis in Praat

---

## Data Management

### Character Table Validation (字表检查)

**Purpose:** Check data integrity and completeness.

**Access:** `/explore?tab=check`

**Steps:**
1. Upload character table (Excel file)
2. Select locations to check
3. Click **"检查"**
4. View validation report

**Checks Performed:**
- Missing characters
- Duplicate entries
- Invalid IPA symbols
- Inconsistent tone values

**Report:**
- List of issues with locations
- Suggestions for fixes
- Export report as Excel

### Table Merging (字表合并)

**Purpose:** Combine multiple dialect datasets.

**Access:** `/explore?tab=merge`

**Steps:**
1. Upload multiple Excel files
2. Select merge strategy:
   - **Union** - Combine all data
   - **Intersection** - Only common characters
   - **Left Join** - Keep all from first table
3. Configure column mapping
4. Click **"合并"**
5. Download merged table

**Use Cases:**
- Combine fieldwork data
- Merge historical datasets
- Create comprehensive databases

### Jyutping to IPA Conversion (粤拼转IPA)

**Purpose:** Convert Cantonese romanization to IPA.

**Access:** `/explore?tab=jyut2ipa`

**Steps:**
1. Enter Jyutping text
   - Example: `nei5 hou2`
2. Click **"转换"**
3. View IPA output
   - Example: `nei˩˧ hou˧˥`

**Batch Conversion:**
- Upload Excel file with Jyutping column
- Select column to convert
- Download file with IPA column added

---

## User Account

### Registration

1. Click **"登录/注册"** in top-right corner
2. Click **"注册"** tab
3. Enter username, email, password
4. Click **"注册"**
5. Verify email (if required)

### Login

1. Click **"登录/注册"**
2. Enter username and password
3. Click **"登录"**

### User Settings

**Access:** `/menu?tab=setting`

**Settings Available:**
- **Profile** - Update username, email
- **Password** - Change password
- **Preferences** - UI language, theme
- **API Keys** - Generate API keys for programmatic access
- **Data Export** - Download all your custom data

### Custom Data Management

**Viewing Custom Data:**
1. Navigate to Settings tab
2. Click **"自定义数据"** section
3. View list of your annotations

**Editing Custom Data:**
1. Click **"编辑"** button on data row
2. Modify label or notes
3. Click **"保存"**

**Deleting Custom Data:**
1. Click **"删除"** button on data row
2. Confirm deletion

---

## Tips & Best Practices

### Query Tips

1. **Start Specific** - Begin with specific locations, then expand
2. **Use Regions** - For broad queries, use regions instead of individual locations
3. **Limit Characters** - Query 5-10 characters at a time for better performance
4. **Save Results** - Export important results to Excel for offline analysis

### Map Tips

1. **Clustering** - Zoom in to see individual markers in dense areas
2. **Color Legend** - Check legend to understand color coding
3. **Custom Annotations** - Use custom mode to mark interesting patterns
4. **Export Early** - Export map data before running new queries

### Analysis Tips

1. **Progressive Loading** - Large matrices load progressively, wait for completion
2. **Compare Systematically** - Use syllable counting to compare multiple locations
3. **Document Settings** - Note Praat settings used for reproducibility
4. **Validate Data** - Run character table validation before analysis

### Performance Tips

1. **Clear Cache** - Clear browser cache if experiencing slowness
2. **Limit Locations** - Query fewer locations for faster results
3. **Use Pagination** - Navigate large result sets with pagination
4. **Close Unused Tabs** - Close other browser tabs to free memory

---

## FAQ

### General Questions

**Q: Is the platform free to use?**
A: Yes, the platform is free. Registration provides extended features.

**Q: Can I use the platform on mobile?**
A: Yes, the platform is responsive and works on mobile browsers.

**Q: How often is the data updated?**
A: Data is updated periodically based on new research and fieldwork.

### Query Questions

**Q: Why are my query results empty?**
A: Check that:
- Locations are spelled correctly
- Characters exist in the database
- You have sufficient permissions (register for more access)

**Q: What's the difference between locations and regions?**
A: Locations are specific dialect points (e.g., 广州). Regions are groups of locations (e.g., 粤语区).

**Q: Can I query multiple characters at once?**
A: Yes, enter multiple characters in the input field (e.g., 你好世界).

### Map Questions

**Q: Why aren't markers showing on the map?**
A: Ensure:
- Query returned results
- Internet connection is active (for map tiles)
- Browser supports WebGL

**Q: How do I change marker colors?**
A: Colors are automatically assigned based on phonological features. Use custom mode to manually set colors.

### Analysis Questions

**Q: Why is the phonology matrix loading slowly?**
A: Large matrices (6,400+ cells) use progressive rendering. First 15 rows appear instantly, rest loads gradually.

**Q: Can I export analysis results?**
A: Yes, all analysis tools support Excel export.

### Audio Analysis Questions

**Q: What audio formats are supported?**
A: WAV (recommended) and MP3. Sample rate should be 16kHz-48kHz.

**Q: How long does analysis take?**
A: Depends on file length. Typically 1-2 minutes for a 30-second file.

**Q: Can I analyze multiple files at once?**
A: Currently, files are analyzed one at a time. Batch analysis coming soon.

### Account Questions

**Q: I forgot my password. How do I reset it?**
A: Click "忘记密码" on login page and follow instructions.

**Q: Can I delete my account?**
A: Yes, contact support or use the account deletion option in settings.

**Q: How do I upgrade to admin?**
A: Admin access is granted by system administrators for research purposes.

---

## Getting Help

**Documentation:**
- [Architecture Guide](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Design System](./DESIGN_SYSTEM.md)

**Support:**
- **Email:** [Contact Email]
- **GitHub Issues:** [Issues URL]
- **Live Demo:** [https://dialects.yzup.top](https://dialects.yzup.top)

---

**Happy researching! 🎓**