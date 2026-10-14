
window.addEventListener('DOMContentLoaded', async function () {
    const data = sessionStorage.getItem('vueToNativeData')
    if (!data) return

    try {
        const parsed = JSON.parse(data)
        console.log('📦 收到來自 Vue 的資料：', parsed)

        // ✅ 清除，避免重複觸發
        sessionStorage.removeItem('vueToNativeData')

        // ✅ 填入地點欄位
        const locationEl = document.querySelector('#locations') // 地點 textarea
        if (locationEl && parsed.location) {
            locationEl.value = parsed.location
        }
        // ✅ 填入分區欄位（你需確認分區的 input 是什麼 tag）
        const regionEl = document.querySelector('#regions') // 分區輸入欄位
        if (regionEl && parsed.region) {
            // region 有可能是陣列或字串
            regionEl.value = Array.isArray(parsed.region)
                ? parsed.region.join(' ')
                : parsed.region
        }
        if (parsed.region_source === 'map' || parsed.region_source === 'yindian') {
            // 移除全部 tab 按鈕的 active
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
            // 找出對應的按鈕
            const targetTab = document.querySelector(`.tab-btn[data-tab="${parsed.region_source}"]`)
            targetTab?.classList.add('active')
            window.regionusing = `${parsed.region_source}`;
        }

        if (regionEl && parsed.regions_semantics === 'path-v2') {
            setRegionPaths(regionEl.value.trim().split(/\s+/).filter(Boolean), window.regionusing);
        }

        // ✅ tab1 的行為：自動填入查字 + 按按鈕
        if (parsed.mode === 'tab1') {
            const inputEl = document.querySelector('.input-search')
            const buttonEl = document.querySelector('#characters-btn')

            if (inputEl && parsed.chars) {
                inputEl.value = parsed.chars
            }

            if (buttonEl) {
                setTimeout(() => {
                    buttonEl.click()
                }, 300) // ⏱ 小延遲確保 DOM 已掛載
            }
        }
        else if  (parsed.mode === 'tab2') {
            // 模式選擇
            document.querySelector('input[name="mode"][value="s2p"]').checked = true;
            updateVisibility();

            // ✅ 清除所有卡片選擇
            document.querySelectorAll('#features-group input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            // ✅ 選擇目標卡片
            const cardCheckbox = document.querySelector(`#features-group input[value="${parsed.card}"]`);
            if (cardCheckbox) cardCheckbox.checked = true;

            // value+key 合併填入 status_inputs
            let key = (parsed.key || '').replace(/清濁|部位|方式/g, '');
            document.getElementById('status_inputs').value = (parsed.value || '') + key;


            const runBtn = document.querySelector('#runBtn')
            if (runBtn) {
                setTimeout(() => {
                    runBtn.click()
                }, 300) // ⏱ 小延遲確保 DOM 已掛載
            }
        }
        else if (parsed.mode === 'tab3') {
            // 模式選擇
            document.querySelector('input[name="mode"][value="p2s"]').checked = true;
            updateVisibility();

            // ✅ 清除所有卡片選擇
            document.querySelectorAll('#features-group input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            // ✅ 選擇目標卡片
            const cardCheckbox = document.querySelector(`#features-group input[value="${parsed.card}"]`);
            if (cardCheckbox) cardCheckbox.checked = true;

            // key → group_inputs
            document.getElementById('group_inputs').value = parsed.key || '';

            // word → pho_values
            document.getElementById('pho_values').value = parsed.pho || '';

            const runBtn = document.querySelector('#runBtn')
            if (runBtn) {
                setTimeout(() => {
                    runBtn.click()
                }, 300) // ⏱ 小延遲確保 DOM 已掛載
            }
        }
        else if (parsed.mode === 'tab4') {
            // alert('老子进来了')
            const toneBtn = document.querySelector('#tones-btn')
            if (toneBtn) {
                setTimeout(() => {
                    toneBtn.click()
                }, 300) // ⏱ 小延遲確保 DOM 已掛載
            }
        }
        else if (parsed.mode === 'map'){
            // 🎯 自動選中分區級數下拉框
            const levelSelect = document.getElementById('max-level');
            if (levelSelect && parsed.level) {
                await getDefaultRegionTree(window.regionusing);
                levelSelect.value = String(parsed.level); // 確保是 string
            }
            const mapBtn = document.querySelector('#allmap-first')
            if (mapBtn){
                setTimeout(()=>{
                    mapBtn.click()
                },300)
            }
        }
        else if (parsed.mode === 'custom'){
            const mappanel = document.getElementById("mapPanel");
            if (window.innerHeight < window.innerWidth) {
                h_togglePanel(mappanel,75,25)
            }
            else{
                v_togglePanel(mappanel,75,25)
            }
            const rightBtn = document.querySelector('#expandButton')
            if (rightBtn){
                setTimeout(()=>{
                    rightBtn.click()
                },200)
            }
        }
    } catch (e) {
        console.warn('❌ 資料解析失敗', e)
    }
})


window.receiveFromVue = function (data) {
    console.log('📥 收到來自 Vue 的資料：', data)
    alert('Vue 傳來：' + JSON.stringify(data))
}
