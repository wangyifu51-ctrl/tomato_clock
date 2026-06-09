# 🍅 番茄钟 - Pomodoro Timer

一款 Apple 风格的精美桌面番茄钟应用，使用 Electron + React 构建。

![screenshot](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![tech](https://img.shields.io/badge/tech-Electron%20%7C%20React%20%7C%20Tailwind%20%7C%20Vite-blue)

## ✨ 特性

- ⏱️ **番茄工作法** — 25 分钟专注 + 5 分钟短休息 + 15 分钟长休息
- 🎨 **玻璃拟态 UI** — Apple 风格毛玻璃效果，支持深色/浅色模式
- 🔄 **自动循环** — 4 个番茄后自动进入长休息
- 🔊 **提示音** — 双音阶合成铃声，无需音频文件
- 🖥️ **系统托盘** — 关闭窗口自动最小化到托盘
- 🪟 **无边框窗口** — 简洁沉浸式体验

## 🚀 快速开始

```bash
# 克隆项目
git clone git@github.com:wangyifu51-ctrl/tomato_clock.git
cd tomato_clock

# 安装依赖
npm install

# 启动开发模式（Vite 热更新 + Electron）
npm run dev
```

## 📦 构建生产版本

```bash
npm run build      # 构建前端
npm start          # 运行 Electron 应用
```

## 🎮 使用说明

| 操作 | 说明 |
|------|------|
| 点击 **开始** | 启动计时器 |
| 点击 **暂停** | 暂停当前计时 |
| 点击 **重置** | 重置当前模式计时 |
| 切换 **专注/短休息/长休息** | 切换模式（需在空闲时） |
| 🌙/☀️ | 切换深色/浅色模式 |
| ✕ | 关闭到系统托盘 |

## 🛠️ 技术栈

- **前端**: React 19 + Tailwind CSS 3
- **桌面框架**: Electron
- **构建工具**: Vite
- **动画**: CSS spring 动画 + SVG 环形进度条
- **音效**: Web Audio API

## 📁 项目结构

```
tomato_clock/
├── main.js              # Electron 主进程
├── preload.js           # IPC 通信桥接
├── src/
│   ├── App.jsx          # 主组件（计时器+UI）
│   ├── index.css        # Tailwind + 毛玻璃样式
│   ├── index.html       # HTML 入口
│   └── main.jsx         # React 挂载点
├── assets/
│   └── icon.png         # 应用图标
├── tailwind.config.mjs  # Tailwind 主题配置
└── vite.config.mjs      # Vite 构建配置
```

## 📄 许可证

MIT
