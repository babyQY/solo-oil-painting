这个目录现在主要用于存放自动压缩后的网页细节图。

请把原始大图放到：
- source-images/details/

执行 `npm run dev` 或 `npm run build` 后，会自动生成：
- /paintings/details/xxx.webp

然后在 public/data/artworks.json 中填写：
"details": [
  { "src": "/paintings/details/dawn-over-river-detail-1.webp", "alt": "局部细节图一" },
  { "src": "/paintings/details/dawn-over-river-detail-2.webp", "alt": "局部细节图二" }
]
