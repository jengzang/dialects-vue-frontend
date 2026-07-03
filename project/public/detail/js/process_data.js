// fetch後端，並整理後端返回的數據
async function analysis_from_db() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const locations = document.getElementById('locations').value.trim().split(/\s+/);
    const regions = document.getElementById('regions').value.trim().split(/\s+/);
    const features = Array.from(document.querySelectorAll('#features-group input:checked')).map(cb => cb.value);

    const status_inputs = parseMultilineListInput("status_inputs");
    const group_inputs = parseMultilineListInput("group_inputs");
    const pho_values = parseMultilineListInput("pho_values");
    const region_mode = window.regionusing;

    if (isEmptyInput(locations) && isEmptyInput(regions)) {
        showToast("⚠️ 請輸入地點或分區！");
        return;
    }

    const payload = {
        mode,
        locations,
        regions,
        features,
        status_inputs,
        group_inputs,
        pho_values,
        region_mode
    };

    // const debugLog = document.getElementById("debug-log");
    // const log = (msg, json = null) => {
    //     const now = new Date().toISOString().split("T")[1].slice(0, 8);
    //     debugLog.textContent += `[${now}] ${msg}\n`;
    //     if (json) debugLog.textContent += JSON.stringify(json, null, 2) + "\n";
    //     debugLog.scrollTop = debugLog.scrollHeight;
    // };
    // debugLog.textContent = ""; // 清空舊 log

    try {
        // log("📦 發送 Payload", payload);
        setLoadingMessage("📡 數據讀取中…");
        const token = localStorage.getItem("ACCESS_TOKEN");  // 或從你儲存 token 的地方取出
        const res = await window.fetch(`${window.API_BASE}/phonology`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})  // ✅ 若存在則加入 Authorization
            },
            body: JSON.stringify(payload)
        });

        // const fetchEnd = performance.now();
        // console.log(`📥 數據下載耗時（含等待連線）：${(fetchEnd - fetchStart).toFixed(2)} ms`);
        //
        // const jsonStart = performance.now();
        const result = await res.json();
        // const jsonEnd = performance.now();
        // console.log(`🧩 JSON 解析耗時：${(jsonEnd - jsonStart).toFixed(2)} ms`);

        // log("✅ 回傳結果", result);

        if (!res.ok || !result.success || !Array.isArray(result.results)) {
            console.error("❌ 回傳錯誤", result);
            // showToast(result.detail);
            clearLoadingMessage();
            if (result.detail.includes("登錄")) {
                showToast(result.detail);
                showAuthPopup();
            }
            else {
                showToast(result.detail,'darkred');
            }
            return;
        }
        const data = result.results;
        // 清除字數为0的數據
        window.latestResults = data.filter(item => item.字數 !== 0); // 👈 加上這一行，確保能在 toggle 時用
        // console.log('🔍 data 第一筆:', data[0]);
        // console.log('🔍 整個data:', data);
        // console.log('🔍 data 第一筆特徵值的型別:', typeof data[0].特徵值, data[0].特徵值);
        if (res.ok && token) {
            await update_userdatas_bytoken(token)
        }
    }catch (error) {
        console.error("分析失敗", error);
        // 优先显示 error.response.detail（如果有）
        if (error.response && error.response.detail) {
            alert("❌ 错误信息：" + error.response.detail);
        } else {
            // 如果没有 `detail` 字段，显示 error.message
            alert("❌ 请求后端错误：" + error.message);
        }
        clearLoadingMessage();
    }
}

async function get_detail(location,feature_value,bool=false,vue = false,
                          mountTarget, group_inputs = []){
    if(!location || !feature_value){
        return
    }
    let status_inputs = [];
    let pho_values = [""];
    let regions = [""];
    let mode = document.querySelector('input[name="mode"]:checked').value;
    const features = Array.from(document.querySelectorAll('#features-group input:checked')).map(cb => cb.value);
    // console.log("feature_value",features)
    const locations = Array.isArray(location)
        ? location
        : [location];
    const region_mode = window.regionusing;
    // console.log("locations",locations)
    if (bool) {
        if (mode === 'p2s') {
            // ❗检查是否是合法汉字（+允许 -）
            if (!/^[\u4e00-\u9fa5\-\s]+$/.test(feature_value)) {
                status_inputs = []; // 清空
            } else {
                status_inputs = [feature_value];
            }
            mode = 's2p';
        } else if (mode === 's2p') {
            pho_values = [feature_value];
            mode = 'p2s';
        }
    } else {
        if (mode === 's2p') {
            if (!/^[\u4e00-\u9fa5\-\s]+$/.test(feature_value)) {
                status_inputs = [];
            } else {
                status_inputs = [feature_value];
            }
        } else if (mode === 'p2s') {
            pho_values = [feature_value];
        }
    }

    const payload = {
        mode,
        locations,
        regions,
        features,
        status_inputs,
        group_inputs,
        pho_values,
        region_mode
    };
    // console.log(payload);
    try {
        const token = localStorage.getItem("ACCESS_TOKEN");  // 或從你儲存 token 的地方取出
        const res = await window.fetch(`${window.API_BASE}/phonology`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})  // ✅ 若存在則加入 Authorization
            },
            body: JSON.stringify(payload)
        });
        if (res.ok && token) {
            await update_userdatas_bytoken(token)
        }

        const result = await res.json();

        if (!res.ok || !result.success || !Array.isArray(result.results)) {
            console.error("❌ 回傳錯誤", result);
            showToast("輸入的中古地位不正確！",'darkred');
            return;
        }
        const data = result.results;
        // 清除字數为0的數據
        window.latestdetailResults = data.filter(item => item.字數 !== 0);
        // console.log(window.latestdetailResults);
        if(!vue) {
            await js_table_render(true, number = bool);
            window.latestdetailResults = [];
        }
        else{
            // console.log("vue")
            await initVue(mountTarget,window.latestdetailResults,false);
        }
    } catch (error) {
        console.error("分析失敗", error);
        // 优先显示 error.response.detail（如果有）
        if (error.response && error.response.detail) {
            alert("❌ 错误信息：" + error.response.detail);
        } else {
            // 如果没有 `detail` 字段，显示 error.message
            alert("❌ 请求后端错误：" + error.message);
        }
        clearLoadingMessage();
    }
}

//地图上的详情查询
const panel = document.getElementById("query-detail-panel");
const closeBtn = document.getElementById("close-panel");
closeBtn.addEventListener("click", () => {
    panel.querySelector(".panel-content").innerHTML = "";
    panel.style.display = "none";
});

const miniBtn = document.getElementById("mini-btn");
miniBtn.addEventListener("click", async () => {
    // panel.style.display = "flex";
    // panel.querySelector(".panel-content").innerHTML = "";
    // 同向查询
    // await get_detail(window.detaillocation,window.detailfeature,false);
    //地图的也改成用vue
    const mountTarget_new = createNewVuePanel();
    await get_detail(window.detaillocation,window.detailfeature,false,true,mountTarget_new);
});

//  刪除用戶自定義數據
const miniBtn0 = document.getElementById("mini-btn0");
miniBtn0.addEventListener("click", async () => {
    const feature = window.detailfeature;
    const value = window.detailvalue;
    const location = window.detaillocation;
    const created_at = window.detaildatatime;
    // 顯示確認刪除的對話框
    const isConfirmed = confirm(
        "⚠️ 你確定要刪除這條信息嗎？\n" +
        "📍 " + location + "\n" +
        "🔧 " + feature + "" +
        "  🔢 " + value + "\n" +
        "🗑️ 刪除後將無法恢復！"
    );


    // 如果用戶點擊確定，執行刪除操作
    if (isConfirmed) {

        // 表單驗證
        if (!location || !feature || !value) {
            showToast("⚠️ 刪除失敗，地點/特徵/值存在空值");
            return;  // 如果有空的字段，則不提交
        }

        // 構建表單數據對象
        const formData = {
            location: location,
            // region: null,
            // coordinates: null,
            feature: feature,
            value: value,
            created_at:created_at,
            // description: null // 如果說明為空，設置為 null
        };
        const token = localStorage.getItem("ACCESS_TOKEN")
        fetch(`${window.API_BASE}/delete_form`, {
            method: "DELETE",  // 改為 DELETE 方法
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})  // 如果有 token，則添加 Authorization 標頭
            },
            body: JSON.stringify(formData)  // 將表單數據作為請求體
        })
            .then(response => response.json())
            .then(data => {
                // 根據後端返回的結果處理
                if (data.success) {
                    showToast("🧹 刪除成功！\n請點擊自定按鈕刷新！\n" + data.message);
                    // 可以選擇清空表單或其他操作
                    // document.getElementById("infoForm").reset();  // 清空表單
                } else {
                    alert("刪除失敗：" + data.message);
                }
            })
            .catch(error => {
                console.error("刪除失敗:", error);
                showToast("刪除時發生錯誤！",'darkred');
            });
    }

});

//表格中的详情查询
const panel2 = document.getElementById("query-detail-panel2");
const closeBtn2 = document.getElementById("close-panel2");
closeBtn2.addEventListener("click", () => {
    panel2.querySelector(".panel-content").innerHTML = "";
    panel2.style.display = "none";
});

const inputExampleButton = document.getElementById("input-example-button");
const queryDetailPanel3 = document.getElementById("query-detail-panel3");
// 点击“輸入示例”按钮时，显示面板
inputExampleButton.addEventListener("click", () => {
    queryDetailPanel3.style.display = "flex"; // 显示面板
});
const panel3 = document.getElementById("query-detail-panel3");
const closeBtn3 = document.getElementById("close-panel3");
closeBtn3.addEventListener("click", () => {
    // panel3.querySelector(".panel-content").innerHTML = "";
    panel3.style.display = "none";
});


const miniBtn2 = document.getElementById("mini-btn2");
miniBtn2.addEventListener("click", async () => {
    panel2.style.display = "flex";
    panel2.querySelector(".panel-content").innerHTML = "";
    //反向查询
    await get_detail(window.detaillocation2,window.detailfeature2,true);
    popup3.classList.remove("active");
});

// 整理數據，用於地圖繪製
async function func_mergeData() {
    // 检查数据是否准备好
    if (!window.latestResults || !window.locations_data) {
        console.log("数据未准备好！");
        return;
    }
    let locations_data = window.locations_data;
    let latestResults = window.latestResults;
    let coordinates_raw = locations_data.coordinates_locations;

    // 最小化改动 - 创建地点到坐标的映射
    let locationToCoordinates = {};
    coordinates_raw.forEach(coord => {
        locationToCoordinates[coord[0]] = coord[1]; // coord[0] 是地点，coord[1] 是坐标
    });

    // 用于存储合并后的数据
    let mergedData = [];
    // 用一个对象根据 location 和 feature 分组数据
    let groupedData = {};

    // 遍历 latestResults 中的数据，获取相关列数据
    latestResults.forEach(item => {
        // 确保 "分組值" 是一个对象，并从中正确获取 feature 和 value
        if (item["分組值"] && typeof item["分組值"] === 'object') {
            // 假设 "分組值" 是一个对象，获取对象的第一个键
            const keys = Object.keys(item["分組值"]);
            if (keys.length > 0) {
                let feature = keys[0];  // 获取第一个键作为 feature
                let value = item["分組值"][feature];  // 获取对应的值作为 value
                let percentage = item["佔比"];
                let location = item["地點"];
                let cha_nums = item["字數"];

                // console.log("正在处理 location:", location); // 打印正在处理的地点
                // 将数据按 location 和 feature 分组
                if (!groupedData[location]) {
                    groupedData[location] = {};
                }
                if (!groupedData[location][feature]) {
                    groupedData[location][feature] = {
                        items: [],
                        detailContent: []
                    };
                }

                // 判断字数 * 占比是否大于等于 0.06
                if (percentage * cha_nums >= 0.06) {
                    // 记录原始数据
                    groupedData[location][feature].detailContent.push({
                        value,
                        percentage
                    });
                }

                // 将数据项推入对应的分组
                groupedData[location][feature].items.push({
                    value,
                    percentage,
                    cha_nums
                });
                // console.log("处理完成：",location)
            }
        }
    });

    // 遍历所有分组的数据，进行合并
    for (let location in groupedData) {
        for (let feature in groupedData[location]) {
            let group = groupedData[location][feature].items;
            let more = [];
            let middle = [];
            let less = [];

            // 按占比分类
            group.forEach(item => {
                if (item.percentage >= 0.5) {
                    more.push(item.value);
                } else if (item.percentage >= 0.35) {
                    middle.push(item.value);
                } else if (item.percentage >= 0.2) {
                    less.push(item.value);
                }
            });

            // 合并后处理的值
            let finalValue = '';

            // 处理 "多" 的情况
            if (more.length > 0)
                if (more.length === 1) {
                    finalValue += more.join('');  // 直接拼接“多”
                } else {
                    finalValue += more.join('/');
                }
            // 处理 "中" 的情况
            if (middle.length > 0) {
                if (less.length === 0 && more.length === 0) {
                    // 如果没有 "少" 和 "多"，且只有一个 "中"，直接加上
                    if (middle.length === 1) {
                        finalValue += middle[0];  // 只有一个“中”，直接加上
                    } else {
                        finalValue += middle.join('/');  // 多个“中”，用斜杠分隔
                    }
                } else {
                    // 如果有 "少" 或者 "多"，则中使用括号包裹并用逗号分隔
                    finalValue += `(${middle.join(',')})`;
                }
            }

            // 处理 "少" 的情况
            if (less.length > 0) {
                finalValue += `(*${less.join(', *')})`;  // 用括号包住“少”，并加上 * 前缀
            }

            if (!finalValue) {
                finalValue = '散';
            }

            // 获取最大占比对应的 value
            let maxPercentageValue = groupedData[location][feature].detailContent.reduce((prev, current) => {
                return (prev.percentage > current.percentage) ? prev : current;
            }).value;

            // 最小化改动 - 获取对应地点的坐标并添加到 mergedData 中
            let coordinate = locationToCoordinates[location] || null; // 获取坐标，若没有则设为 null
            // const [lng, lat] = await convertCoordinates(coordinate);
            // 将合并后的数据推入 mergedData
            mergedData.push({
                location: location,
                feature: feature,
                value: finalValue,
                coordinate: coordinate,
                maxValue: maxPercentageValue,  // 添加最大占比对应的 value
                detailContent: groupedData[location][feature].detailContent // 详细记录
            });
        }
    }

    // 获取前端页面数据
    const locations = document.getElementById('locations').value.trim().split(/\s+/);
    const regions = document.getElementById('regions').value.trim().split(/\s+/);
    const uniqueFeatures = [...new Set(latestResults.map(result => result.特徵值))];

    // 创建请求参数
    const queryParams = {
        locations: locations,
        regions: regions,
        need_features: uniqueFeatures
    };

    let shouldContinue = true;
    let result = null;
    try {
        const token = localStorage.getItem("ACCESS_TOKEN")
        // 如果没有 token，直接返回，表示用户未登录
        if (!token) {
            shouldContinue = false;
            throw "用戶未登錄，不查詢個人數據";
        }
        // 用 URLSearchParams 拼接到 GET URL
        const queryString = new URLSearchParams(queryParams).toString();
        const response = await fetch(`${window.API_BASE}/get_custom?${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            // const errorData = await response.json().catch(() => ({}));
            // const errorMessage = errorData.detail || "後端返回錯誤";
            // alert(errorMessage);
            shouldContinue = false; // 标记不要继续往下处理
        }else {
            result = await response.json();
        }
        // result = shouldContinue ? await response.json() : null;
    } catch (error) {
        // console.error("请求失败:", error);
        // alert("請求失敗：" + error.message);
        shouldContinue = false;
    }
    if (shouldContinue && Array.isArray(result)) {
        mergeBackendData(result, mergedData);
    } else {
        console.log("當前地點/分區選擇不包含自定義數據", result);
    }

    assignColorToMergedData(mergedData);
    // console.log(mergedData)
    window.mergedData = mergedData;
    // console.log("mergedData存储完成");

}


// 未運行runBtn時，打開自定按鈕，在輸入框裡輸入特徵後，
// 請求後端，並整理返回的數組
async function get_custom_feature(){
    const locations = document.getElementById('locations').value.trim().split(/\s+/);
    const regions = document.getElementById('regions').value.trim().split(/\s+/);
    if (isEmptyInput(locations) && isEmptyInput(regions)) {
        // alert("請輸入地點或分區！");
        return;
    }
    // 用户输入框
    const inputEl = document.getElementById('tipinput2');
    const word = inputEl ? inputEl.value.trim() : "";
    const suggestion = document.getElementById("inlineSuggestion");  // 渲染到这里

    const queryParams = {
        locations: locations,
        regions: regions,
        word: word
    };

    try {
        const queryString = new URLSearchParams();
        queryParams.locations.forEach(loc => queryString.append("locations", loc));
        queryParams.regions.forEach(reg => queryString.append("regions", reg));
        queryString.append("word", queryParams.word);
        const token = localStorage.getItem("ACCESS_TOKEN")
        const response = await fetch(`${window.API_BASE}/get_custom_feature?${queryString.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });


        if (!response.ok) {
            console.error("後端返回錯誤", response.status);
            return;
        }

        const data = await response.json(); // 形如 [{簡稱:'…', 特徵:'…'}, ...]
        // 扁平唯一特徵列表
        const features = [...new Set(
            (Array.isArray(data) ? data : []).map(d => d?.["特徵"]).filter(Boolean)
        )];
        // console.log('特徵列表:', features);
        // const { queryStart, cursorPos, value } = getQueryStart(inputEl);

        // const query = value.slice(queryStart, cursorPos).trim();
        // if (!query) {
        //     suggestion.style.display = "none";
        //     return;
        // }
        suggestion.innerHTML = ""; // ✅ 这里清空旧建议
        features.forEach(item => {
            const div = document.createElement("div");
            div.className = "suggest-line";
            div.textContent = item;

            div.addEventListener("mousedown", async e => {
                e.preventDefault();
                inputEl.value = item;
                suggestion.style.display = "none";
                window.selectedItem = item;
                await process_custom();
                await triggerDrawingFunction();
            });
            suggestion.appendChild(div);
        });
        const rect = inputEl.getBoundingClientRect();
        suggestion.style.left = `${rect.left + window.scrollX}px`;
        suggestion.style.top = `${rect.bottom + 6 + window.scrollY}px`;
        suggestion.style.display = "block";
    } catch (err) {
        console.error("請求失敗:", err);
    }
    // 🔻 自動隱藏：若輸入框失去焦點（但點擊 suggestion 例外）
    inputEl.addEventListener("blur", () => {
        setTimeout(() => {
            suggestion.style.display = "none";
        }, 200);
    });
}

// 整理後端返回的用戶自定義數據--get_custom_feature調用
async function process_custom() {
    // 获取前端页面数据
    const locations = document.getElementById('locations').value.trim().split(/\s+/);
    const regions = document.getElementById('regions').value.trim().split(/\s+/);
    const featuresInput = document.getElementById('tipinput2');
    const featureList = featuresInput?.value.trim().split(/\s+/).filter(Boolean) || [];

    // 构建请求参数
    const queryParams = {
        locations: locations,
        regions: regions,
        need_features: featureList
    };

    let result = null;
    let shouldContinue = true;

    try {
        const queryString = new URLSearchParams();
        queryParams.locations.forEach(loc => queryString.append("locations", loc));
        queryParams.regions.forEach(reg => queryString.append("regions", reg));
        queryParams.need_features.forEach(f => queryString.append("need_features", f));
        const token = localStorage.getItem("ACCESS_TOKEN")
        const response = await fetch(`${window.API_BASE}/get_custom?${queryString.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            shouldContinue = false;
            // console.log("沒回應")
        } else {
            result = await response.json();
            // console.log("有回應")
        }
    } catch (error) {
        shouldContinue = false;
    }

    if (!shouldContinue || !Array.isArray(result)) {
        console.log("自定義資料獲取失敗或格式錯誤", result);
        return;
    }

    let mergedData = [];
    mergeBackendData(result, mergedData);
    assignColorToMergedData(mergedData);
    window.mergedData = mergedData;

}

// 對用戶自定義數據進行處理
function mergeBackendData(result, mergedData) {
    result.forEach(row => {
        const newCoordinate = row["經緯度"];
        const newLocation = row["簡稱"];
        const newPhonology = row["聲韻調"];
        const newFeature = row["特徵"];
        const created_at = row["created_at"] || null;

        const locationIndex = mergedData.findIndex(item =>
            item.feature === newFeature &&
            JSON.stringify(item.coordinate) === JSON.stringify(newCoordinate)
        );

        if (locationIndex === -1) {
            mergedData.push({
                location: newLocation,
                phonology: newPhonology,
                feature: newFeature,
                value: row["值"],
                coordinate: newCoordinate,
                maxValue: row["maxValue"],
                notes: row["說明"],
                iscustoms: 1,
                detailContent: [],
                created_at:created_at,
            });
        } else {
            const existingItem = mergedData[locationIndex];
            if (existingItem.location === newLocation) {
                existingItem.value += "║" + row["值"];
                existingItem.maxValue += "║" + row["maxValue"];
                existingItem.notes += "║" + row["說明"];
                existingItem.phonology += "║" + newPhonology;
                existingItem.iscustoms = 1;
            } else {
                mergedData.push({
                    location: newLocation,
                    phonology: newPhonology,
                    feature: newFeature,
                    value: row["值"],
                    coordinate: newCoordinate,
                    maxValue: row["maxValue"],
                    notes: row["說明"],
                    iscustoms: 1,
                    detailContent: [],
                    created_at:created_at,
                });
            }
        }
    });
}

// 分配顏色
function assignColorToMergedData(mergedData) {
    const colorScale = [
        '#FFB3B3', '#FFB366', '#FFFF99', '#B3FFB3', '#99CCFF', '#D4A6FF',
        '#FF6666', '#FFD699', '#99CCCC', '#D1D1FF', '#FF9999', '#FFB3FF',
        '#FFFF66', '#B3FF99', '#99CCFF', '#FFCC99', '#CCCCFF', '#FF66CC',
        '#FFFF66', '#B3FFCC'
    ];
    let featureMaxValuesToColor = {};

    mergedData.forEach(item => {
        const { feature, maxValue } = item;
        if (!featureMaxValuesToColor[feature]) {
            featureMaxValuesToColor[feature] = new Set();
        }
        featureMaxValuesToColor[feature].add(maxValue);
    });

    let featureToColor = {};
    Object.keys(featureMaxValuesToColor).forEach(feature => {
        const values = Array.from(featureMaxValuesToColor[feature]);
        featureToColor[feature] = {};
        values.forEach((val, idx) => {
            featureToColor[feature][val] = colorScale[idx % colorScale.length];
        });
    });

    mergedData.forEach(item => {
        item.color = featureToColor[item.feature]?.[item.maxValue] || '#888';
    });
}

function generateCharsMergedData(resultData, locationsData) {
    // 创建地点到坐标的映射
    let locationToCoordinates = {};
    locationsData.coordinates_locations.forEach(coord => {
        locationToCoordinates[coord[0]] = coord[1];  // coord[0] 是地点，coord[1] 是坐标
    });
    let notesString = "";  // 默认空字符串
    // 初始化 mergedData 数组
    let mergedData = [];
    // 生成 mergedData
    return resultData.map(item => {
        // 计算音节和 notes
        let syllablesString = item.音节.join('·');  // 拼接音节
        if (Array.isArray(item.notes) && item.notes.some(note => note !== "_")) {
            notesString = item.notes.join(' / ');  // 处理 notes（拼接非空的 notes）
        }

        // 获取坐标
        let coordinate = locationToCoordinates[item.location] || [0, 0];  // 默认坐标是 [0, 0]，如果没有找到则为默认值

        // 拼接到 mergedData
        mergedData.push({
            location: item.location,  // 使用 location 字段
            feature: item.char,  // 使用 char 字段作为 feature
            value: syllablesString,  // 拼接后的音节字符串
            coordinate: coordinate,  // 使用映射的坐标
            maxValue: syllablesString,  // 与 value 相同
            detailContent: notesString  // 使用处理后的 notes 字符串
        });
        // 调用颜色分配函数
        assignColorToMergedData(mergedData);
        window.mergedData = mergedData;  // 不返回，而是存储在全局变量 window.mergedData 中
    });
}

// 新的函数：处理音调并分配颜色
function generateTonesMergedData(resultData, locationsData) {
    // 创建地点到坐标的映射
    let locationToCoordinates = {};
    locationsData.coordinates_locations.forEach(coord => {
        locationToCoordinates[coord[0]] = coord[1];  // coord[0] 是地点，coord[1] 是坐标
    });

    // 初始化 mergedData 数组
    let mergedData = [];

    resultData.forEach(item => {
        // 获取坐标
        let coordinate = locationToCoordinates[item.location] || [0, 0];  // 默认坐标是 [0, 0]，如果没有找到则为默认值
        // 拼接到 mergedData
        mergedData.push({
            location: item.location,  // 使用 location 字段
            feature: item.tone,  // 使用 char 字段作为 feature
            value: item.value,  // 拼接后的音节字符串
            coordinate: coordinate,  // 使用映射的坐标
            maxValue: item.value,  // 与 value 相同
            detailContent: item.notes  // 使用处理后的 notes 字符串
        });
    });

    // 调用分配颜色的函数
    assignColorToMergedData(mergedData);

    // 将处理后的 mergedData 存储在 window.mergedData 中
    window.mergedData = mergedData;
}
