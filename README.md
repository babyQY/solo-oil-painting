# 油画作品集静态站

一个已经可运行、可构建、可静态部署的个人油画作品网站项目。

这个项目专门为下面这种工作流设计：

- 你只在本地放置原始图片
- 你只改静态 `JSON` 配置
- 不租服务器
- 不用数据库
- 用免费的静态托管公开分享给任何人访问

## 当前效果

项目目前已经包含：

- 顶部导航
- 沉浸式首页 Hero
- 精选作品区
- 可筛选、可搜索的作品画廊
- 点击查看作品详情弹层
- 完整图与细节图切换
- 维护说明区
- 联系与分享区
- 自动压缩 5M 左右的大图
- 更友好的手机端浏览体验

## 本地启动

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
```

构建结果会输出到 `dist/`。

## 你以后只需要改哪里

### 1. 站点基本信息

编辑：

- `public/data/site.json`

这里维护：

- 网站标题
- 首页说明
- 你的名字
- 联系邮箱
- 社交链接
- 页面文案

### 2. 所有作品数据

编辑：

- `public/data/artworks.json`

这里维护每一幅作品的：

- `slug`
- `title`
- `category`
- `series`
- `year`
- `medium`
- `size`
- `description`
- `tags`
- `featured`
- `cover`
- `fullImage`
- `details`

### 3. 40 幅油画原图放哪里

建议就按下面放：

- `source-images/works/`：原始作品图、封面图、完整图
- `source-images/details/`：原始局部细节图

构建时会自动压缩，并输出到：

- `public/paintings/works/README.txt`
- `public/paintings/details/README.txt`
- `public/paintings/works/`
- `public/paintings/details/`

原图目录里我也放了说明文件：

- `source-images/works/README.txt`
- `source-images/details/README.txt`

## 一条作品数据怎么写

在 `public/data/artworks.json` 里追加一个对象，例如：

```json
{
  "slug": "autumn-river",
  "title": "秋河",
  "category": "风景",
  "series": "河岸记录",
  "year": "2026",
  "medium": "布面油画",
  "size": "80 x 60 cm",
  "description": "这里写作品介绍。",
  "tags": ["风景", "河流", "暖灰色调"],
  "featured": true,
  "cover": {
    "src": "/paintings/works/autumn-river-cover.webp",
    "alt": "秋河封面图"
  },
  "fullImage": {
    "src": "/paintings/works/autumn-river-full.webp",
    "alt": "秋河完整图"
  },
  "details": [
    {
      "src": "/paintings/details/autumn-river-detail-1.webp",
      "alt": "秋河细节图一"
    },
    {
      "src": "/paintings/details/autumn-river-detail-2.webp",
      "alt": "秋河细节图二"
    }
  ]
}
```

## 免费部署方案

这个项目适合部署到以下免费平台：

- `GitHub Pages`
- `Cloudflare Pages`
- `Netlify`

其中我更推荐：

### 方案 A：Cloudflare Pages

优点：

- 免费
- 配置简单
- 自带 CDN 分发
- 国内外访问体验通常都不错

构建配置：

- Build command: `npm run build`
- Output directory: `dist`

### 方案 B：GitHub Pages

优点：

- 完全免费
- 和代码仓库整合自然
- 非常适合个人静态作品站

因为项目已经把 `vite.config.ts` 设成了相对资源路径，所以部署到子路径环境也更稳妥。

## 你真正录入 40 幅作品时的建议

- 每幅作品至少准备 1 张封面图
- 每幅作品准备 1 张完整图
- 每幅作品准备 2 到 4 张细节图
- 图片原始尺寸可以较大，压缩会在构建时自动完成
- 先录入 8 到 12 幅做第一版上线，然后逐步补全到 40 幅

## 当前占位资源

项目里现在用了几张占位图，方便你先看到完整页面结构。你后续只要把 JSON 里的路径替换成自己的图片路径即可。
