// api/index.js - 全局统一导出所有 API 模块
// 这个文件提供了一站式导入，方便组件使用

// ==================== 认证与核心 ====================
// Export all auth functions from the auth module
export * from './auth/index.js'

// ==================== Praat 音频分析 ====================
export {
  usePraatApi
} from './praat/index.js'

// ==================== 工具模块 ====================
// 字表合并工具
export {
  uploadReference,
  uploadFiles,
  executeMerge,
  getMergeProgress,
  downloadMerge
} from './tools/merge.js'

// 字表检查工具
export {
  uploadCheckFile,
  analyzeFile,
  getToneStats,
  getTableData,
  updateRow,
  batchDelete,
  executeBatchOperation,
  downloadCheckResult
} from './tools/check.js'

// 粤拼转IPA工具
export {
  uploadJyutFile,
  processJyut2Ipa,
  getJyut2IpaProgress,
  downloadJyut2IpaResult
} from './tools/jyut2ipa.js'

// ==================== SQL 操作 ====================
// SQL查询
export {
  sqlQuery,
  distinctQuery,
  getTableColumns
} from './sql/query.js'

// SQL修改
export {
  mutateSingleRow,
  batchMutate,
  batchReplacePreview,
  batchReplaceExecute
} from './sql/mutate.js'

// 树形数据
export {
  lazyLoadTree,
  loadFullTree
} from './sql/tree.js'

// ==================== 查询模块 ====================
// 核心查询
export {
  searchZhongGu,
  searchYinWei,
  searchChars,
  searchTones,
  getCharList,
  getFeatureCounts,
  getFeatureStats
} from './query/core.js'

// 地点查询
export {
  getLocations,
  batchMatch,
  getPartitions,
  getRegions
} from './query/LocationAndRegion.js'

// 地理数据查询
export {
  getCoordinates
} from './query/geo.js'

// 音系查询
export {
  getPhonologyMatrix,
  getPhonologyClassificationMatrix,
  queryPhonology
} from './query/phonology.js'


// ==================== 用户数据 ====================
export {
  getAllCustomData,
  editCustomData,
  batchCreateCustomData,
  batchDeleteCustomData
} from './user/custom-data.js'

export {
  getCustomData,
  getCustomFeature,
  submitCustomForm,
  deleteCustomForm
} from './user/custom.js'

// 自定義分區
export {
  getCustomRegions,
  createOrUpdateCustomRegion,
  deleteCustomRegion,
  clearCustomRegionsCache
} from './user/custom-regions.js'

// ==================== 日志统计 ====================
export {
  getTodayVisits,
  getTotalVisits,
  getVisitHistory
} from './logs/visits.js'

// ==================== URL 参数工具 ====================
export {
  decodeParams,
  buildQueryUrl,
  copyCurrentUrl,
  getUrlSegmentValue
} from './urlParams.js'

// ==================== VillagesML 自然村分析 ====================
export {
  // 村名搜尋
  searchVillages,
  getVillageDetail,
  getRegionList,
  getVillageComplete,
  getVillageFeatures,
  getVillageSpatialFeatures,
  getVillageSemanticStructure,
  getVillageNgrams,
  // 字頻統計
  getGlobalCharFrequency,
  getCharTendency,
  getRegionalCharFrequency,
  getCharTendencyByChar,
  getCharEmbeddingsList,
  getCharEmbeddingVector,
  getCharSimilarities,
  getCharSignificanceByChar,
  getCharSignificanceByRegion,
  getCharSignificanceSummary,
  // 聚類分析
  runClustering,
  scanClustering,
  getClusteringStatus,
  getClusteringCacheStats,
  clearClusteringCache,
  // 語義網絡
  getCooccurrence,
  getSemanticNetwork,
  getSemanticNetworkStatus,
  // 語義類別
  getSemanticCategoryList,
  getSemanticCategoryTendency,
  getSemanticVTFGlobal,
  getSemanticVTFRegional,
  // 語義標籤
  getSemanticLabelCategories,
  getSemanticLabelsByCategory,
  getSemanticLabelsByChar,
  getSemanticCompositionPatterns,
  getSemanticBigrams,
  // 語義組合
  getSemanticTrigrams,
  getSemanticPMI,
  getSemanticIndices,
  // 空間分析
  getSpatialHotspots,
  getSpatialHotspotDetail,
  getSpatialClusters,
  getSpatialClustersSummary,
  getSpatialIntegration,
  getSpatialIntegrationByChar,
  getSpatialIntegrationByCluster,
  getSpatialIntegrationSummary,
  // N-grams
  getNgramFrequency,
  getNgramPatterns,
  getNgramRegional,
  getNgramTendency,
  getNgramSignificance,
  // 結構模式
  getPatternFrequencyGlobal,
  getPatternFrequencyRegional,
  getPatternStructural,
  getPatternTendency,
  // 區域聚合
  getRegionalAggregatesCity,
  getRegionalAggregatesCounty,
  getRegionalAggregatesTown,
  getRegionalSpatialAggregates,
  getRegionalVectors,
  // 計算模塊
  extractFeatures,
  aggregateFeatures,
  clusterSubset,
  compareSubsets,
  // 元數據
  getMetadataOverview,
  getMetadataTables
} from './villagesML/index.js'
