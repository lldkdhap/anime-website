# Anime Radar · 新番雷达

二次元新番资讯与随机看番网站。中文条目优先，聚合当季番剧、全球动漫 RSS，并通过 GSAP 卡牌翻转完成随机抽取。

## 技术栈

- Vite 8 + React 19 + TypeScript
- Tailwind CSS 4
- React Router 8
- Motion 14：路由转场、滚动进入、布局与手势
- GSAP 3.15 + `@gsap/react`：Hero 时间轴、ScrollTrigger 视差、随机翻卡
- TanStack Query 5：客户端请求缓存
- Zod 4：第三方响应校验
- `@tsparticles/react` 4：全局粒子背景
- Cloudflare Workers + Static Assets + `wrangler deploy`：RSS 聚合与缓存

## 数据来源

- Bangumi 官方 API：当季番剧主数据源，中文标题与简介优先。
- AniList GraphQL：Bangumi 不可用或条目不足时的整源回退。
- Anime News Network、Anime Corner：公开 RSS 新闻源。

浏览器只访问同源 `/api/*`，所有第三方请求、User-Agent 和缓存逻辑都在服务端完成。

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。Vite 内置本地 API 中间件，开发和线上使用同一套 `server/api-core.ts`。

可选：复制 `.env.example` 为 `.env`，把 `BANGUMI_USER_AGENT` 替换成带有个人 ID 与项目名的真实值。

## 脚本

```bash
npm run dev        # 开发服务器
npm run typecheck  # TypeScript 全工程检查
npm run lint       # oxlint
npm run test       # Vitest
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览 dist
```

## 接口

- `GET /api/season`：当前季度番剧，缓存 6 小时。
- `GET /api/news?limit=24`：聚合、去重、倒序后的资讯，缓存 15 分钟。
- `GET /api/anime/:source/:id`：番剧详情，缓存 24 小时。

来源为 `bangumi` 或 `anilist`。上游失败时返回结构化错误；新闻单源失败时保留可用内容并标记 `degraded: true`。

## 部署到 Cloudflare Workers

项目使用 Workers Static Assets：`worker/index.ts` 处理 `/api/*`，`dist/` 通过 `ASSETS` 绑定提供，SPA 深链接由 `not_found_handling: "single-page-application"` 处理。

首次部署：

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` 会先执行生产构建，再执行 `wrangler deploy`。相关配置位于 `wrangler.jsonc`，Cloudflare 免费计划即可使用。

建议在 Cloudflare 控制台或通过 Wrangler 设置番剧数据源 User-Agent：

```bash
npx wrangler secret put BANGUMI_USER_AGENT
npx wrangler secret put ANILIST_USER_AGENT
```

未设置时会使用内置默认值；Bangumi 不可达时接口会自动回退 AniList。

## 页面

- `/`：品牌首页、当季精选、资讯预览。
- `/news`：当季时间轴与响应式资讯瀑布流。
- `/random`：随机看番卡牌翻转。
- `/anime/:source/:id`：番剧详情。

动效分别由 Motion 与 GSAP 负责；检测到 `prefers-reduced-motion` 或移动端时会关闭粒子并缩短动画。