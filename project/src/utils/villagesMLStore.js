// utils/villagesMLStore.js
// VillagesML 狀態管理

import { reactive } from 'vue'

export const villagesMLStore = reactive({
  // 當前激活的標籤頁
  activeTab: 'search',

  // 村名搜尋相關
  searchKeyword: '',
  searchFilters: {
    city: '',
    county: '',
    township: ''
  },
  searchResults: [],
  searchTotal: 0,
  searchPage: 1,
  searchPageSize: 20,
  selectedVillage: null,

  // 區域分析相關
  regionLevel: 'city',
  regionName: '',
  tendencyData: [],
  charFrequencyData: [],

  // 聚類分析相關
  clusteringSettings: {
    algorithm: 'kmeans',
    k: 5,
    region_level: 'city',
    region_filter: null,
    features: {
      use_semantic: true,
      use_morphology: true,
      use_diversity: true,
      top_n_suffix2: 100,
      top_n_suffix3: 100
    },
    preprocessing: {
      use_pca: true,
      pca_n_components: 50,
      standardize: true
    },
    dbscan_config: {
      eps: null,  // null 表示使用后端自动调整
      min_samples: null
    },
    random_state: 42
  },
  clusteringResults: null,
  clusteringLoading: false,
  clusteringProgress: 0,

  // 新增：聚類類型選擇
  clusteringType: 'clustering',  // 默認為基礎聚類

  // 新增：字符傾向性聚類設置
  characterTendencySettings: {
    algorithm: 'kmeans',
    k: 3,
    region_level: 'city',
    region_filter: null,
    top_n_chars: 50,
    tendency_metric: 'z_score',
    preprocessing: {
      use_pca: true,
      pca_n_components: 20,
      standardize: true
    },
    dbscan_config: {
      eps: null,
      min_samples: null
    },
    random_state: 42
  },

  // 新增：採樣村莊聚類設置
  sampledVillagesSettings: {
    algorithm: 'kmeans',
    k: 5,
    sampling_strategy: 'stratified',
    sample_size: 5000,
    filter: {},
    features: {
      use_semantic: true,
      use_morphology: true,
      use_diversity: true,
      top_n_suffix2: 100,
      top_n_suffix3: 100
    },
    preprocessing: {
      use_pca: true,
      pca_n_components: 50,
      standardize: true
    },
    dbscan_config: {
      eps: null,
      min_samples: null
    },
    random_state: 42
  },

  // 新增：空間感知聚類設置
  spatialAwareSettings: {
    algorithm: 'kmeans',
    k: 5,
    spatial_run_id: 'spatial_hdbscan_v1',
    features: {
      use_semantic_profile: true,
      use_naming_patterns: true,
      use_geographic: true,
      use_cluster_size: true
    },
    preprocessing: {
      use_pca: true,
      pca_n_components: 50,
      standardize: true
    },
    random_state: 42
  },

  // 新增：層次聚類設置
  hierarchicalSettings: {
    algorithm: 'kmeans',
    k_city: 3,
    k_county: 5,
    k_township: 10,
    features: {
      use_semantic: true,
      use_morphology: true,
      use_diversity: true,
      top_n_suffix2: 100,
      top_n_suffix3: 100
    },
    preprocessing: {
      use_pca: true,
      pca_n_components: 50,
      standardize: true
    },
    random_state: 42
  },

  // 語義網絡相關
  semanticSettings: {
    region_level: 'county',
    region_name: '',
    city: '',
    county: '',
    township: '',
    min_edge_weight: 0.5,
    centrality_metrics: ['degree', 'betweenness']
  },
  semanticNetwork: null,
  semanticLoading: false,

  // 全局載入狀態
  loading: false,
  error: null
})

// 重置搜尋狀態
export function resetSearchState() {
  villagesMLStore.searchKeyword = ''
  villagesMLStore.searchFilters = { city: '', county: '', township: '' }
  villagesMLStore.searchResults = []
  villagesMLStore.searchTotal = 0
  villagesMLStore.searchPage = 1
  villagesMLStore.selectedVillage = null
}

// 重置聚類狀態
export function resetClusteringState() {
  villagesMLStore.clusteringResults = null
  villagesMLStore.clusteringLoading = false
  villagesMLStore.clusteringProgress = 0
}

// 重置語義網絡狀態
export function resetSemanticState() {
  villagesMLStore.semanticNetwork = null
  villagesMLStore.semanticLoading = false
}
