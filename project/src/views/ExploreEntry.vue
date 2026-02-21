<template>
  <keep-alive>
    <component :is="activeComponent" :key="route.query.page" />
  </keep-alive>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 引入 explore 相关的页面组件
import YangChunVillages from "./explore/villages/YangChunVillages.vue";
import CheckTool from "./explore/tools/CheckTool.vue";
import Jyut2IpaTool from "./explore/tools/Jyut2IpaTool.vue";
import MergeTool from "./explore/tools/MergeTool.vue";
import gdVillages from "./explore/villages/gdVillagesTree.vue";
import SimpleLayout from "./explore/tools/TableManage.vue";
import ZhongGuPage from "./explore/pho/ZhongGuPage.vue";
import YangChunSpoken from "./explore/pho/YangChunSpoken.vue";
import YuBaoPage from "./explore/pho/YuBaoPage.vue";
import gdVillagesTable from "./explore/villages/gdVillagesTable.vue";
import PhonologyMatrixPage from "./explore/pho/PhonologyPage.vue";
import Countphos from "./explore/pho/Countphos.vue";
import PhonologyCustom from "./explore/pho/PhonologyCustom.vue";
import Praat from "@/views/explore/tools/Praat.vue";
import VillagesML from "@/views/explore/villages/VillagesML.vue";

const route = useRoute()

// 根据 query.page 映射组件
const activeComponent = computed(() => {
  const page = route.query.page
  const pageMap = {
    ycVillages: YangChunVillages,
    check: CheckTool,
    jyut2ipa: Jyut2IpaTool,
    merge: MergeTool,
    gdVillages:gdVillages,
    manage: SimpleLayout,
    // 从 menu 迁移过来的页面
    ZhongGu: ZhongGuPage,
    ycSpoken: YangChunSpoken,
    YuBao: YuBaoPage,
    gdVillagesTable: gdVillagesTable,
    phonologyMatrix: PhonologyMatrixPage,
    Countphos: Countphos,
    phonologyCustom:PhonologyCustom,
    praat : Praat,
    VillagesML: VillagesML,
  }
  return pageMap[page] || PhonologyMatrixPage
})
</script>
