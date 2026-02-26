// 语义词典数据
// v4.0.0-hybrid: 详细的子类别
// v1.0.0: 9个主类别

export const SEMANTIC_LEXICON_V4 = {
  version: "4.0.0-hybrid",
  created_at: "2026-02-25",
  description: "Hybrid semantic lexicon combining LLM validation and v3 expertise",
  subcategories: {
    // 數字類
    number_small: ["一", "三", "二", "五", "四"],
    number_large: ["七", "九", "八", "六", "十"],
    number_ordinal: ["初", "第", "老"],

    // 方位類
    direction_vertical: ["上", "下", "低"],
    direction_cardinal: ["东", "北", "南", "西"],
    direction_inside: ["中", "内", "里"],
    direction_outside: ["侧", "外", "旁", "边"],
    direction_opening: ["关", "口", "门"],
    direction_horizontal: ["前", "右", "后", "左"],
    direction_center: ["央", "心"],
    direction_end: ["头", "尾", "端", "角"],

    // 象徵類
    symbolic_virtue: ["义", "仁", "信", "圣", "德", "文", "智", "礼", "贤"],
    symbolic_religion: ["仙", "佛", "堂", "宫", "寺", "庙", "灵", "神", "观"],
    symbolic_light: ["光", "明", "朗", "耀", "辉"],
    symbolic_prosperity: ["兴", "华", "富", "昌", "盛", "荣", "贵"],
    symbolic_animal: ["凤", "虎", "鹤", "鹿", "麟", "龙", "龟"],
    symbolic_fortune: ["吉", "喜", "寿", "瑞", "祥", "禄", "福"],
    symbolic_peace: ["和", "宁", "安", "康", "泰"],
    symbolic_treasure: ["宝", "玉", "珍"],

    // 水系類
    water_spring: ["井", "泉"],
    water_stream: ["圳", "沟", "沥", "涌"],
    water_pond: ["塘", "池", "泊", "淀", "潭"],
    water_island: ["屿", "岛", "洲"],
    water_shore: ["岸", "汀", "沿", "渚", "滨"],
    water_river: ["川", "江", "河", "涧", "溪"],
    water_beach: ["沙", "滩"],
    water_lake: ["泽", "洼", "湖"],
    water_port: ["津", "港"],
    water_bay: ["浦", "湾", "滘", "濠"],

    // 基建類
    infrastructure_station: ["亭", "站", "驿"],
    infrastructure_port: ["埠", "渡", "码"],
    infrastructure_road: ["巷", "街", "路", "道"],
    infrastructure_bridge: ["桥"],
    infrastructure_transport: ["车", "铁", "隧"],

    // 時間類
    time: ["今", "冬", "古", "夏", "新", "旧", "春", "晚", "朝", "秋"],

    // 農業類
    agriculture_storage: ["仓", "廪"],
    agriculture_activity: ["农", "牧", "畜", "耕"],
    agriculture_garden: ["园", "圃", "场"],
    agriculture_field: ["地", "田", "畔", "畲", "畴"],
    agriculture_irrigation: ["坝", "堤", "渠"],
    agriculture_crop: ["禾", "稻", "谷", "麦"],

    // 宗族類
    clan_he: ["何"],
    clan_other: ["冯", "卢", "叶", "周", "唐", "徐", "戴", "曹", "曾", "朱", "杨", "欧", "潘", "苏", "萧", "蔡", "袁", "许", "谢", "赖", "邓", "邱", "郑", "郭", "钟", "高"],
    clan_liu: ["刘"],
    clan_wu: ["吴", "武"],
    clan_zhang: ["张"],
    clan_li: ["李"],
    clan_liang: ["梁"],
    clan_luo: ["罗"],
    clan_chen: ["陈"],
    clan_huang: ["黄"],

    // 山地類
    mountain_slope: ["冈", "坎", "坡", "坳", "岗"],
    mountain_plateau: ["台", "坪", "塱"],
    mountain_valley: ["坑", "峒", "峡", "峪"],
    mountain_rock: ["壁", "岩", "崖", "石"],
    mountain_peak: ["山", "岭", "峰", "巅", "顶"],
    mountain_ridge: ["岐", "峦", "嶂", "脊"],

    // 聚落類
    settlement_district: ["围", "坊"],
    settlement_market: ["圩", "墟", "市", "集"],
    settlement_fort: ["城", "堡", "寨"],
    settlement_village: ["塆", "屯", "庄", "村"],
    settlement_building: ["宅", "屋", "楼", "祠"],
    settlement_group: ["片", "社", "组", "队"],

    // 形狀類
    shape: ["圆", "尖", "平", "扁", "方", "曲", "直"],

    // 尺寸類
    size_large: ["大", "宽", "巨", "广"],
    size_small: ["小", "微", "细"],
    size_short: ["浅", "短", "近"],
    size_long: ["深", "远", "长"],

    // 植物類
    vegetation_forest: ["木", "林", "树", "森"],
    vegetation_pine: ["杉", "松", "柏"],
    vegetation_fruit: ["杏", "果", "桃", "梅", "榄", "蕉"],
    vegetation_other: ["枫", "柳", "桉", "桐", "榕", "槐", "樟", "草", "蔗", "藤"],
    vegetation_bamboo: ["竹", "笋"],
    vegetation_flower: ["花", "荷", "莲", "菊"],
    vegetation_tea: ["茶"],

    // 顏色類
    color: ["白", "紫", "红", "绿", "蓝", "金", "银", "青", "黑"]
  }
}

export const SEMANTIC_LEXICON_V1 = {
  version: "1.0.0",
  created_at: "2026-02-15",
  description: "Initial semantic lexicon for Guangdong village names - 9 semantic categories",
  categories: {
    mountain: ["山", "岭", "峰", "岗", "冈", "坡", "坳", "坑", "峒", "峪", "峦", "岩", "石", "崖", "台", "垄", "坝", "坪", "坜", "崇", "嶂", "峻", "岐", "顶", "脊", "塝", "壁", "丘", "陂", "塱", "坎", "岔", "峡", "峤", "岑", "岫", "屿", "屺", "屹"],
    water: ["江", "河", "溪", "涌", "沥", "港", "塘", "湖", "泉", "渠", "沟", "渡", "湾", "滩", "洲", "滨", "涧", "汀", "淀", "淤", "泊", "潭", "池", "圳", "洪", "潮", "浪", "津", "渚", "沿", "浦", "滘", "濠", "水"],
    settlement: ["围", "墟", "圩", "坊", "里", "巷", "街", "寨", "庄", "村", "社", "队", "组", "片", "屯", "堡", "屋", "楼", "堂", "祠", "埠", "市", "场", "塆", "宅"],
    direction: ["东", "西", "南", "北", "中", "上", "下", "前", "后", "内", "外", "左", "右", "旁", "侧", "边", "口", "尾", "头"],
    clan: ["陈", "李", "黄", "张", "刘", "林", "何", "梁", "罗", "吴", "周", "徐", "郑", "谢", "赖", "邓", "曾", "叶", "冯", "朱", "钟", "卢", "潘", "蔡", "郭", "邱", "苏", "曹", "高", "袁", "许", "唐", "戴", "萧", "欧"],
    symbolic: ["龙", "凤", "虎", "龟", "麟", "仙", "佛", "观", "寺", "庙", "堂", "宫", "神", "灵", "福", "禄", "寿", "吉", "祥", "瑞", "安", "泰", "昌", "兴", "盛", "荣", "华", "宝", "明", "光", "文", "武", "圣", "贤", "德", "信", "义"],
    agriculture: ["田", "地", "畔", "畴", "畲", "圃", "园", "畜", "牧", "禾", "稻", "谷", "仓", "堤", "农", "耕"],
    vegetation: ["林", "木", "树", "松", "竹", "梅", "花", "草", "茶", "果", "榕", "杉", "柏", "柳", "枫", "杨", "桐", "榄", "桃", "蕉", "荷", "藤", "蔗", "槐", "杏", "樟", "桉"],
    infrastructure: ["桥", "路", "站", "埠", "码", "车", "铁", "隧", "道", "驿"]
  }
}

// 主类别中文名称映射
export const CATEGORY_NAMES_ZH = {
  mountain: "山地",
  water: "水系",
  settlement: "聚落",
  direction: "方位",
  clan: "宗族",
  symbolic: "象徵",
  agriculture: "農業",
  vegetation: "植被",
  infrastructure: "基建"
}
