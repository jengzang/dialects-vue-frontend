# API Documentation

> Complete API reference for the 方音圖鑑 (Chinese Dialect Atlas) platform

---

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Query APIs](#query-apis)
4. [Phonology APIs](#phonology-apis)
5. [Praat Audio Analysis APIs](#praat-audio-analysis-apis)
6. [SQL Database APIs](#sql-database-apis)
7. [User Data APIs](#user-data-apis)
8. [Tool APIs](#tool-apis)
9. [Log APIs](#log-apis)
10. [Error Handling](#error-handling)

---

## Base Configuration

### API Base URL

```javascript
const BASE_URL = 'https://dialects.yzup.top/api'
```

### Environment Modes

- **Development:** `http://127.0.0.1:5000` (npm run dev)
- **Web mode:** `https://dialects.yzup.top` (npm run dev:web)
- **Production:** `https://dialects.yzup.top` (npm run build)

### Import Convention

Always import from the central API hub:

```javascript
import { searchChars, getLocations, sqlQuery } from '@/api'
```

---

## Authentication

### Login

**Function:** `login(username, password)`

**Endpoint:** `POST /auth/login`

**Request:**
```javascript
import { login } from '@/api'

const response = await login('username', 'password')
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "username",
    "role": "user"
  }
}
```

### Get Current User

**Function:** `getCurrentUser()`

**Endpoint:** `GET /auth/me`

**Request:**
```javascript
import { getCurrentUser } from '@/api'

const user = await getCurrentUser()
```

**Response:**
```json
{
  "id": 1,
  "username": "username",
  "role": "user",
  "email": "user@example.com"
}
```

### Logout

**Function:** `logout()`

**Endpoint:** `POST /auth/logout`

**Request:**
```javascript
import { logout } from '@/api'

await logout()
```

### Ensure Authenticated

**Function:** `ensureAuthenticated()`

**Purpose:** Check if user is authenticated before performing action

**Usage:**
```javascript
import { ensureAuthenticated } from '@/api'

try {
  await ensureAuthenticated()
  // User is authenticated, proceed
} catch (error) {
  // User not authenticated, show login prompt
}
```

---

## Query APIs

### Search by Characters

**Function:** `searchChars(payload)`

**Endpoint:** `POST /phonology`

**Request:**
```javascript
import { searchChars } from '@/api'

const results = await searchChars({
  chars: '你好',
  locations: ['广州', '深圳'],
  regions: [],
  region_mode: 'full'
})
```

**Payload:**
```typescript
{
  chars: string              // Chinese characters to search
  locations: string[]        // Location names
  regions: string[]          // Region names
  region_mode: 'full' | 'partial'  // Region matching mode
}
```

**Response:**
```json
[
  {
    "char": "你",
    "location": "广州",
    "pronunciation": "nei5",
    "ipa": "nei˩˧",
    "initial": "n",
    "final": "ei",
    "tone": "5",
    "notes": "..."
  }
]
```

### Search by Middle Chinese

**Function:** `searchZhongGu(payload)`

**Endpoint:** `POST /phonology`

**Request:**
```javascript
import { searchZhongGu } from '@/api'

const results = await searchZhongGu({
  path_strings: ['帮_东_平', '端_东_平'],
  locations: ['广州'],
  regions: [],
  features: ['声母', '韵母'],
  region_mode: 'full'
})
```

**Payload:**
```typescript
{
  path_strings: string[]     // Middle Chinese paths (initial_final_tone)
  locations: string[]        // Location names
  regions: string[]          // Region names
  features: string[]         // Features to return ('声母', '韵母', '调类')
  region_mode: 'full' | 'partial'
}
```

### Search by Phoneme

**Function:** `searchYinWei(payload)`

**Endpoint:** `POST /phonology`

**Request:**
```javascript
import { searchYinWei } from '@/api'

const results = await searchYinWei({
  group_inputs: ['声母组'],
  pho_values: ['p', 't', 'k'],
  locations: ['广州'],
  regions: [],
  features: ['声母'],
  region_mode: 'full'
})
```

**Payload:**
```typescript
{
  group_inputs: string[]     // Phoneme group names
  pho_values: string[]       // Phoneme values (IPA)
  locations: string[]        // Location names
  regions: string[]          // Region names
  features: string[]         // Features to return
  region_mode: 'full' | 'partial'
}
```

### Search by Tone

**Function:** `searchTones(payload)`

**Endpoint:** `POST /phonology`

**Request:**
```javascript
import { searchTones } from '@/api'

const results = await searchTones({
  locations: ['广州', '深圳'],
  regions: [],
  region_mode: 'full'
})
```

**Payload:**
```typescript
{
  locations: string[]        // Location names
  regions: string[]          // Region names
  region_mode: 'full' | 'partial'
}
```

**Response:**
```json
[
  {
    "location": "广州",
    "tone_category": "阴平",
    "tone_value": "55",
    "examples": ["诗", "天"]
  }
]
```

---

## Phonology APIs

### Get Phonology Matrix

**Function:** `getPhonologyMatrix(locations)`

**Endpoint:** `POST /phonology_matrix`

**Request:**
```javascript
import { getPhonologyMatrix } from '@/api'

const matrix = await getPhonologyMatrix(['广州'])
```

**Response:**
```json
[
  {
    "location": "广州",
    "initial": "p",
    "final": "a",
    "tone": "55",
    "syllable": "pa55",
    "examples": ["巴", "八"]
  }
]
```

### Query Phonology

**Function:** `queryPhonology(payload)`

**Endpoint:** `POST /phonology`

**Request:**
```javascript
import { queryPhonology } from '@/api'

const results = await queryPhonology({
  // Same as searchChars, searchZhongGu, etc.
})
```

### Get Phonology Classification Matrix

**Function:** `getPhonologyClassificationMatrix(payload)`

**Endpoint:** `POST /phonology_classification_matrix`

**Request:**
```javascript
import { getPhonologyClassificationMatrix } from '@/api'

const matrix = await getPhonologyClassificationMatrix({
  locations: ['广州'],
  feature: '声母',
  horizontal_column: '清浊',
  vertical_column: '部位',
  cell_row_column: '方式'
})
```

**Payload:**
```typescript
{
  locations: string[]        // Location names
  feature: string            // '声母' | '韵母' | '调类'
  horizontal_column: string  // Classification dimension
  vertical_column: string    // Classification dimension
  cell_row_column: string    // Classification dimension
}
```

### Get Feature Counts

**Function:** `getFeatureCounts(locations)`

**Endpoint:** `GET /feature_counts`

**Request:**
```javascript
import { getFeatureCounts } from '@/api'

const counts = await getFeatureCounts(['广州', '深圳'])
```

**Response:**
```json
{
  "广州": {
    "initials": 19,
    "finals": 53,
    "tones": 9,
    "syllables": 1024
  },
  "深圳": {
    "initials": 18,
    "finals": 51,
    "tones": 8,
    "syllables": 987
  }
}
```

---

## Praat Audio Analysis APIs

### Upload Audio

**Function:** `uploadAudio(file, mode)`

**Endpoint:** `POST /praat/upload`

**Request:**
```javascript
import { uploadAudio } from '@/api'

const formData = new FormData()
formData.append('file', audioFile)
formData.append('mode', 'single')  // 'single' | 'continuous'

const response = await uploadAudio(formData)
```

**Response:**
```json
{
  "job_id": "abc123",
  "filename": "audio.wav",
  "status": "pending"
}
```

### Start Analysis

**Function:** `startAnalysis(jobId, settings)`

**Endpoint:** `POST /praat/analyze`

**Request:**
```javascript
import { startAnalysis } from '@/api'

const result = await startAnalysis('abc123', {
  f0_min: 75,
  f0_max: 500,
  formant_ceiling: 5500,
  time_step: 0.01
})
```

**Settings:**
```typescript
{
  f0_min: number           // Minimum pitch (Hz)
  f0_max: number           // Maximum pitch (Hz)
  formant_ceiling: number  // Formant ceiling (Hz)
  time_step: number        // Time step (seconds)
}
```

### Get Analysis Status

**Function:** `getAnalysisStatus(jobId)`

**Endpoint:** `GET /praat/status/:jobId`

**Request:**
```javascript
import { getAnalysisStatus } from '@/api'

const status = await getAnalysisStatus('abc123')
```

**Response:**
```json
{
  "job_id": "abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "formants": [...],
    "pitch": [...],
    "intensity": [...]
  }
}
```

### Cancel Analysis

**Function:** `cancelAnalysis(jobId)`

**Endpoint:** `POST /praat/cancel/:jobId`

**Request:**
```javascript
import { cancelAnalysis } from '@/api'

await cancelAnalysis('abc123')
```

---

## SQL Database APIs

### Execute SQL Query

**Function:** `sqlQuery(sql, params)`

**Endpoint:** `POST /sql/query`

**Request:**
```javascript
import { sqlQuery } from '@/api'

const results = await sqlQuery(
  'SELECT * FROM phonology WHERE location = ?',
  ['广州']
)
```

**Response:**
```json
[
  {
    "id": 1,
    "char": "你",
    "location": "广州",
    "pronunciation": "nei5"
  }
]
```

### Distinct Query

**Function:** `distinctQuery(table, column, where)`

**Endpoint:** `POST /sql/distinct`

**Request:**
```javascript
import { distinctQuery } from '@/api'

const locations = await distinctQuery('phonology', 'location', {})
```

**Response:**
```json
["广州", "深圳", "香港", "澳门"]
```

### Mutate Single Row

**Function:** `mutateSingleRow(table, id, data)`

**Endpoint:** `POST /sql/mutate`

**Request:**
```javascript
import { mutateSingleRow } from '@/api'

await mutateSingleRow('phonology', 123, {
  pronunciation: 'nei5',
  notes: 'Updated pronunciation'
})
```

### Batch Mutate

**Function:** `batchMutate(table, operations)`

**Endpoint:** `POST /sql/batch`

**Request:**
```javascript
import { batchMutate } from '@/api'

await batchMutate('phonology', [
  { action: 'insert', data: { char: '你', location: '广州' } },
  { action: 'update', id: 123, data: { pronunciation: 'nei5' } },
  { action: 'delete', id: 456 }
])
```

### Lazy Load Tree

**Function:** `lazyLoadTree(parentId)`

**Endpoint:** `GET /sql/tree/lazy`

**Request:**
```javascript
import { lazyLoadTree } from '@/api'

const children = await lazyLoadTree(5)
```

### Load Full Tree

**Function:** `loadFullTree()`

**Endpoint:** `GET /sql/tree/full`

**Request:**
```javascript
import { loadFullTree } from '@/api'

const tree = await loadFullTree()
```

---

## User Data APIs

### Get Custom Data

**Function:** `getCustomData(userId)`

**Endpoint:** `GET /user/custom`

**Request:**
```javascript
import { getCustomData } from '@/api'

const customData = await getCustomData(1)
```

**Response:**
```json
[
  {
    "id": 1,
    "location": "广州",
    "label": "My custom marker",
    "notes": "Personal annotation",
    "created_at": "2026-02-19T10:00:00Z"
  }
]
```

### Submit Custom Form

**Function:** `submitCustomForm(data)`

**Endpoint:** `POST /user/custom`

**Request:**
```javascript
import { submitCustomForm } from '@/api'

await submitCustomForm({
  location: '广州',
  label: 'My marker',
  notes: 'My notes'
})
```

### Get All Custom Data

**Function:** `getAllCustomData()`

**Endpoint:** `GET /user/custom/all`

**Request:**
```javascript
import { getAllCustomData } from '@/api'

const allData = await getAllCustomData()
```

### Edit Custom Data

**Function:** `editCustomData(id, data)`

**Endpoint:** `PUT /user/custom/:id`

**Request:**
```javascript
import { editCustomData } from '@/api'

await editCustomData(1, {
  label: 'Updated label',
  notes: 'Updated notes'
})
```

### Delete Custom Data

**Function:** `deleteCustomData(id)`

**Endpoint:** `DELETE /user/custom/:id`

**Request:**
```javascript
import { deleteCustomData } from '@/api'

await deleteCustomData(1)
```

---

## Tool APIs

### Check Character Table

**Function:** `checkCharTable(data)`

**Endpoint:** `POST /tools/check`

**Request:**
```javascript
import { checkCharTable } from '@/api'

const report = await checkCharTable({
  chars: ['你', '好', '世', '界'],
  locations: ['广州', '深圳']
})
```

**Response:**
```json
{
  "missing": [
    { "char": "界", "location": "深圳" }
  ],
  "duplicates": [],
  "invalid": []
}
```

### Merge Tables

**Function:** `mergeTables(tables)`

**Endpoint:** `POST /tools/merge`

**Request:**
```javascript
import { mergeTables } from '@/api'

const merged = await mergeTables([
  { name: 'table1', data: [...] },
  { name: 'table2', data: [...] }
])
```

### Convert Jyutping to IPA

**Function:** `jyut2ipa(jyutping)`

**Endpoint:** `POST /tools/jyut2ipa`

**Request:**
```javascript
import { jyut2ipa } from '@/api'

const ipa = await jyut2ipa('nei5')
```

**Response:**
```json
{
  "jyutping": "nei5",
  "ipa": "nei˩˧"
}
```

---

## Log APIs

### Get Today's Visits

**Function:** `getTodayVisits()`

**Endpoint:** `GET /logs/visits/today`

**Request:**
```javascript
import { getTodayVisits } from '@/api'

const visits = await getTodayVisits()
```

**Response:**
```json
{
  "count": 1234,
  "date": "2026-02-19"
}
```

### Get Total Visits

**Function:** `getTotalVisits()`

**Endpoint:** `GET /logs/visits/total`

**Request:**
```javascript
import { getTotalVisits } from '@/api'

const visits = await getTotalVisits()
```

**Response:**
```json
{
  "count": 123456
}
```

---

## Error Handling

### Error Response Format

All API errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

### Error Handling Pattern

```javascript
import { searchChars, showError } from '@/api'

try {
  const results = await searchChars(payload)
  // Handle success
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    showError('请求过于频繁，请稍后再试')
  } else {
    showError(error.message)
  }
}
```

### Token Refresh

The API automatically handles token refresh:

```javascript
// If 401 response, automatically refresh token and retry
export async function api(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, options)

  if (response.status === 401) {
    await refreshToken()
    return api(endpoint, options)  // Retry
  }

  return response.json()
}
```

---

## Rate Limiting

### Limits by Role

- **Anonymous:** 10 requests/minute
- **User:** 60 requests/minute
- **Admin:** Unlimited

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1645286400
```

---

## Best Practices

1. **Always import from `@/api`** - Never import from subdirectories
2. **Use try-catch** - Always wrap API calls in try-catch blocks
3. **Show user feedback** - Use `showSuccess` and `showError` from `@/api`
4. **Check authentication** - Use `ensureAuthenticated()` before sensitive operations
5. **Handle rate limits** - Implement exponential backoff for retries
6. **Cache responses** - Use `resultCache` store for frequently accessed data
7. **Validate input** - Check payload before sending to API

---

## Example: Complete Query Flow

```javascript
import {
  searchChars,
  ensureAuthenticated,
  showSuccess,
  showError
} from '@/api'
import { globalPayload, resultCache } from '@/utils/store.js'

async function performQuery() {
  try {
    // Check authentication
    await ensureAuthenticated()

    // Prepare payload
    const payload = {
      chars: globalPayload.value.chars,
      locations: globalPayload.value.locations,
      regions: globalPayload.value.regions,
      region_mode: globalPayload.value.region_mode
    }

    // Execute query
    const results = await searchChars(payload)

    // Cache results
    resultCache.latestResults = results
    resultCache.mode = 'chars'

    // Show success
    showSuccess(`查询成功，共 ${results.length} 条结果`)

    return results
  } catch (error) {
    showError(error.message)
    throw error
  }
}
```

---

For more information, see:
- [Architecture Documentation](./ARCHITECTURE.md)
- [User Guide](./USER_GUIDE.md)
- [Contributing Guide](./CONTRIBUTING.md)