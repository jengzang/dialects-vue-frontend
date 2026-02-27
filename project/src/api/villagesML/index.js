// api/villagesML/index.js
// VillagesML API 中央導出

// 村名搜尋
export {
  searchVillages,
  getVillageDetail,
  getRegionList,
  getVillageComplete,
  getVillageFeatures,
  getVillageSpatialFeatures,
  getVillageSemanticStructure,
  getVillageNgrams
} from './villages.js'

// 字頻統計
export {
  getGlobalCharFrequency,
  getCharTendency,
  getRegionalCharFrequency,
  getCharTendencyByChar,
  getCharEmbeddingsList,
  getCharEmbeddingVector,
  getCharSimilarities,
  getCharSignificanceByChar,
  getCharSignificanceByRegion,
  getCharSignificanceSummary
} from './characters.js'

// 聚類分析
export {
  runClustering,
  scanClustering,
  getClusteringStatus,
  getClusteringCacheStats,
  clearClusteringCache
} from './clustering.js'

// 語義網絡
export {
  getCooccurrence,
  getSemanticNetwork,
  getSemanticNetworkStatus
} from './semantic.js'

// 語義類別
export {
  getSemanticCategoryList,
  getSemanticCategoryTendency,
  getSemanticVTFGlobal,
  getSemanticVTFRegional,
  // 子類別 API (Phase 17)
  getSemanticSubcategoryList,
  getSemanticSubcategoryChars,
  getSemanticSubcategoryVTFGlobal,
  getSemanticSubcategoryVTFRegional,
  getSemanticSubcategoryTendencyTop,
  getSemanticSubcategoryComparison
} from './semanticCategories.js'

// 語義標籤
export {
  getSemanticLabelCategories,
  getSemanticLabelsByCategory,
  getSemanticLabelsByChar,
  getSemanticCompositionPatterns,
  getSemanticBigrams
} from './semanticLabels.js'

// 語義組合
export {
  getSemanticTrigrams,
  getSemanticPMI,
  getSemanticIndices
} from './semanticComposition.js'

// 空間分析
export {
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
  getSpatialIntegrationClusterList
} from './spatial.js'

// N-grams
export {
  getNgramFrequency,
  getNgramPatterns,
  getNgramRegional,
  getNgramTendency,
  getNgramSignificance
} from './ngrams.js'

// 結構模式
export {
  getPatternFrequencyGlobal,
  getPatternFrequencyRegional,
  getPatternStructural,
  getPatternTendency
} from './patterns.js'

// 區域聚合
export {
  getRegionalAggregatesCity,
  getRegionalAggregatesCounty,
  getRegionalAggregatesTown,
  getRegionalSpatialAggregates,
  getRegionalVectors
} from './regional.js'

// 計算模塊
export {
  extractFeatures,
  aggregateFeatures,
  clusterSubset,
  compareSubsets
} from './compute.js'

// 元數據
export {
  getMetadataOverview,
  getMetadataTables,
  getNgramStatistics,
  getDatabaseStatistics
} from './metadata.js'

// 區域相似度 (Phase 15)
export {
  getRegionSimilaritySearch,
  getRegionSimilarityPair,
  getRegionSimilarityMatrix
} from './regionSimilarity.js'
