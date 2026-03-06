这个目录现在主要用于存放自动压缩后的网页图片。

请把原始大图放到：
- source-images/works/

执行 `npm run dev` 或 `npm run build` 后，会自动生成：
- /paintings/works/xxx.webp

然后在 public/data/artworks.json 中填写：
"cover": { "src": "/paintings/works/dawn-over-river-cover.webp", "alt": "作品封面图" }
"fullImage": { "src": "/paintings/works/dawn-over-river-full.webp", "alt": "作品完整图" }
