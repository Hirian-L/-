# 天策模拟器（简版）

	抓住后跳翻滚的奶花吧！ 小心她变得嚣张噢！ 

说明：
- 游戏中间有一个矩形按节奏翻滚：每次翻滚耗时 0.9s，之后会有 0.2s 的停顿窗口。
- 在停顿窗口内按空格键视为抓取成功，成功后游戏暂停，等待再次按空格继续。
- 每次翻滚完成后有 50% 概率触发一次持续 1.2s 的大旋转，且每 6s 最多触发一次。
- 大旋转前后没有停顿。



## 本地测试方法（不可食用/施工中）
网页版（本地测试）
-----------------

我已添加一个静态网页版本，文件：

- `index.html`
- `script.js`
- `styles.css`

运行方法：

1) 直接在浏览器中打开 `index.html`（多数情况下可直接打开）。

或者使用 Python 本地服务器（推荐）：

```powershell
cd C:\Users\EDY\12
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

页面行为：

- 矩形位于画面中央，按桌面版规则翻滚、停顿与大旋转。
- 在停顿 0.2s 窗口内按空格或点击视为抓取成功，抓取成功后暂停，按空格或点击继续。

如需我把网页文件打包成单一 HTML（便于直接发送/托管）、加入音效或移动端优化，告诉我具体需求，我会继续实现。
 
分享与托管
-----------------

我已生成一个单文件版 `tiance_single.html`，你可以直接把这个文件发给他人，或在任意静态主机上托管。文件在：

`C:\Users\EDY\12\tiance_single.html`

推荐的分享/托管方法：

1) 直接发送单文件（最简单）
	- 将 `tiance_single.html` 发给对方，对方在浏览器中打开即可。

2) 使用 GitHub Pages（可长期托管且免费）
	- 在本地目录初始化 git：

```powershell
cd C:\Users\EDY\12
git init
git add .
git commit -m "Add tian ce mini-game"
# 在 GitHub 创建一个新仓库（或使用已有仓库）然后：
git remote add origin <your-github-repo-url>
git push -u origin main
```

	- 在 GitHub 仓库设置中启用 GitHub Pages (Settings → Pages)，选择 `main` 分支和根目录（/），保存后几分钟内页面可访问。

3) 使用简单的静态托管（Netlify / Vercel / Surge 等）
	- 这些服务都支持直接拖放单文件或连接 GitHub 仓库进行自动部署。

4) 使用本地临时共享（用于测试）
	- Python 内置 http 服务：

```powershell
cd C:\Users\EDY\12
python -m http.server 8000
# 访问 http://localhost:8000/tiance_single.html
```

如果你希望我替你：
- 把当前文件夹初始化为 Git 仓库并生成一个 `README.md` 的改进版本（我可以完成本地修改，但需要你执行 `git push` 到远端）；
- 或把页面打包到一个 ZIP 文件并准备一个可下载链接（需要你提供上传位置或授权）。

告诉我你更希望哪种分享方式，我将继续完成对应步骤或生成更详细的操作指南。

说明：
- 伤害计算为 `max(0, ATK - DEF * 0.5)`，并带有 0.85-1.15 的浮动。
- 模拟简单且易于扩展：可增加技能、暴击、治疗、队伍、AI 策略等。

后续建议：
- 若需复杂规则（技能冷却、效果链、阵营、回合队列），我可以继续扩展。
- 也可做一个小的 Web/GUI 前端用于交互配置与可视化结果。