// let mergedData;

// 覆盖 Image 对象，重定向所有图标请求
(function() {
    const originalImage = Image;
    window.Image = function() {
        const img = new originalImage();
        // 获取图标的 URL
        const originalSrc = img.src;
        // 判断是否是要加载的图标URL
        if (originalSrc && originalSrc.includes('c-webapi.amap.com/style_icon')) {
            // 替换成根目录下的自定义favicon.ico
            img.src = '/favicon.ico'; // 根目录下的图标路径
        }

        return img;
    };
})();

// 配置安全代码
window._AMapSecurityConfig = {
    securityJsCode: "06fece76cc6ddd8f7996819c28315b58",  // 高德key
};

// 等待页面加载完成
window.onload = function() {
    // 获取控件的checkbox
    var toggleSearch = document.getElementById('togglesearch');

    // 获取整个搜索区域
    var myPageTop = document.getElementById('myPageTop');

    // 初始时检查状态，设置搜索框显示/隐藏
    if (!toggleSearch.checked) {
        myPageTop.style.display = 'none'; // 初始时隐藏搜索框区域
    }

    // 监听切换按钮状态，控制 #myPageTop 显示与隐藏
    toggleSearch.addEventListener('change', function() {
        if (toggleSearch.checked) {
            myPageTop.style.display = 'block'; // 显示整个搜索框区域
        } else {
            myPageTop.style.display = 'none';  // 隐藏整个搜索框区域
        }
    });
};

// 地图对象
let map;

// 加载地图和插件
AMapLoader.load({
    key: '9425dfc6824171d5b978c95f52703f10', // 您的 API Key
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.MapType', 'AMap.HawkEye', 'AMap.ControlBar']
}).then((AMap) => {
    // 创建地图实例
    map = new AMap.Map('mapContainer', {
        zoom: 11,
        pitch: 30,
        viewMode: '2D',
        features: ['bg', 'building', 'point']  // 默认显示
    });

    // 添加控件
    let scale = new AMap.Scale();
    let toolBar = new AMap.ToolBar({
        position: { top: '110px', right: '40px' }
    });
    let controlBar = new AMap.ControlBar({
        position: { top: '10px', right: '10px' }
    });
    let overView = new AMap.HawkEye({ opened: false });

    // 将控件添加到地图中
    map.addControl(scale);
    map.addControl(toolBar);
    map.addControl(controlBar);
    map.addControl(overView);


// 初始化控件顯示狀態
    let isControlsVisible;

// 判斷當前螢幕方向，並設置控件顯示狀態
    function checkScreenOrientation() {
        // console.log('Screen width:', window.innerWidth, 'Screen height:', window.innerHeight);
        if (window.innerWidth > window.innerHeight) {
            // 豎屏：默認顯示控件
            // console.log('Portrait mode detected. Showing controls.');
            isControlsVisible = true;
            scale.show();
            toolBar.show();
            controlBar.show();
            overView.show();
            document.getElementById('toggleControlsRadio').checked = true;
        } else {
            // 橫屏：默認隱藏控件
            // console.log('Landscape mode detected. Hiding controls.');
            isControlsVisible = false;
            scale.hide();
            toolBar.hide();
            controlBar.hide();
            overView.hide();
            document.getElementById('toggleControlsRadio').checked = false;
        }
    }
// 初始檢查螢幕方向
    checkScreenOrientation();
// 當螢幕方向改變時，重新檢查並調整顯示狀態
    window.addEventListener('resize', function() {
        console.log('Window resized');
        checkScreenOrientation();
    });

    // 单选按钮控制事件：点击按钮时，切换控件显示/隐藏
    document.getElementById('toggleControlsRadio').addEventListener('click', function() {
        if (isControlsVisible) {
            // 隐藏控件
            scale.hide();
            toolBar.hide();
            controlBar.hide();
            overView.hide();
            isControlsVisible = false;
            // 设置单选按钮为未选中
            document.getElementById('toggleControlsRadio').checked = false;
        } else {
            // 显示控件
            scale.show();
            toolBar.show();
            controlBar.show();
            overView.show();
            isControlsVisible = true;
            // 设置单选按钮为选中
            document.getElementById('toggleControlsRadio').checked = true;
        }
    });

    // 设置地图显示要素的函数
    function setMapFeatures() {
        var features = [];
        var inputs = document.querySelectorAll(".input-card input[name='mapStyle']");
        inputs.forEach(function (input) {
            if (input.checked) {
                features.push(input.value); // 根据复选框的勾选状态，添加要显示的要素
            }
        });
        map.setFeatures(features); // 根据勾选的要素，设置地图显示的要素
    }

    // 绑定checkbox点击事件，更新显示的地图要素
    var inputs = document.querySelectorAll(".input-card input[name='mapStyle']");
    inputs.forEach(function (checkbox) {
        checkbox.onclick = setMapFeatures;
    });

    //输入提示
    var autoOptions = {
        input: "tipinput"
    };

    AMap.plugin(['AMap.PlaceSearch','AMap.AutoComplete'], function(){
        var auto = new AMap.AutoComplete(autoOptions);
        var placeSearch = new AMap.PlaceSearch({
            map: map
        });  //构造地点查询类
        auto.on("select", select);//注册监听，当选中某条记录时会触发
        function select(e) {
            placeSearch.setCity(e.poi.adcode);
            placeSearch.search(e.poi.name);  //关键字查询查询
        }
    });

}).catch((e) => {
    console.error("地图加载失败", e);
});

// 高德地圖內置的控件處理
document.addEventListener('DOMContentLoaded', function () {
    const inputCard = document.getElementById('inputCard');
    const body = document.body;

    let isMaximized = false;
    let isClickedMaximized = false;  // 新增一個標誌來控制點擊是否觸發最大化
    // 監聽 body 上的點擊事件
    body.addEventListener('click', (event) => {
        if (isMaximized && !inputCard.contains(event.target)) {
            // 點擊外部恢復最小化
            inputCard.classList.remove('maximized');
            isMaximized = false;
            isClickedMaximized = false; // 清除點擊最大化標誌
        }
    });

    // 按下 ESC 鍵時恢復最小化
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isMaximized) {
            inputCard.classList.remove('maximized');
            isMaximized = false;
            isClickedMaximized = false; // 清除點擊最大化標誌
        }
    });

    // // 初始化時檢查是否豎屏
    // if (window.innerWidth > window.innerHeight) {
    //     // 鼠标 hover 事件触发最大化
    //     inputCard.addEventListener('mouseenter', () => {
    //         if (!isMaximized && !isClickedMaximized) { // 只有當不是點擊觸發時才最大化
    //             inputCard.classList.add('maximized');
    //             isMaximized = true;
    //         }
    //     });
    //
    //     inputCard.addEventListener('mouseleave', () => {
    //         if (!isClickedMaximized) { // 只有當不是點擊觸發時才最小化
    //             inputCard.classList.remove('maximized');
    //             isMaximized = false;
    //         }
    //     });
    // }

    // 點擊事件觸發最大化
    inputCard.addEventListener('click', () => {
        if (!isMaximized) {
            inputCard.classList.add('maximized');
            isMaximized = true;
            isClickedMaximized = true; // 設置標誌，表示點擊觸發最大化
        } else {
            inputCard.classList.remove('maximized');
            isMaximized = false;
            isClickedMaximized = false; // 取消點擊觸發標誌
        }
    });
});



//初次绘图
async function create_map1(create_mep = false){
    const locations = document.getElementById('locations').value.trim().split(/\s+/);  // 获取地點，并拆分成数组
    const regions = document.getElementById('regions').value.trim().split(/\s+/);  // 获取分區，并拆分成数组
    // console.log('locations', locations);
    // let textall = []
    // if (textall.length > 0) {
    //     map.remove(textall);
    //     textall = [];
    // }

    if (isEmptyInput(locations) && isEmptyInput(regions)) {
        showToast("❌ 請輸入地點或分區！",'darkred');
        return;
    }

// 假设 customToggle 和 isCustomOn 已经在其他地方定义并控制开关状态
    const url = new URL(`${window.API_BASE}/get_coordinates`);  // 后端 API 地址
    url.searchParams.append('locations', locations);  // 添加 locations 参数
    url.searchParams.append('regions', regions);  // 添加 regions 参数
    url.searchParams.set("region_mode", window.regionusing);  // ✅ 正確

// 如果开关处于开启状态，添加 iscustom 参数为 true
    if (window.isCustomOn) {
        url.searchParams.append('iscustom', 'true');
    }
    // ✅ 加上 token
    const token = localStorage.getItem("ACCESS_TOKEN")

    // 显示加载提示
    // const debugLog = document.getElementById("debug-log");
    // debugLog.textContent = "📡 發送請求中...";

    try {
        // 使用 Authorization 標頭來發送 token
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        };
        const res = await fetch(url.toString(), {
            method: "GET",
            headers: headers
        });

        // 检查请求是否成功
        if (!res.ok) {
            // console.error("❌ 请求失败:", res.status);
            const errorData = await res.json();  // 尝试获取返回的JSON错误信息
            showToast(`後端錯誤！錯誤信息: ${errorData.detail || '請稍後重試'}`,'darkred')
            // debugLog.textContent = "❌ 请求失败";
            return;
        }

        // 解析返回的数据
        window.locations_data = await res.json();
        // console.log("✅ 后端返回数据:", window.locations_data);  // 打印接收到的所有数据
        // 判断整个数据结构是否为空或不合法
        if (
            !window.locations_data ||
            !Array.isArray(window.locations_data.coordinates_locations) ||
            window.locations_data.coordinates_locations.length === 0
        ) {
            console.warn("⚠️ 返回成功但數據不完整或為空！");
            return;
        }

        // 如果数据存在，动态更新地图
        if (locations_data && create_mep) {

            // 清除旧的标记
            map.clearMap();

            // 遍历后端返回的地点数据，进行坐标处理并创建标记
            locations_data.coordinates_locations.forEach(([locationName, coordinates]) => {
                // console.log("坐标", coordinates);

                // 直接使用原始经纬度数据（假设 coordinates 是 [lng, lat]）
                const lng = coordinates[0];
                const lat = coordinates[1];
                let fontSize;
                const nameLength = locationName.length;

                if (nameLength <= 3) {
                    fontSize = '12.5px';
                } else if (nameLength === 4) {
                    fontSize = '11.5px';
                } else if (nameLength === 5) {
                    fontSize = '10.5px';
                } else {
                    fontSize = '10px';
                }
                // console.log("原始经纬度：", lng, lat);

                // 确保坐标是有效的并可以用来绘制标记
                if (lng && lat) {
                    const text = new window.AMap.Text({
                        text: locationName,  // 使用地点名作为文本
                        anchor: 'center',
                        draggable: false,
                        cursor: 'pointer',
                        angle: 10,
                        // zIndex: index,
                        className: 'amap-overlay-text-container',  // 应用 CSS 类
                        position: [lng, lat],// 使用转换后的高德坐标
                        style: {
                            padding: '.05rem .1rem',        // 调整 padding，更加紧凑
                            marginBottom: '.1rem',           // 调整底部 margin
                            borderRadius: '.1rem',
                            // backgroundColor: 'rgba(66, 38, 38, 0.85)',
                            // color: 'rgb(125,248,162)',
                            backgroundColor: '#1b2e2b',
                            color: '#a6ffdc',
                            width: 'auto',                    // 根据文字长度自动撑开宽度
                            borderWidth: 0,
                            boxShadow: '0 2px 6px 0 rgba(114, 124, 245, .5)',
                            textAlign: 'center',
                            fontSize: fontSize,                // 调小字体大小
                            display: 'inline-block',          // 让容器根据内容宽度调整
                            whiteSpace: 'nowrap',            // 保证文字不换行
                            overflow: 'hidden',               // 防止超出容器的文本显示
                            textOverflow: 'ellipsis',        // 超过容器时显示省略号
                            fontFamily: '"SimHei", "黑体", sans-serif', // 设置黑体字体
                        }
                        // clickable: true,
                        // extData: {
                        //     index, // 把层级携带下去
                        //     locationName,
                        // },
                    });

                    // 将文本标记添加到地图上
                    text.setMap(map);

                }
            });
        }
    } catch (error) {
        console.error("❌ 错误:", error);
        alert("請求後端錯誤：" + error.message);
    }
}

// 特徵下拉框和按鈕的監聽
function setupEventListeners(dropdownArrow, dropdown, placeholder, selectBox) {
    let timeoutId; // 用于存储延时操作的 ID
    // Hover 控制下拉（只限 selectBox）
    selectBox.addEventListener("mouseenter", () => {
        dropdown.classList.add("expanded");
        dropdownArrow.textContent = "▲";
    });
    // 给下拉项添加事件监听器，确保进入下拉项时不会关闭
    dropdown.addEventListener("mouseenter", () => {
        // 清除收起延时操作
        clearTimeout(timeoutId);
    });
    selectBox.addEventListener("mouseleave", () => {
        // 延时操作：在鼠标离开后延迟 300 毫秒收起下拉框
        timeoutId = setTimeout(() => {
            dropdown.classList.remove("expanded");  // 收起下拉框
            dropdownArrow.textContent = "▼";        // 修改箭头指向
        }, 500); // 300ms 延时
    });

    // 点击箭头 toggle 展开状态（移动端专用）
    dropdownArrow.addEventListener("click", (e) => {
        e.stopPropagation();
        const isExpanded = dropdown.classList.toggle("expanded");
        dropdownArrow.textContent = isExpanded ? "▲" : "▼";
    });

    // 点击下拉项
    const items = dropdown.querySelectorAll('.dropdown-item');
    items.forEach(item => {
        item.addEventListener('click', async () => {
            placeholder.textContent = item.textContent;
            dropdown.classList.remove("expanded");
            dropdownArrow.textContent = "▼";
            window.selectedItem = item.textContent;
            // 等待 mergedData 填充完成
            if (!window.mergedData) {
                await func_mergeData();
            }
            await triggerDrawingFunction();
        });
    });

    // 按 ESC 关闭
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            dropdown.classList.remove("expanded");
            dropdownArrow.textContent = "▼";
        }
    });
}



// 用於點擊runBtn後的數據整理、生成特徵下拉框或按鈕
function mapFeatureSelection(latestResults = window.latestResults) {  // 默认使用全局变量 window.latestResults
    const featureContainer = document.getElementById('featureContainer');

    // 清空容器
    featureContainer.innerHTML = '';

    // 开始等待资料填充
    checkDataAvailability();

    function checkDataAvailability() {
        const checkInterval = setInterval(() => {
            if (Array.isArray(latestResults) && latestResults.length > 0) {
                clearInterval(checkInterval); // 停止轮询
                populateFeatureData();
            } else {
                console.log('等待数据加载...');
            }
        }, 1000);
    }

    function populateFeatureData() {
        const uniqueFeatures = [...new Set(latestResults.map(result => result.特徵值))];

        if (document.querySelector('.dropdown') || document.querySelector('.single-button')) {
            return; // 防止重复生成
        }

        if (uniqueFeatures.length === 1) {
            const button = document.createElement("button");
            button.classList.add("single-button");
            button.textContent = uniqueFeatures[0];
            featureContainer.appendChild(button);

            button.addEventListener("click", async () => {
                window.selectedItem = button.textContent;
                if (!window.mergedData) {
                    await func_mergeData();
                }
                await triggerDrawingFunction();
            });
            // 延时模拟点击按钮
            setTimeout(() => {
                button.click(); // 模拟点击
            }, 1000); // 1000ms 延迟点击按钮

        } else if (uniqueFeatures.length > 1) {
            // console.log("生成下拉框，特徵值:", uniqueFeatures);
            const featureContainer = document.getElementById("featureContainer");
            featureContainer.innerHTML = ""; // 清空旧内容

            // 创建 select-box（hover 专用）
            const selectBox = document.createElement("div");
            selectBox.classList.add("select-box");

            const placeholder = document.createElement("div");
            placeholder.classList.add("placeholder");
            placeholder.textContent = "請選擇繪圖特徵";

            const dropdown = document.createElement("div");
            dropdown.classList.add("dropdown");

            uniqueFeatures.forEach(feature => {
                const item = document.createElement("div");
                item.classList.add("dropdown-item");
                item.textContent = feature;
                dropdown.appendChild(item);
            });

            selectBox.appendChild(placeholder);
            selectBox.appendChild(dropdown);

            // ✅ 创建箭头，插入为兄弟元素（非嵌套）
            const dropdownArrow = document.createElement("button");
            dropdownArrow.classList.add("dropdown-arrow");
            dropdownArrow.textContent = "▼";

            // ✅ 插入到 featureContainer 作为平级元素
            featureContainer.appendChild(selectBox);
            featureContainer.appendChild(dropdownArrow);

            // 初始化事件监听
            setupEventListeners(dropdownArrow, dropdown, placeholder, selectBox);
            // 延时模拟点击下拉框中的第一个元素
            setTimeout(() => {
                const firstItem = dropdown.querySelector('.dropdown-item');
                if (firstItem) {
                    firstItem.click(); // 模拟点击第一个元素
                }
            }, 1000); // 1000ms 延迟点击第一个元素
        }

        const selectBox = document.querySelector(".select-box");
        if (selectBox) {
            selectBox.classList.add("expanded");
        }
    }
}



// 再次触发绘图函数，繪製具體的特徵圖
async function triggerDrawingFunction() {
    let selectedItem = window.selectedItem;
    // console.log("绘图函数触发，选中的项是：", selectedItem);
    // 将 selectedItem 填入表单中的“特征”输入框
    document.getElementById("feature-input").value = selectedItem;

    if (window.mergedData) {
        // console.log("绘图正常运行")

        // 清除旧的标记
        map.clearMap();

        // 使用 for...of 循环遍历 mergedData 中的每个数组项
        for (const dataItem of window.mergedData) {
            // console.log("feature",dataItem.feature)
            // 检查 dataItem 中的 feature 是否与 selectedItem 匹配
            if (dataItem.feature === selectedItem) {
                const locationName = dataItem.location;  // 获取地点名称
                const coordinates = dataItem.coordinate;  // 获取坐标（假设为 [longitude, latitude]）
                const value = dataItem.value;
                const color = dataItem.color;
                const detailContent = dataItem.detailContent; // 假设你有一个 detailContent 数组
                const feature = dataItem.feature;
                const phonology = dataItem.phonology;  // 获取聲韻調字段

                // console.log("处理:", locationName);
                if (!value || value.trim() === '') {
                    // 如果 value 为空或只包含空白字符，跳过当前项的绘制
                    continue;
                }

                try {
                    // 检查坐标是否有效
                    if (Array.isArray(coordinates) && coordinates.length === 2) {
                        // const { lng, lat } = await convertCoordinates(coordinates);
                        // 检查 iscustoms 不存在 或者 iscustoms 不为 1
                        if (!dataItem.hasOwnProperty('iscustoms') || dataItem.iscustoms !== 1) {
                            const text = new window.AMap.Text({
                                text: value,
                                anchor: 'center',
                                draggable: false,
                                cursor: 'pointer',
                                angle: 10,
                                className: 'amap-overlay-text-container',  // 应用 CSS 类
                                position: coordinates,
                                clickable: true,
                                style: {
                                    padding: '.05rem .05rem',           // 调整 padding，更加紧凑
                                    marginBottom: '.1rem',           // 调整底部 margin
                                    borderRadius: '.1rem',
                                    backgroundColor: color,
                                    width: 'auto',                    // 根据文字长度自动撑开宽度
                                    // borderWidth: 0,
                                    boxShadow: '0 2px 6px 0 rgba(114, 124, 245, .5)',
                                    textAlign: 'center',
                                    fontSize: '15px',                // 调小字体大小
                                    color: 'black',
                                    display: 'inline-block',          // 让容器根据内容宽度调整
                                    whiteSpace: 'nowrap',            // 保证文字不换行
                                    overflow: 'hidden',               // 防止超出容器的文本显示
                                    textOverflow: 'ellipsis',        // 超过容器时显示省略号
                                    fontFamily: '"Times new Roman"', //
                                    borderWidth: '0.7px',                // 设置边框宽度
                                    borderColor: 'black',              // 设置边框颜色
                                    borderStyle: 'solid',              // 设置边框样式
                                },
                                extData: {
                                    locationName,
                                    feature,
                                    detailContent         // 将 detailContent 数组传递到 extData 中
                                },
                            });

                            // 将文本标记添加到地图上
                            text.setMap(map);

                            // 绑定点击事件
                            text.on('click', (e) => {
                                clearPopup();
                                const popup = document.getElementById("popup");
                                if (!popup) return;

                                // 确保获取到正确的元素
                                const locationNameEl = document.getElementById("location-name");
                                const featureEl = document.getElementById("feature");
                                const detailContentEl = document.getElementById("detail-content");

                                // 设置弹窗内容
                                locationNameEl.textContent = ` ${locationName}`;
                                featureEl.textContent = ` ${feature}`;
                                // detailContentEl.textContent = `详细内容: ${JSON.stringify(detailContent)}`;

                                if (Array.isArray(detailContent) && detailContent.length > 0 &&
                                    detailContent.some(item => item.hasOwnProperty('percentage'))) {
                                    // 清空旧的详细内容并插入新内容
                                    detailContentEl.innerHTML = ""; // 清空之前的内容
                                    detailContent.sort((a, b) => b.percentage - a.percentage); // 改为降序
                                    // 使用 <ul> 和 <li> 显示详细内容
                                    const ul = document.createElement("ul");

                                    detailContent.forEach(item => {
                                        const li = document.createElement("li");
                                        // 保留一位小数并带上百分号
                                        const percentageFormatted = (item.percentage * 100).toFixed(1) + '%';
                                        li.innerHTML = `<span>•</span> ${item.value} <span>~</span> ${percentageFormatted}`;
                                        ul.appendChild(li);
                                    });
                                    detailContentEl.appendChild(ul); // 将生成的 <ul> 添加到弹窗中
                                    document.getElementById("mini-btn").style.display = "inline-block";
                                }else {
                                    // 如果没有 percentage 字段，或者 detailContent 不是数组，直接显示内容
                                    detailContentEl.textContent = `${detailContent}`; // 直接显示 detailContent
                                    document.getElementById("mini-btn").style.display = "none";
                                }

                                // 顯示按鈕
                                // document.getElementById("mini-btn").style.display = "inline-block";
                                document.getElementById("mini-btn0").style.display = "none";
                                // 定位與顯示
                                positionAndShowPopup({
                                    popupEl: popup,
                                    event: e,
                                    offsetTop: 30,
                                    offsetLeft: 15
                                });
                                // 地图点击时更新全局变量
                                window.detaillocation = locationName;
                                window.detailfeature = feature.replace(/·/g, '');
                            });

                        }

                        if (dataItem.iscustoms === 1 && window.isCustomOn) {
                            const notes = dataItem.notes;
                            const text = new window.AMap.Text({
                                text: value,
                                anchor: 'center',
                                draggable: false,
                                cursor: 'pointer',
                                angle: 10,
                                className: 'amap-overlay-text-container',  // 应用 CSS 类
                                position: coordinates,  // 使用转换后的高德坐标
                                clickable: true,
                                style: {
                                    padding: '.05rem .05rem',           // 调整 padding，更加紧凑
                                    marginBottom: '.1rem',           // 调整底部 margin
                                    borderRadius: '.1rem',
                                    backgroundColor: color,
                                    width: 'auto',                    // 根据文字长度自动撑开宽度
                                    // borderWidth: 0,
                                    boxShadow: '0 2px 6px 0 rgba(114, 124, 245, .5)',
                                    textAlign: 'center',
                                    fontSize: '15px',                // 调小字体大小
                                    color: 'black',
                                    display: 'inline-block',          // 让容器根据内容宽度调整
                                    whiteSpace: 'nowrap',            // 保证文字不换行
                                    overflow: 'hidden',               // 防止超出容器的文本显示
                                    textOverflow: 'ellipsis',        // 超过容器时显示省略号
                                    fontFamily: '"Times new Roman"', //
                                    borderWidth: '0.7px',                // 设置边框宽度
                                    borderColor: 'black',              // 设置边框颜色
                                    borderStyle: 'solid',              // 设置边框样式
                                },
                            });

                            // 将文本标记添加到地图上
                            text.setMap(map);

                            // 绑定点击事件
                            text.on('click', (e) => {
                                clearPopup();
                                const popup = document.getElementById("popup"); // 確保 ID 正確
                                if (!popup) return;
                                // 确保获取到正确的元素
                                const locationNameEl = document.getElementById("location-name");
                                const featureEl = document.getElementById("feature");
                                const phonologyEl = document.getElementById("phonology");
                                const notesEl = document.getElementById("notes1");  // 使用 notes 代替 detailContent

                                locationNameEl.textContent = ` ${locationName}`;
                                featureEl.textContent = ` ${feature} • ${value}`;
                                if (phonology && phonology !== 'undefined') {
                                    phonologyEl.textContent = `聲韻調: ${phonology}`;
                                    phonologyEl.style.display = 'block';
                                } else {
                                    phonologyEl.style.display = 'none';
                                }
                                notesEl.textContent = `說明: ${notes}`;  // 直接显示 notes 文本内容

                                document.getElementById("mini-btn").style.display = "none";
                                document.getElementById("mini-btn0").style.display = "inline-block";
                                // 定位與顯示
                                positionAndShowPopup({
                                    popupEl: popup,
                                    event: e,
                                    offsetTop: 30,
                                    offsetLeft: 15
                                });
                                window.detaillocation = locationName;
                                window.detailfeature = feature;
                                window.detailvalue = value;
                                window.detaildatatime = dataItem.created_at;
                            });
                        }
                    }
                }catch (e) {
                    console.log("error:", e);
                }
            }
        }
        window.plotted = true;
    }
}

//繪製總的點圖函數
async function create_dot_all() {
    const locations = document.getElementById('locations').value.trim().split(/\s+/);  // 获取地點，并拆分成数组
    const regions = document.getElementById('regions').value.trim().split(/\s+/);  // 获取分區，并拆分成数组
    let maxLevel = 0;  // 存储最大 level

    if (isEmptyInput(locations) && isEmptyInput(regions)) {
        showToast("❌ 請輸入地點或分區！",'darkred');
        return;
    }

    // 获取用户选择的 maxLevel，如果用户选择了某个值
    const userSelectedLevel = document.getElementById('max-level').value;
    if (userSelectedLevel) {
        maxLevel = parseInt(userSelectedLevel);  // 使用用户选择的 level
    }
    // 如果用户没有选择 maxLevel，则通过 regions 进行计算
    if (!userSelectedLevel) {
        // 获取最大 level
        for (const region of regions) {
            try {
                const response = await fetch(`${window.API_BASE}/partitions?parent=${encodeURIComponent(region)}`);
                const data = await response.json();

                const regionData = data[region];
                const level = regionData ? regionData.level : 3;  // 如果有partitions，返回它的 level，否則返回 0

                maxLevel = Math.max(maxLevel, level);  // 更新最大 level
            } catch (error) {
                console.error(`❌ 获取分区 ${region} 失败:`, error);
                maxLevel = Math.max(maxLevel, 3);
            }
        }

        if (maxLevel === 0) {
            maxLevel = 3;
        }
    }

    // 定义颜色数组（20种颜色）
    const colorPalette = [
        "#e6194b", "#3cb44b", "#ffe119", "#4363d8",
        "#f58231", "#911eb4", "#42d4f4", "#f032e6",
        "#bfe745", "#fabed4", "#469990", "#dcbaff",
        "#9a6324", "#fffac8", "#800000", "#aaffc3",
        "#808000", "#ffd8b1", "#000075", "#a9a9a9"
    ];

    // 发送请求获取数据
    const url = new URL(`${window.API_BASE}/get_coordinates`);
    url.searchParams.append('locations', locations);
    url.searchParams.append('regions', regions);
    url.searchParams.set("region_mode", window.regionusing);  // ✅ 正確
    url.searchParams.append('iscustom', 'true');
    url.searchParams.append('flag', 'False');
    const token = localStorage.getItem("ACCESS_TOKEN")
    try {
        // 使用 Authorization 標頭來發送 token
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        };

        const res = await fetch(url.toString(), {
            method: "GET",
            headers: headers
        });

        if (!res.ok) {
            // console.error("❌ 请求失败:", res.status);
            const errorData = await res.json();  // 尝试获取返回的JSON错误信息
            alert(`後端錯誤！錯誤信息: ${errorData.detail || '請稍後重試'}`)
            // debugLog.textContent = "❌ 请求失败";
            return;
        }

        let all_locations_dot = await res.json();
        // 判断整个数据结构是否为空或不合法
        if (
            !all_locations_dot ||
            !Array.isArray(all_locations_dot.coordinates_locations) ||
            all_locations_dot.coordinates_locations.length === 0
        ) {
            showToast("❌ 輸入的地點未能完全匹配！\n可點擊輸入框下方選框的正確地點",'darkred')
            return;
        }
        const mapParams = {
            max_level: maxLevel
        };
        let result = [];

        // 根据 mapParams.max_level 的值决定使用哪个 level
        const levelToUse = mapParams.max_level === 1 ? "level1" :
            mapParams.max_level === 2 ? "level2" : "level3";

        const uniqueLevels = new Set();  // 用来存储唯一的 level 值
        for (const [locationName, coordinates] of all_locations_dot.coordinates_locations) {
            // 获取每个地点的 regions_data
            let regionsData = all_locations_dot.region_mappings?.[locationName] || null;


            if (regionsData) {
                let originalRegionsData = regionsData;
                let regions = regionsData.split('-');
                let level1 = regions[0];
                let level2 = regions[1] || level1;
                let level3 = regions[2] || level2;

                uniqueLevels.add({ level1, level2, level3 }[levelToUse]);

                result.push({
                    locationName: locationName,
                    original_regions_data: originalRegionsData,
                    regions_data: {
                        level1: level1,
                        level2: level2,
                        level3: level3
                    },
                    coordinates: coordinates,
                    color: ""  // 初始化颜色字段
                });
            }
        }

        // 将颜色分配到 result 中
        const uniqueLevelsArray = Array.from(uniqueLevels);
        const levelColorMap = {};

        uniqueLevelsArray.forEach((level, index) => {
            levelColorMap[level] = colorPalette[index % 20];  // 循环分配颜色
        });

        // 给 result 添加颜色
        result.forEach(item => {
            // 根据 mapParams.max_level 确定当前 level，给对应的 level 添加颜色
            item.color = levelColorMap[item.regions_data[levelToUse]];  // 将颜色添加到 item 中
        });
        // console.log("color", result)

        //如果数据存在，动态更新地图
        if (result) {
            if (window.innerHeight >= window.innerWidth) {
                const inputpanel = document.getElementById("inputpanel");
                const resultpanel = document.getElementById("resultPanel");
                const mappanel = document.getElementById("mapPanel");
                v_togglePanel(inputpanel, 15, 0, 1);
                v_togglePanel(resultpanel, 15, 5, 2);
                v_togglePanel(mappanel, 90, 10, 3);
            }
            // 清除旧的标记
            map.clearMap();

            // 遍历后端返回的地点数据，进行坐标处理并创建标记
            result.forEach(item => {
                // 提取地点名称和坐标
                const locationName = item.locationName;
                const coordinates = item.coordinates;
                const lng = coordinates[0];
                const lat = coordinates[1];
                const regions_detailed = item.original_regions_data;
                const color = item.color;

                // 确保坐标是有效的并可以用来绘制标记
                if (lng && lat) {


                    const circleMarker = new window.AMap.CircleMarker({
                        center: [lng, lat],
                        radius:5,//3D视图下，CircleMarker半径不要超过64px
                        strokeColor: '#000000',  // 设置边框颜色为黑色
                        strokeWeight: 2,  // 边框的宽度
                        strokeOpacity:1,
                        fillColor:color,
                        draggable: false,
                        fillOpacity:0.7,
                        zIndex:10,
                        bubble:true,
                        cursor:'pointer',
                        clickable: true,
                        className: 'amap-overlay-text-container',
                    })
                    circleMarker.setMap(map)

                    circleMarker.on('click', (e) => {
                        const popup = document.getElementById('popup2');  // 确保弹窗的 id 或类名正确
                        // 确保获取到正确的元素
                        const locationName2El = document.getElementById("location-name2");
                        const feature2El = document.getElementById("feature2");

                        // 设置弹窗内容
                        locationName2El.textContent = ` ${locationName}`;
                        feature2El.textContent = ` ${regions_detailed}`;

                        // 定位與顯示（有 fallback size）
                        positionAndShowPopup({
                            popupEl: popup,
                            event: e,
                            offsetTop: 5,
                            offsetLeft: 10,
                            fallbackSize: { width: 300, height: 150 }
                        });
                    });

                }
            });
        }

    } catch (error) {
        console.error("❌ 错误:", error);
        alert("請求後端錯誤：" + error.message);
    }
}

//繪製總的點圖監聽
document.getElementById("allmap-first").addEventListener("click", async () => {
    if (window.userRole !== 'admin'){
        // 🔒 冷卻控制只針對分析主邏輯
        if (window.runCooldown) {
            showToast("⏳ 分析已啟動，請等待 5 秒後再試！");
            return;
        }
        // ✅ 真正執行分析 → 開始冷卻計時
        window.runCooldown = true;
        setTimeout(() => {
            window.runCooldown = false;
        }, 5000);
    }

    await create_dot_all(); // ✅ 通過檢查才執行
});


// 监听用户选择 max-level 时的变化
document.getElementById('max-level').addEventListener('change', async function() {
    if (window.userRole !== 'admin'){
        // 🔒 冷卻控制只針對分析主邏輯
        if (window.runCooldown) {
            showToast("⏳ 分析已啟動，請等待 5 秒後再試！");
            return;
        }
        // ✅ 真正執行分析 → 開始冷卻計時
        window.runCooldown = true;
        setTimeout(() => {
            window.runCooldown = false;
        }, 5000);
    }
    await create_dot_all();  // 用户选择时调用 create_dot_all
});

// 隐藏 "請選擇" 在下拉框展开时
document.getElementById('max-level').addEventListener('focus', function() {
    const dropdown = this;
    const firstOption = dropdown.querySelector('option[value=""]');
    if (firstOption) {
        firstOption.style.display = 'none';  // 隐藏 "請選擇" 选项
    }
});

// 当下拉框失去焦点时，恢复显示 "請選擇" 选项
document.getElementById('max-level').addEventListener('blur', function() {
    const dropdown = this;
    const firstOption = dropdown.querySelector('option[value=""]');
    if (firstOption) {
        firstOption.style.display = '';  // 恢复显示 "請選擇" 选项
    }
});


//調用高德api轉換坐標，已廢棄
async function convertCoordinates(coordinates, retryLimit = 5, attempt = 0) {
    return new Promise((resolve, reject) => {
        AMap.convertFrom(coordinates, 'baidu', function (status, result) {
            if (status === 'complete') {
                // 检查返回的 result.locations 数组是否有效
                if (result.locations && result.locations.length > 0) {
                    // 获取转换后的坐标（AMap.LngLat 对象）
                    const gcj02Coordinates = result.locations[0];

                    // 使用 getLng() 和 getLat() 方法访问经纬度
                    const lng = gcj02Coordinates.getLng();
                    const lat = gcj02Coordinates.getLat();

                    // 确保坐标是有效的并可以用来绘制标记
                    if (lng && lat) {
                        resolve([lng, lat]);  // 返回数组形式 [lng, lat]
                    } else {
                        reject("转换后的坐标无效");
                    }
                } else {
                    reject("转换结果没有有效的坐标");
                }
            } else {
                if (attempt < retryLimit) {
                    // 如果转换失败且尝试次数小于限制，重新尝试
                    console.log(`转换失败，正在重新尝试... 尝试次数：${attempt + 1}`);
                    resolve(convertCoordinates(coordinates, retryLimit, attempt + 1));  // 递归重试
                } else {
                    reject("坐标转换失败，已达到最大重试次数");
                }
            }
        });
    });
}





