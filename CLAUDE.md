# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm run dev        # Development mode (Vite hot-reload + Electron concurrently)
npm run build      # Production build to dist/
npm start          # Run built app (requires build first)
npm run dev:vite   # Vite dev server only (http://localhost:5173)
```

## Project Architecture

**Electron + React pomodoro timer** with an Apple-inspired glass-morphism UI.

```
main.js              Electron main process — window, tray, IPC handlers
preload.js           contextBridge — exposes electronAPI to renderer
src/
  main.jsx           React entry — mounts <App /> in #root
  App.jsx            Single component containing all UI + timer logic
  index.css          Tailwind directives + glass-morphism utilities
  index.html         HTML shell
  assets/icon.png    App icon (tray + notification)
tailwind.config.mjs  Custom theme (Apple colors, glass blur, spring animations)
vite.config.mjs      Vite config (root=src/, output=dist/)
postcss.config.mjs   Tailwind + autoprefixer
```

## Key Design Decisions

- **Single-file component** — `App.jsx` holds all React state, timer logic, and rendering. No React Router or external state library.
- **Frameless transparent window** — Drag region via `.drag-region` CSS class with `-webkit-app-region: drag`. Window is non-resizable (480×620).
- **Dark/light mode** — Controlled by a boolean `darkMode` state, toggles `dark` class on `<html>`.
- **Timer state machine** — Three states: `idle → running → paused`. Uses `setInterval` + `useRef` for ticks. Stale closures avoided via `tickRef`/`onCompleteRef` pattern.
- **IPC bridge** — `window.electronAPI` exposed via preload for: notifications, quit, minimize-to-tray, always-on-top.
- **Web Audio chime** — Two-tone sine wave synthesized in-browser (no audio file dependency).
- **Pomodoro cycle** — 4 focus sessions → long break, then short breaks between. Auto-advances after a 500ms delay.

## Timer Modes

| Mode       | Duration | Color     |
|------------|----------|-----------|
| Focus      | 25:00    | Red       |
| Short Break| 5:00     | Green     |
| Long Break | 15:00    | Blue      |
