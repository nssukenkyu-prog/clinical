# Clinical Training Simulator (臨床実習スケジュールシミュレーター)

## 概要 (Overview)
2026年度の臨床実習に向けたスケジューリングの実現可能性を検証するためのシミュレーションツールです。
学生100名が、限られた施設キャパシティと時間の中で、必須実習時間（例: 21時間）を期間内に完了できるかをシミュレーションします。

### 主な機能 (Features)
- **詳細なパラメーター設定**: 学生数、必要時間、同時最大人数、実施期間、実習時間の最小/最大値などを調整可能。
- **授業スケジュールの考慮**: 曜日・時限ごとの「授業（実習不可）」時間帯を設定し、それを避けた予約を自動計算。
- **高度なカレンダー制御**: 曜日ごとの開講設定に加え、特定の祝日や特別休講日をカレンダー上でクリックして設定可能。
- **可変的行動シミュレーション**: 学生の「サボり」や「不定期な参加」を確率モデルで再現し、現実的な完了ペースを予測。
- **可視化ダッシュボード**:
  - 実習完了可否（Success/Fail）
  - 全学生の完了予定日
  - 日別の施設稼働率グラフ (ボトルネックの特定)
  - 全学生100名の詳細スケジュール一覧
  - 完了までの所要日数ヒストグラム

## 技術スタック (Tech Stack)
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Date Handling**: date-fns

## セットアップ (Setup)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## デプロイ (Deployment)
GitHub Pages または Vercel/Netlify 等の静的ホスティングサービスにデプロイ可能です。
`npm run build` で生成される `dist/` ディレクトリを使用してください。
