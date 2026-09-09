# 創宇待用機借用管理系統 V2.0｜Supabase 正式架構版

本 Candidate 把 V1.x 的「單機 HTML / 列印」流程改為正式多人系統架構。

## 已鎖定
- 12 間門市 Google Drive 固定 Folder Mapping
- 47 位經辦人：登入輸入 4 碼工號，系統轉姓名；交易保存工號＋姓名快照
- 70 台待用機主檔
- 正式借出流程：建立借用資料 → 產生 QR CODE → 6 面機況照＋證件正反面 → 電子簽名 → 最後確認借出
- P1 + P2 全部完成才可確認借出
- 歸還流程：6 面歸還機況照 → 確認歸還 → Final PDF → Google Drive → 結案
- Final PDF：P1 合約＋證件＋簽名 / P2 借出前 6 面 / P3 歸還 6 面
- PDF 檔名：`{維修單號}_{門市名稱}待用機借用.pdf`
- 證件浮水印：`限創宇通訊待用機使用`

## 正式資料分工

### Supabase Database
保存門市、人員、待用機、借用紀錄、狀態、照片 metadata、Snapshot、Google Drive File ID 與歸檔狀態。

### Supabase Storage
只保存「待用機借出 / 歸還 6 面機況照片」，Bucket 必須 private。

### Backend Private Storage
證件正反面不進 Supabase。Backend 收到後立即產生含浮水印版本，原始上傳檔刪除；含浮水印版本只保留到 Final PDF 成功歸檔。

### Google Drive
只保存正式 Final PDF。每間門市固定 Folder ID，不允許門市手動選資料夾。

## 建議部署資料流

Browser
→ Nginx
→ PHP 8.3 Backend API
→ Supabase（DB / private Storage）
→ Python PDF Renderer
→ Google Drive API

Browser 不直接持有 Supabase `service_role`，也不直接持有 Google OAuth refresh token。

## SQL 執行順序
1. `supabase/001_schema.sql`
2. `supabase/002_seed_stores.sql`
3. `supabase/003_seed_employees.sql`
4. `supabase/004_seed_devices.sql`
5. `supabase/005_storage.sql`

> 70 台待用機因原始 Excel 沒有即時借出狀態，Seed 先設為 `available`。正式上線前要做一次現場狀態盤點。

## Candidate UI
`index.html`（GitHub Pages 入口）

原始 Candidate 另保留於：`frontend/待用機借用管理系統_V2.0_Supabase正式架構版.html`

這份 HTML 是 UX / Flow Candidate，內建真實 12 店、47 人、70 台資料，方便先確認操作動線。敏感證件影像只存在頁面記憶體，不會寫 LocalStorage；正式資料仍以 Backend + Supabase 為準。

## 後續真正串接需要
- Supabase Project URL
- Server 端 `SUPABASE_SERVICE_ROLE_KEY`（只放 `.env`，不要貼進前端）
- Google OAuth Client ID / Client Secret / Refresh Token（以部門公司帳號完成）
- 正式 Backend Domain / QR Capture URL


## GitHub 部署提醒
- ZIP 已在 repo 根目錄提供 `index.html`，可直接作為 GitHub Pages 的前端 Candidate 入口。
- GitHub Pages 只能提供靜態前端；Supabase service_role、Google OAuth refresh token、PDF Renderer 與證件暫存流程仍必須放在 Backend Server，絕不可寫進 GitHub 前端或公開 Repository。


## V2.0.1 更新
- 登入工號欄位提示改為「請輸入工號」，不再顯示範例。
- 視覺 logo / 小圖示 / favicon 改為公司 LOGO。
- 新增員工：0324 莊勝堯、0383 陳威志。
