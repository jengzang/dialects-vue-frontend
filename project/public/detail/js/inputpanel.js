// 切換數據顯示模式（表格/海量數據）
document.getElementById('button-masschange').addEventListener('click', async function() {
    const buttonText = document.getElementById('button-text-masschange');
    const buttonIcon = document.querySelector('.button-icon-masschange');
    const button = document.getElementById('button-masschange');

    // 根據全局變量控制按鈕的開關狀態
    if (window.isButtonClosed) {
        // 如果當前為關閉狀態，切換為開啟狀態
        window.isButtonClosed = false;  // 更新全局狀態為開啟
        buttonText.textContent = '海量數據';  // 顯示開啟狀態的文字
        buttonIcon.innerHTML = '↻';  // 顯示旋轉圖標
        button.classList.remove('closed');  // 移除關閉狀態的類
        console.log("切換到開啟狀態");
    } else {
        // 如果當前為開啟狀態，切換為關閉狀態
        window.isButtonClosed = true;  // 更新全局狀態為關閉
        buttonText.textContent = '表格模式';  // 顯示關閉狀態的文字
        buttonIcon.innerHTML = '↺';  // 顯示旋轉圖標
        button.classList.add('closed');  // 移除關閉狀態的類
        console.log("切換到關閉狀態");
    }
});

const checkboxes = document.querySelectorAll('#features-group input[type="checkbox"]');

checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            // ✅ 勾选一个时，取消其他所有
            checkboxes.forEach(other => {
                if (other !== checkbox) {
                    other.checked = false;
                }
            });
        } else {
            // ⛔ 禁止取消当前唯一选中项
            const isAnyChecked = Array.from(checkboxes).some(cb => cb.checked);
            if (!isAnyChecked) {
                checkbox.checked = true;
            }
        }
    });
});

// 選擇分析模式（音本位還是字本位）
function updateVisibility() {
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    document.getElementById("status_input_button").style.display = mode === "s2p" ? "flex" : "none";
    document.getElementById("group_inputs_group").style.display = mode === "p2s" ? "block" : "none";
    // 遍历所有的 .input-section 元素，检查是否为空，空的隐藏
    document.querySelectorAll('.input-section').forEach(function(section) {
        if (!section.textContent.trim()) {
            section.style.display = 'none';  // 如果为空，隐藏元素
        } else {
            section.style.display = 'block'; // 如果有内容，显示元素
        }
    });
}

// 監聽Mode
document.querySelectorAll('input[name="mode"]').forEach(r => {
    r.addEventListener("change", updateVisibility);
});
updateVisibility();

/*
分區的選擇
 */
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("partitionBtn");
    const textarea = document.getElementById("regions");
    window.partitionPopupOpen = false;
    window.regionusing = 'map';
    textarea.addEventListener('input', () => {
        detailResolveSequence++;
        if (!textarea.value.trim()) detailRegionTokens = [];
        document.getElementById('region-resolution')?.remove();
    });


    document.querySelectorAll('.tab-btn').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            const selectedType = tabBtn.getAttribute('data-tab');
            const isSame = window.regionusing === selectedType;

            // ✅ 如果是點選音典或地圖，且已選中 → toggle popup
            if ((selectedType === 'yindian' || selectedType === 'map') && isSame) {
                const existing = document.querySelector('#popupLayer .partition-container');
                if (existing) {
                    existing.dispatchEvent(new Event('close-partition'));
                } else {
                    showRegionSelector?.(textarea, selectedType);
                }
                return;
            }

            // 切換 tab 狀態
            window.regionusing = selectedType;
            detailResolveSequence++; // Preserve the text while the user chooses its system.
            window.partitionPopupOpen = false; // 👈 这里设才对！

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            tabBtn.classList.add('active');

            textarea.placeholder = selectedType === 'map'
                ? '請輸入或選擇「地圖集」分區'
                : '請輸入或選擇「音典」分區';

            // ⛔ 切到非音典或地圖時，保險起見自動關 popup
            if (selectedType !== 'yindian' && selectedType !== 'map') {
                const existing = document.querySelector('#popupLayer .partition-container');
                existing?.dispatchEvent(new Event('close-partition'));
            }
        });
    });

    // ▼ 點擊 → 當前是音典或地圖時才 toggle
    btn?.addEventListener("click", () => {
        if (window.regionusing === 'yindian' || window.regionusing === 'map') {
            const existing = document.querySelector('#popupLayer .partition-container');
            if (existing) {
                existing.dispatchEvent(new Event('close-partition'));
            } else {
                showRegionSelector?.(textarea, window.regionusing);
            }
        }
    });
})



// 獲取匹配到的分區列表
// Trees and name resolutions live only for this page, separated by authenticated identity.
const detailPartitionTrees = new Map();
const detailPartitionResolutions = new Map();
let detailRegionTokens = [];
let detailResolveSequence = 0;

function partitionHeaders() {
    const token = localStorage.getItem('ACCESS_TOKEN');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function getDefaultRegionTree(mode) {
    const identity = localStorage.getItem('ACCESS_TOKEN') || '';
    const key = JSON.stringify([identity, mode]);
    if (!detailPartitionTrees.has(key)) {
        const pending = fetch(`${window.API_BASE}/partitions?region_mode=${encodeURIComponent(mode)}`, { headers: partitionHeaders() })
            .then(async response => {
                if (!response.ok) throw Error('分區載入失敗');
                const tree = await response.json();
                if (tree.schema_version !== 2 || tree.region_mode !== mode || !Array.isArray(tree.nodes)) throw Error('分區格式錯誤');
                return tree;
            }).catch(error => { detailPartitionTrees.delete(key); throw error; });
        detailPartitionTrees.set(key, pending);
    }
    return detailPartitionTrees.get(key);
}

async function getSubregions(parentPath, mode = 'yindian') {
    const tree = await getDefaultRegionTree(mode);
    if (parentPath == null) return tree.nodes;
    const pending = [...tree.nodes];
    while (pending.length) {
        const node = pending.pop();
        if (node.path === parentPath) return node.children;
        pending.push(...node.children);
    }
    return [];
}

function setRegionPaths(paths, mode = window.regionusing) {
    const textarea = document.getElementById('regions');
    textarea.value = paths.filter(Boolean).join(' ');
    detailRegionTokens = paths.filter(Boolean).map(text => ({ text, source: mode }));
    detailResolveSequence++;
    document.getElementById('region-resolution')?.remove();
}

async function resolveDetailItems(mode, items) {
    const identity = localStorage.getItem('ACCESS_TOKEN') || '';
    const key = JSON.stringify([identity, mode, items]);
    if (!detailPartitionResolutions.has(key)) {
        const pending = fetch(`${window.API_BASE}/partitions/resolve`, {
            method: 'POST', headers: partitionHeaders(),
            body: JSON.stringify({ region_mode: mode, scope: 'default_and_user', items })
        }).then(async response => {
            if (!response.ok) throw Error('分區解析失敗');
            const reply = await response.json();
            if (reply.schema_version !== 2 || reply.region_mode !== mode || reply.items?.length !== items.length) throw Error('分區格式錯誤');
            return reply.items;
        }).catch(error => { detailPartitionResolutions.delete(key); throw error; });
        detailPartitionResolutions.set(key, pending);
    }
    return detailPartitionResolutions.get(key);
}

async function readRegionPaths() {
    const textarea = document.getElementById('regions');
    const value = textarea.value;
    const mode = window.regionusing || 'map';
    const identity = localStorage.getItem('ACCESS_TOKEN') || '';
    const texts = value.trim().split(/\s+/).filter(Boolean);
    const sequence = ++detailResolveSequence;
    remapDetailTokens(texts);
    document.getElementById('region-resolution')?.remove();
    if (!texts.length) return [];
    const items = texts.map((text, index) => ({ text, kind: text.includes('-') || detailRegionTokens[index] ? 'path' : 'name' }));
    try {
        const replies = await resolveDetailItems(mode, items);
        if (sequence !== detailResolveSequence || textarea.value !== value || window.regionusing !== mode || (localStorage.getItem('ACCESS_TOKEN') || '') !== identity) return null;
        const issues = replies.map((reply, index) => ({ index, candidates: reply.candidates || [] }))
            .filter(issue => issue.candidates.length !== 1);
        const missing = issues.filter(issue => !issue.candidates.length);
        if (missing.length) {
            const other = await resolveDetailItems(mode === 'map' ? 'yindian' : 'map', missing.map(issue => items[issue.index]));
            if (sequence !== detailResolveSequence || textarea.value !== value || window.regionusing !== mode || (localStorage.getItem('ACCESS_TOKEN') || '') !== identity) return null;
            missing.forEach((issue, index) => { issue.mixed = Boolean(other[index]?.candidates?.length); });
        }
        if (issues.length) {
            const box = document.createElement('div'); box.id = 'region-resolution';
            for (const issue of issues) {
                const message = document.createElement('p');
                message.textContent = issue.mixed ? '請統一分區體系後再執行。' : issue.candidates.length ? `「${texts[issue.index]}」有多個分區，請選擇完整路徑。` : `「${texts[issue.index]}」分區不存在或已失效，請重新選擇。`;
                box.append(message);
                if (!issue.mixed) for (const candidate of issue.candidates) {
                    const button = document.createElement('button'); button.type = 'button'; button.dataset.regionPath = candidate.path;
                    button.textContent = candidate.path.split('-').join('·'); button.title = candidate.path;
                    button.addEventListener('click', () => {
                        if (textarea.value !== value || window.regionusing !== mode) return;
                        const next = [...texts]; next[issue.index] = candidate.path;
                        textarea.value = next.join(' ');
                        detailRegionTokens[issue.index] = { text: candidate.path, source: mode };
                        void readRegionPaths();
                    });
                    box.append(button);
                }
            }
            textarea.insertAdjacentElement('afterend', box);
            return null;
        }
        const paths = [...new Set(replies.map(reply => reply.candidates[0].path))];
        setRegionPaths(paths, mode);
        return paths;
    } catch (error) {
        if (sequence === detailResolveSequence) showToast(error.message);
        return null;
    }
}

function remapDetailTokens(texts) {
    const previous = detailRegionTokens, used = new Set();
    detailRegionTokens = texts.map((text, index) => {
        const oldIndex = previous[index]?.text === text && !used.has(index) ? index : previous.findIndex((token, i) => token?.text === text && !used.has(i));
        if (oldIndex < 0) return undefined;
        used.add(oldIndex);
        return previous[oldIndex];
    });
}

const detailCustomScopes = new Map();
async function readCustomScope(regions) {
    const locations = document.getElementById('locations').value.trim().split(/\s+/).filter(Boolean);
    if (window.regionusing === 'yindian') return { locations, regions };
    if (!regions.length || !localStorage.getItem('ACCESS_TOKEN')) return { locations, regions: [] };
    const mode = window.regionusing, value = document.getElementById('regions').value;
    const identity = localStorage.getItem('ACCESS_TOKEN');
    const key = JSON.stringify([identity, mode, locations, regions]);
    try {
        if (!detailCustomScopes.has(key)) {
            const query = new URLSearchParams({ region_mode: mode });
            locations.forEach(location => query.append('locations', location));
            regions.forEach(path => query.append('regions', path));
            const pending = fetch(`${window.API_BASE}/get_locs/?${query}`, { headers: partitionHeaders() })
                .then(async response => { if (!response.ok) throw Error('地點解析失敗'); return response.json(); })
                .catch(error => { detailCustomScopes.delete(key); throw error; });
            detailCustomScopes.set(key, pending);
        }
        const reply = await detailCustomScopes.get(key);
        if (window.regionusing !== mode || document.getElementById('regions').value !== value || localStorage.getItem('ACCESS_TOKEN') !== identity || JSON.stringify(document.getElementById('locations').value.trim().split(/\s+/).filter(Boolean)) !== JSON.stringify(locations)) return null;
        return { locations: [...new Set([...locations, ...(reply.locations_result || [])])], regions: [] };
    } catch (error) { showToast(error.message); return null; }
}

function showRegionSelector(textarea, mode = 'yindian') {
    const existing = document.querySelector('#popupLayer .partition-container');
    if (existing) { existing.dispatchEvent(new Event('close-partition')); return; }
    window.partitionPopupOpen = true;
    const container = document.createElement('div'); container.className = 'partition-container';
    const panelRect = document.getElementById('panelContent').getBoundingClientRect();
    const portrait = window.innerWidth < window.innerHeight;
    const left = portrait ? 10 : Math.min(panelRect.right, window.innerWidth - 180);
    const top = portrait ? 10 : Math.max(10, panelRect.top);
    Object.assign(container.style, { position: 'fixed', top: `${top}px`, left: `${left}px`, maxWidth: `calc(100vw - ${left + 10}px)`, maxHeight: `calc(100dvh - ${top + 10}px)`, overflowX: 'auto', alignItems: 'flex-start' });
    document.getElementById('popupLayer').append(container);
    const timers = new Set();
    function close() {
        timers.forEach(clearTimeout); container.remove(); window.partitionPopupOpen = false;
        document.removeEventListener('keydown', escape); document.removeEventListener('mousedown', outside);
    }
    function escape(event) { if (event.key === 'Escape') close(); }
    function outside(event) { if (!container.contains(event.target)) close(); }
    container.addEventListener('close-partition', close);
    document.addEventListener('keydown', escape); document.addEventListener('mousedown', outside);
    function renderColumn(nodes, depth) {
        while (container.children.length > depth) container.lastElementChild.remove();
        if (!nodes.length || !container.isConnected) return;
        const column = document.createElement('div'); column.className = 'partition-popup';
        Object.assign(column.style, { flex: '0 0 auto', minWidth: '140px', maxHeight: `calc(100dvh - ${top + 12}px)`, overflowY: 'auto' });
        container.append(column);
        for (const node of nodes) {
            const line = document.createElement('div'); line.className = 'partition-line'; line.dataset.regionPath = node.path;
            const item = document.createElement('div'); item.className = 'partition-item'; item.textContent = node.label; item.title = node.path; line.append(item);
            const expand = () => {
                if (!line.isConnected) return;
                for (const row of column.children) row.classList.toggle('active', row === line);
                renderColumn(node.children, depth + 1);
            };
            let hoverTimer, touchTimer, moved = false, longPress = false, start;
            line.addEventListener('mouseenter', () => { hoverTimer = setTimeout(expand, 100); timers.add(hoverTimer); });
            line.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
            if (node.children.length) {
                const arrow = document.createElement('div'); arrow.className = 'partition-arrow'; arrow.textContent = '⌵';
                arrow.addEventListener('click', event => { event.stopPropagation(); expand(); }); line.append(arrow);
            }
            const select = () => {
                const paths = textarea.value.trim().split(/\s+/).filter(Boolean);
                remapDetailTokens(paths);
                if (!paths.includes(node.path)) paths.push(node.path);
                // Only the newly selected token is confirmed; retain unresolved older text.
                textarea.value = paths.join(' ');
                detailRegionTokens[paths.indexOf(node.path)] = { text: node.path, source: mode };
                detailResolveSequence++; close();
            };
            item.addEventListener('touchstart', event => {
                moved = false; longPress = false; start = event.touches[0];
                touchTimer = setTimeout(() => { if (!moved) { longPress = true; expand(); } }, 500); timers.add(touchTimer);
            }, { passive: true });
            item.addEventListener('touchmove', event => {
                const point = event.touches[0];
                if (Math.abs(point.clientX - start.clientX) > 10 || Math.abs(point.clientY - start.clientY) > 10) { moved = true; clearTimeout(touchTimer); }
            }, { passive: true });
            item.addEventListener('touchend', event => {
                clearTimeout(touchTimer);
                if (event.cancelable) event.preventDefault();
                if (!moved && !longPress) select();
            }, { passive: false });
            item.addEventListener('touchcancel', () => { moved = true; clearTimeout(touchTimer); });
            item.addEventListener('click', () => { if (!longPress) select(); });
            column.append(line);
        }
    }
    getSubregions(null, mode).then(nodes => { if (container.isConnected) renderColumn(nodes, 0); })
        .catch(error => { close(); showToast(error.message); });
}


/*
地点输入框的匹配
 */
const inputEl = document.getElementById("locations");
const suggestion = document.getElementById("inlineSuggestion");

// 地點輸入框的獲取後端、顯示下拉框、點擊完成匹配
const fetchSuggestion = () => {
    const { queryStart, cursorPos, value } = getQueryStart(inputEl);
    const query = value.slice(queryStart, cursorPos).trim();

    if (!query) {
        suggestion.style.display = "none";
        return;
    }
    const token = localStorage.getItem("ACCESS_TOKEN")
    fetch(`${window.API_BASE}/batch_match?input_string=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    })

        .then(res => res.json())
        .then(results => {
            if (!results.length) {
                suggestion.style.display = "none";
                return;
            }

            const r = results[0];
            suggestion.innerHTML = "";

            if (r.success) {
                suggestion.innerHTML = `<div class="success">✅ ${r.message}</div>`;
            } else {
                // 取得目前輸入框值的「所有已完成地點」
                const allValues = value.split(/[ ,;/，；、\n\t]+/).filter(Boolean);
                const currentQuery = value.slice(queryStart, cursorPos).trim();
                const exclusionSet = new Set(allValues.filter(v => v !== currentQuery));
                const filtered = Array.from(new Set(r.items)).filter(item => !exclusionSet.has(item));
                if (!filtered.length) {
                    suggestion.style.display = "none";
                    return;
                }

                filtered.forEach(item => {
                    const div = document.createElement("div");
                    div.className = "suggest-line";
                    div.textContent = item;

                    div.addEventListener("mousedown", e => {
                        e.preventDefault();
                        const before = value.slice(0, queryStart);
                        const after = value.slice(cursorPos);
                        inputEl.value = before + item + ' ' + after;

                        const newPos = before.length + item.length + 1;
                        inputEl.setSelectionRange(newPos, newPos);
                        suggestion.style.display = "none";
                    });

                    suggestion.appendChild(div);
                });
            }

            const rect = inputEl.getBoundingClientRect();
            suggestion.style.left = `${rect.left + window.scrollX}px`;
            suggestion.style.top = `${rect.bottom + 6 + window.scrollY}px`;
            suggestion.style.display = "block";
        });
};

// ✅ 绑定 keyup + 防抖
inputEl.addEventListener("keyup", debounce(fetchSuggestion, 300));

// 🔻 自動隱藏：若輸入框失去焦點（但點擊 suggestion 例外）
inputEl.addEventListener("blur", () => {
    setTimeout(() => {
        suggestion.style.display = "none";
    }, 200);
});


const feedbackBtn = document.getElementById("feedbackBtn");

feedbackBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.open(window.WEB_BASE + "/intro?tab=suggestions","_blank");
});

document.getElementById('refreshBtn').addEventListener('click', function() {
    showToast("開始刷新，請稍等頁面加載", 'darkgreen');
    setTimeout(() => {
        // 获取页面上的所有 <script> 和 <link> 标签（CSS 文件）
        var scripts = document.getElementsByTagName('script');
        var links = document.getElementsByTagName('link');

        // 强制重新加载所有 <script> 标签的资源
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src) {
                // 删除并重新添加 <script> 标签来强制重新加载资源
                var newScript = document.createElement('script');
                newScript.src = src + '?t=' + new Date().getTime();  // 添加时间戳避免缓存
                document.body.appendChild(newScript);
                scripts[i].parentNode.removeChild(scripts[i]);
            }
        }
        // 强制重新加载所有 <link> 标签（CSS 文件）
        for (var i = 0; i < links.length; i++) {
            var href = links[i].href;
            if (href && links[i].rel === 'stylesheet') {
                // 删除并重新添加 <link> 标签来强制重新加载资源
                var newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = href + '?t=' + new Date().getTime();  // 添加时间戳避免缓存
                document.head.appendChild(newLink);
                links[i].parentNode.removeChild(links[i]);
            }
        }

        // 不清除 localStorage 和 sessionStorage
        // location.reload();  // 如果不想清除 storage，直接刷新页面
        window.location.reload();  // 重新加载页面，但不清除 localStorage 和 sessionStorage
    }, 1000);  // 延迟 1000 毫秒（1 秒）
});

