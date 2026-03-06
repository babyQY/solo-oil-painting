# 免费部署说明

这个项目是纯静态站，构建后只会产出 `dist/` 目录，不需要服务器，不需要数据库。

## 推荐方案一：Cloudflare Pages

适合想要最省心、带 CDN 分发的免费部署。

### 操作步骤

1. 把项目上传到 GitHub 仓库
2. 登录 Cloudflare
3. 打开 `Workers & Pages`
4. 选择 `Create application`
5. 选择 `Pages`
6. 连接你的 GitHub 仓库
7. 构建配置填写：

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

8. 点击部署

部署完成后，你会得到一个：

- `https://你的项目名.pages.dev`

这个地址就是公开可访问的静态网站地址，Cloudflare 会自动做 CDN 分发。

## 推荐方案二：GitHub Pages

适合想完全依赖 GitHub 免费托管。

### 简单方式

1. 本地执行：

```bash
npm run build
```

2. 把 `dist/` 内的内容发布到 GitHub Pages 对应分支

也可以后续加 GitHub Actions 自动部署，但这一步不是必须。

## 更新网站的方法

以后你每次更新网站，只需要：

1. 把原始图片放进 `source-images/works/` 和 `source-images/details/`
2. 修改 `public/data/site.json` 或 `public/data/artworks.json`
3. 执行 `npm run build`，构建前会自动压缩图片
4. 重新部署

## 关于 CDN

你要求“任何人都可以访问，且不花钱”，静态托管平台本身就会帮你做这件事：

- 页面文件通过 CDN 分发
- 图片资源通过 CDN 分发
- 不需要你自己购买服务器

## 当前项目为什么适合免费托管

- 没有后端服务
- 没有数据库
- 没有登录系统
- 没有付费依赖
- 所有内容都是静态文件

这就是最适合免费托管的站点类型之一。
