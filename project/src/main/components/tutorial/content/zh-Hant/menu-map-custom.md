# 自定地圖

管理自己的自定義方言特徵資料，並將其繪製到地圖上。使用者的自定義資料僅本人可見，與賬號繫結，在不同裝置登入也能使用。

## 補充自定義資料

適用於補充檔案中缺少的方言點或特徵資料。例如檔案裡的東莞方言點資料有限，而使用者本人對東莞的流攝瞭解較多，便可以自己補充資料：

![檔案裡的東莞流攝資料](/tutorial/menu-map-custom/03-dongguan-before.webp)

補充個人資料後，地圖上多出了莞城、厚街等方言點：

![補充個人資料後](/tutorial/menu-map-custom/04-dongguan-after.webp)

### 新增方式

在地圖頁面的右側面板，可以新增自定義資料，此時會自動填寫好類別、當前查詢特徵：

![在 map/view 頁面右側面板新增自定義資料](/tutorial/menu-map-custom/05-view-panel-add.webp)

填寫流程：

1. **地點簡稱**：填入要補充的地點簡稱
2. **分割槽**：如果地點存在於檔案裡，會自動匹配填入分割槽；否則需手動填寫。推薦分割槽與音典檔案保持一致，方便後續搜尋（如填入「嶺南-珠江-莞寶」，以後輸入嶺南/珠江/莞寶都能搜到）
3. **座標**：點選地圖即可自動填入經緯度
4. **類別、當前查詢特徵**：根據頁面自動識別，無需手動填入
5. **值**：顯示在地圖上的值
6. **說明**（可選）：在地圖上點選自定義地點時彈窗顯示

填寫完成後點選提交：

![點選提交資料](/tutorial/menu-map-custom/06-view-panel-submit.webp)

## 管理資料

在「自定地圖」頁面可統一管理所有自定義資料：

![自定地圖管理列表](/tutorial/menu-map-custom/07-manage-list.webp)

點選卡片後可單獨繪製該條自定義資料的地圖：

![點選卡片單獨繪製](/tutorial/menu-map-custom/08-card-draw.webp)

![單獨繪製結果](/tutorial/menu-map-custom/09-draw-result.webp)

### 按調查點整理

適合針對單個方言點不斷補充資料：

![按調查點整理的個人資料](/tutorial/menu-map-custom/10-by-location.webp)

![針對單點補充更多資料](/tutorial/menu-map-custom/11-location-detail.webp)

### 按方言特徵整理

適合針對某一待比較特徵不斷補充方言點，進行地理語言學對比：

![按方言特徵整理的個人資料](/tutorial/menu-map-custom/12-by-feature.webp)

![針對某一特徵補充方言點](/tutorial/menu-map-custom/13-feature-detail.webp)

## 搜尋特徵

登入後可在搜尋框中搜索已有特徵名稱，選中後點擊查詢跳到地圖頁檢視。

## 提示

- 需登入才能使用
- 幫助按鈕內有欄位說明和格式示例
