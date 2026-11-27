import maplibregl from 'maplibre-gl';
import { getCurrentRuntimePlatform } from '@/platform/runtime.js';
import { registerMapTileCacheProtocol, wrapTileUrlWithCacheProtocol } from './tileCache.js';

// 统一的地图服务 API Key 配置
// 天地图：三端默认优先使用 primary；单瓦片请求失败或无有效返回时，按平台自动回退到 fallback（web / native）
const MAP_API_KEYS = {
    tianditu: {
        primary: '9a516b0f2a8179bb68f73172cff4bd22',
        fallback: {
            web: '938f67853b2e094b47c97b5e6c8f5af7',
            native: 'd487273f17220e08e5a97805e5b710ea',
        },
    },
    maptiler: {
        web: 'HSnYXzpfPRlVp7fkOywW',
        native: 'HSnYXzpfPRlVp7fkOywW',
    },
    thunderforest: {
        web: 'a5dd6a2f1c934394bce6b0fb077203eb',
        native: 'a5dd6a2f1c934394bce6b0fb077203eb',
    },
};

const isNativeRuntime = () => getCurrentRuntimePlatform().container === 'native-webview';

const resolveMapApiKey = (provider) => {
    const keys = MAP_API_KEYS[provider];
    if (!keys) return '';
    return isNativeRuntime() ? (keys.native || keys.web) : (keys.web || keys.native);
};

const resolveTiandituFallbackKey = () => {
    const fallback = MAP_API_KEYS.tianditu.fallback;
    return isNativeRuntime() ? (fallback.native || fallback.web) : (fallback.web || fallback.native);
};

export const resolveTiandituFallbackUrl = (rawUrl) => {
    if (typeof rawUrl !== 'string' || !rawUrl.includes('tianditu.gov.cn')) return null;
    const primary = MAP_API_KEYS.tianditu.primary;
    const fallbackKey = resolveTiandituFallbackKey();
    if (!fallbackKey || fallbackKey === primary) return null;
    const primaryToken = `tk=${primary}`;
    if (!rawUrl.includes(primaryToken)) return null;
    return rawUrl.replace(primaryToken, `tk=${fallbackKey}`);
};

const buildTiandituWmtsUrl = (layer) =>
    `https://t0.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${MAP_API_KEYS.tianditu.primary}`;

// 统一的地图样式配置
const mapStyleConfigData = {

    tianditu: {
        name: '天地图',
        custom: true,
        tiles: () => [buildTiandituWmtsUrl('vec')],
        labelTiles: () => [buildTiandituWmtsUrl('cva')],
    },

    tianditu_img: {
        name: '天地图卫星图',
        custom: true,
        tiles: () => [buildTiandituWmtsUrl('img')],
        labelTiles: () => [buildTiandituWmtsUrl('cia')],
    },

    // 高德地图服务
    gaode: {
        name: '高德地图',
        custom: true,
        tiles: [
            'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}', // 路网图
        ],
    },
    gaode_satellite: {
        name: '高德卫星图',
        custom: true,
        tiles: [
            'http://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', // 卫星图
        ],
    },

    // MapTiler 地图服务
    maptiler: {
        name: 'MapTiler街道图',
        custom: false,
        url: () => `https://api.maptiler.com/maps/streets-v2/style.json?key=${resolveMapApiKey('maptiler')}`,
    },
    maptiler_basic: {
        name: 'MapTiler基础图',
        custom: false,
        url: () => `https://api.maptiler.com/maps/basic-v2/style.json?key=${resolveMapApiKey('maptiler')}`,
    },
    maptiler_landscape: {
        name: 'MapTiler地形图',
        custom: false,
        url: () => `https://api.maptiler.com/maps/landscape/style.json?key=${resolveMapApiKey('maptiler')}`,
    },
    maptiler_streets: {
        name: 'MapTiler经典街道',
        custom: false,
        url: () => `https://api.maptiler.com/maps/streets/style.json?key=${resolveMapApiKey('maptiler')}`,
    },

    // Stadia Maps 地图服务
    stadiamaps: {
        name: 'Stadia Maps',
        custom: false,
        url: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
    },

    // ArcGIS 地图服务
    arcgis: {
        name: 'ArcGIS街道图',
        custom: true,
        tiles: [
            'https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', // 街道图
        ],
    },
    arcgis_light_gray: {
        name: 'ArcGIS灰底图',
        custom: true,
        tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/WMTS/tile/6.0.0/Canvas_World_Light_Gray_Base/default/default028mm/{z}/{y}/{x}/', // 灰底图
        ],
    },
    arcgis_dark_gray: {
        name: 'ArcGIS暗黑图',
        custom: true,
        tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/WMTS/tile/6.0.0/Canvas_World_Dark_Gray_Base/default/default028mm/{z}/{y}/{x}/', // 暗黑图
        ],
    },
    arcgis_natgeo: {
        name: 'ArcGIS自然地理',
        custom: true,
        tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', // 自然地理图
        ],
    },
    arcgis_satellite: {
        name: 'ArcGIS卫星图',
        custom: true,
        tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', // 卫星图
        ],
    },

    // 其他地图服务
    opentopomap: {
        name: 'OpenTopoMap地形图',
        custom: true,
        tiles: [
            'https://c.tile.opentopomap.org/{z}/{x}/{y}.png', // 等高线地形图
        ],
    },
    thunderforest_cycle: {
        name: 'OpenCycle地形图',
        custom: true,
        tiles: () => [
            `http://a.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${resolveMapApiKey('thunderforest')}`, // OpenCycle地形图
        ],
    },
};

// 导出用于UI显示的配置
export const mapStyleConfig = Object.fromEntries(
    Object.entries(mapStyleConfigData).map(([key, config]) => [key, config.name])
);

const resolveConfigValue = (value) => (typeof value === 'function' ? value() : value);

export const mapStyle = (name) => {
    const config = mapStyleConfigData[name];

    if (!config.custom) {
        return resolveConfigValue(config.url);
    }

    const useTileCache = registerMapTileCacheProtocol(maplibregl, {
        getFallbackUrl: resolveTiandituFallbackUrl,
    });
    const resolveTileUrls = (tiles) => {
        const list = resolveConfigValue(tiles);
        return useTileCache ? list.map((url) => wrapTileUrlWithCacheProtocol(url)) : list;
    };

    const sources = {
        [name]: {
            type: 'raster',
            tiles: resolveTileUrls(config.tiles),
            tileSize: 256,
            maxzoom: 18,
            minzoom: 0,
        }
    };

    const layers = [
        {
            id: `${name}-layer`,
            type: 'raster',
            source: name,
            paint: {
                'raster-opacity': 1,
            },
        }
    ];

    // 如果还有独立标注层
    if (config.labelTiles) {
        const labelSourceName = `${name}-label`;

        sources[labelSourceName] = {
            type: 'raster',
            tiles: resolveTileUrls(config.labelTiles),
            tileSize: 256,
            maxzoom: 18,
            minzoom: 0,
        };

        layers.push({
            id: `${name}-label-layer`,
            type: 'raster',
            source: labelSourceName,
            paint: {
                'raster-opacity': 1,
            },
        });
    }

    return {
        version: 8,
        name,
        sources,
        layers,
    };
};

export function calculateDenseMapCenterAndZoom(coords, densityPercentile = 0.85) {
    return calculateMapCenterAndZoom(coords, { densityPercentile });
}

export function calculateMapCenterAndZoom(coords, options = {}) {
    const {
        densityPercentile = 0.85
    } = options;

    // 输入验证
    if (!Array.isArray(coords) || coords.length === 0) {
        throw new Error('坐标数组不能为空');
    }

    if (typeof densityPercentile !== 'number' || Number.isNaN(densityPercentile) || densityPercentile <= 0 || densityPercentile > 1) {
        throw new Error('densityPercentile 必须是 (0, 1] 范围内的数字');
    }

    // 验证坐标格式和有效性
    const validCoords = coords.filter(coord => {
        return Array.isArray(coord) &&
            coord.length === 2 &&
            typeof coord[0] === 'number' &&
            typeof coord[1] === 'number' &&
            coord[1] >= -90 && coord[1] <= 90 && // 纬度范围
            coord[0] >= -180 && coord[0] <= 180; // 经度范围
    });

    if (validCoords.length === 0) {
        throw new Error('没有有效的坐标数据');
    }

    // 处理单点情况
    if (validCoords.length === 1) {
        const [lng, lat] = validCoords[0];
        return {
            center: [lng, lat],
            zoom: 15
        };
    }

    // 分离经度和纬度（输入格式统一按 [lng, lat] 处理）
    const lngs = validCoords.map(coord => coord[0]);
    const lats = validCoords.map(coord => coord[1]);

    // 计算核心区域边界（使用百分位数排除离群点）
    const lngRange = getPercentileRange(lngs, densityPercentile);
    const latRange = getPercentileRange(lats, densityPercentile);

    // 计算核心区域中心点
    const center = [
        (lngRange.min + lngRange.max) / 2,
        (latRange.min + latRange.max) / 2
    ];

    // 计算核心区域的大小（度数）
    const latSpan = latRange.max - latRange.min;
    const lngSpan = lngRange.max - lngRange.min;

    // 计算缩放级别 - 基于核心区域大小
    const zoom = calculateZoomFromSpan(latSpan, lngSpan, center[1]);

    return {
        center,
        zoom: Math.min(Math.max(zoom, 3), 20) // 限制在3-20的合理范围
    };
}

// 辅助函数：计算数值范围的百分位数范围
function getPercentileRange(values, percentile) {
    // 创建副本并排序
    const sorted = [...values].sort((a, b) => a - b);

    // 处理小数据集的情况
    if (sorted.length <= 2) {
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1]
        };
    }

    // 计算排除的百分比
    const exclude = (1 - percentile) / 2;
    const lowIndex = Math.max(0, Math.floor(sorted.length * exclude));
    const highIndex = Math.min(sorted.length - 1, Math.ceil(sorted.length * (1 - exclude)));

    return {
        min: sorted[lowIndex],
        max: sorted[highIndex]
    };
}

// 辅助函数：根据区域大小计算缩放级别
function calculateZoomFromSpan(latSpan, lngSpan, centerLat) {
    // 地球周长参考值（米）
    const EARTH_CIRCUMFERENCE = 40075000;

    // 纬度跨度转换为米（固定值）
    const latSpanMeters = latSpan * (EARTH_CIRCUMFERENCE / 360);

    // 经度跨度转换为米（考虑纬度影响）
    const lngSpanMeters = Math.abs(lngSpan) *
        (EARTH_CIRCUMFERENCE / 360) *
        Math.cos(centerLat * Math.PI / 180);

    // 取较大跨度作为基准
    const maxSpanMeters = Math.max(latSpanMeters, lngSpanMeters);

    // 经验公式计算缩放级别（基于256px瓦片）
    const zoom = Math.log2(EARTH_CIRCUMFERENCE / (maxSpanMeters * 1.5));

    return Math.round(zoom);
}