// api/index.js - 全局统一导出所有 API 模块
// 这个文件提供了一站式导入，方便组件使用

// ==================== 认证与核心 ====================
// Export all auth functions from the auth module
export * from './auth/index.js';

// ==================== Praat 音频分析 ====================
export { useClusterApi, praat, usePraatApi } from './main/tools/index.js';

// ==================== 工具模块 ====================
// 字表合并工具
export {
  uploadReference,
  uploadFiles,
  executeMerge,
  getMergeProgress,
  downloadMerge,
} from './main/tools/merge.js';

// 字表检查工具
export {
  uploadCheckFile,
  analyzeFile,
  getToneStats,
  getTableData,
  updateRow,
  batchDelete,
  executeBatchOperation,
  downloadCheckResult,
} from './main/tools/check.js';

// 粤拼转IPA工具
export {
  uploadJyutFile,
  processJyut2Ipa,
  getJyut2IpaProgress,
  downloadJyut2IpaResult,
} from './main/tools/jyut2ipa.js';

// ==================== SQL 操作 ====================
// SQL查询
export { sqlQuery, distinctQuery, getTableColumns, queryCount } from './main/sql/query.js';

// SQL修改
export {
  mutateSingleRow,
  batchMutate,
  batchReplacePreview,
  batchReplaceExecute,
} from './main/sql/mutate.js';

// 树形数据
export { lazyLoadTree, loadFullTree } from './main/sql/tree.js';

// ==================== Yubao 语保业务接口 ====================
export {
  getYubaoVocabularyWords,
  getYubaoGrammarSentences,
  getYubaoVocabularyItems,
  getYubaoGrammarItems,
} from './main/yubao.js';

// ==================== 词表业务接口 ====================
export {
  buildVocabularyItemsPath,
  buildVocabularyMapPointsPath,
  getVocabularyItems,
  getVocabularyMapPoints,
  getVocabularyLocationNames,
  getVocabularyLocations,
  getVocabularyLogs,
  updateVocabularyLocation,
  uploadVocabulary,
  vocabularySqlApi,
} from './main/vocabulary.js';

// ==================== 查询模块 ====================
// 核心查询
export {
  searchZhongGu,
  searchYinWei,
  searchChars,
  searchTones,
  getCharList,
  getFeatureCounts,
  getFeatureStats,
} from './main/core/query.js';

// 地点查询
export {
  getLocations,
  getLocationDetail,
  getLocationPartitions,
  batchMatch,
  getPartitions,
  getRegions,
} from './main/geo/LocationAndRegion.js';

// 地理数据查询
export { getCoordinates } from './main/geo/geo.js';

// 音系查询
export {
  getPhonologyMatrix,
  getPhonologyClassificationMatrix,
  queryPhonology,
} from './main/core/phonology.js';

export { postPhoPieByValue, postPhoPieByStatus } from './main/core/phoPie.js';

// ==================== 自然村地名 ====================
export {
  getToponymNames,
  getToponymPoints,
  getToponymOfficialDetail,
  getToponymDetails,
} from './main/toponyms.js';

// ==================== 比较模块 ====================
export { compareChars, compareZhongGu, compareTones } from './main/core/compare.js';

// ==================== 用户数据 ====================
export {
  getAllCustomData,
  editCustomData,
  batchCreateCustomData,
  batchDeleteCustomData,
} from './main/user/custom-data.js';

export {
  getCustomData,
  getCustomFeature,
  submitCustomForm,
  deleteCustomForm,
  getCustomCounts,
} from './main/user/custom.js';

export {
  getUserPoints,
  getUserFeatures,
  getDataByPoint,
  getDataByFeature,
} from './main/user/custom-entry.js';

// 自定義分區
export {
  getCustomRegions,
  createOrUpdateCustomRegion,
  deleteCustomRegion,
} from './main/user/custom-regions.js';

// ==================== 日志统计 ====================
export { getTodayVisits, getTotalVisits, getVisitHistory } from './logs/visits.js';

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
  fetchSubsetFilter,
  // 字頻統計
  getGlobalCharFrequency,
  getCharTendency,
  getRegionalCharFrequency,
  getCharTendencyByChar,
  getCharEmbeddingsList,
  getCharEmbeddingVector,
  getCharSimilarities,
  fetchCharacterNetwork,
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
  // 語義子類別 (Phase 17)
  getSemanticSubcategoryList,
  getSemanticSubcategoryChars,
  getSemanticSubcategoryVTFGlobal,
  getSemanticSubcategoryVTFRegional,
  getSemanticSubcategoryTendencyTop,
  getSemanticSubcategoryComparison,
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
  getSpatialClustersAvailableRuns,
  getSpatialClustersSummary,
  getSpatialIntegration,
  getSpatialIntegrationByChar,
  getSpatialIntegrationByCluster,
  getSpatialIntegrationSummary,
  getSpatialIntegrationAvailableCharacters,
  getSpatialIntegrationClusterList,
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
  compareRegionalVectors,
  batchCompareRegionalVectors,
  reduceRegionalVectors,
  // 計算模塊
  extractFeatures,
  aggregateFeatures,
  clusterSubset,
  compareSubsets,
  // 元數據
  getMetadataOverview,
  getMetadataTables,
  getNgramStatistics,
  getDatabaseStatistics,
  // 區域相似度 (Phase 15)
  getRegionSimilaritySearch,
  getRegionSimilarityPair,
  getRegionSimilarityMatrix,
  //聚类
  runCharacterTendencyClustering,
  runSampledVillagesClustering,
  runSpatialAwareClustering,
  runHierarchicalClustering,
  getSpatialRunIds,
} from './villagesML/index.js';
