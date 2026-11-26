# En-Ting Chu (朱恩霆) — Academic & Engineering Portfolio

> **使用聲明（Notice）**：本專案與網站僅供個人學術研究與工程能力成果展示之用，**未經作者書面授權，禁止用於任何商業用途、轉載重製或作為商業專案模板**。詳情請參閱 [LICENSE](./LICENSE)。

以 **Vite + React + TypeScript + Tailwind CSS** 打造的極簡學術研究風個人網站，支援 **繁體中文 / English 雙語切換** 與 **淺色／深色主題模式**，並以「資料與畫面分離」與「隱私保護（ISO/IEC 27701 本地運算原則）」為核心設計。

## 核心特色

- **極簡學術風格與主題切換**：支援淺色暖白紙張與深色夜間模式，聚焦論文發表與技術研究。
- **論文發表互動管理**：支援分類篩選（SCI 期刊、國際研討會、國內研討會、已接受）、關鍵字檢索、自動高亮本人姓名、DOI 連結與 **一鍵複製 BibTeX**。
- **純前端互動實驗室（Lab Tools）**：內建純瀏覽器端執行的 LSB 影像隱寫實驗室（支援嵌入、提取、PSNR/MSE 品質評估與位元平面鑑識視覺化），全程於本地端運算，不經任何伺服器。
- **個資與隱私保護設計**：
  - 遵循 ISO/IEC 27701 隱私保護原則，網站不追蹤、不紀錄、不上傳任何使用者輸入或影像資料。
  - 聯絡信箱採動態解碼（`src/utils/contact.ts`），靜態 HTML 與原始碼中不含明文 Email。
  - 不收錄手機、住址、學號、年齡、證書編號或產學內部資料庫細節；產學合作專案已去識別化。
  - `.gitignore` 預設封鎖 `.env`、`*.pdf` 與 `private/` 目錄，防止誤傳私人檔案。
- **高可擴充性**：所有內容皆集中於 `src/data/`，未來新增論文、專案、獎項或社群連結完全不需修改排版元件。

## 未來如何擴充內容

只需要編輯 `src/data/` 底下對應的檔案：

| 想要更新的內容 | 編輯檔案 |
|---|---|
| 個人簡介、研究領域、GitHub / Google Scholar / ORCID / LinkedIn 連結 | `src/data/profile.ts` |
| 新增已發表或已接受論文（自動更新計數、篩選器與 BibTeX） | `src/data/publications.ts` |
| 新增個人專案、開源作品或研究計畫 | `src/data/projects.ts` |
| 更新學歷、經歷或國科會／資安院計畫 | `src/data/experience.ts` |
| 新增榮譽獎項、證照或技能標籤 | `src/data/credentials.ts` |

## 部署到 GitHub Pages（自動化 CI/CD）

本專案已內建 `.github/workflows/deploy.yml`，且 `vite.config.ts` 使用相對路徑 `base: './'`，無論你的 Repo 名稱是 `YuuuuutoOuO.github.io` 或其他名稱皆可直接運作：

1. 在 GitHub 建立一個新的公開 Repository（建議命名為 `YuuuuutoOuO.github.io`，網址就會是 `https://yuuuuutoouo.github.io/`）。
2. 將本資料夾推送至 GitHub 的 `main` 分支：
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "feat: initialize academic & engineering portfolio"
   git remote add origin https://github.com/YuuuuutoOuO/YuuuuutoOuO.github.io.git
   git push -u origin main
   ```
3. 到 GitHub Repository 的 **Settings → Pages → Build and deployment**，將 **Source** 設為 **GitHub Actions**。
4. 之後每次 `git push` 至 `main`，GitHub Actions 會自動執行 TypeScript 型別檢查、建置並部署。

## 本地開發與預覽

需安裝 [Node.js LTS](https://nodejs.org/)（建議 v20+）：

```bash
npm install
npm run dev      # 啟動本地開發伺服器
npm run build    # TypeScript 檢查並建置正式版到 dist/
npm run preview  # 預覽正式建置結果
```
