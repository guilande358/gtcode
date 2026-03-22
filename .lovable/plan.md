

# Deploy & Device Debug Page

## Overview
Create a new full-page route `/deploy` with a "Deploy & Device Debug" page. Add navigation between the Studio (editor) and this new page via toolbar buttons. The page provides two modes: Browser Preview and Android Device mirroring via Scrcpy over socket.io.

## Architecture

```text
App.tsx
├── / → GcodeForceStudio (existing)
└── /deploy → DeployDebugPage (new)

DeployDebugPage
├── Header (back to studio link, title)
├── Two tab cards: Browser Preview | Android Device
├── Android panel:
│   ├── Connection type (USB / Wireless + IP input)
│   ├── Scrcpy presets (radio cards)
│   ├── Custom flags input
│   ├── Start/Stop button
│   ├── File upload for scrcpy binaries
│   └── Terminal log output area
└── Session history (localStorage)
```

## Files to Create

### 1. `src/pages/DeployDebug.tsx`
Main page component with:
- Two large cards/tabs at top: "Browser Preview" (green) and "Android Device (Scrcpy)" (orange)
- Browser preview: simple "Run in Browser" button that navigates back to studio
- Android panel with all controls described in requirements
- Dark neon styling with glowing borders, consistent with game engine aesthetic

### 2. `src/hooks/useScrcpySocket.ts`
Socket.io hook that:
- Connects to `import.meta.env.VITE_BACKEND_URL` (falls back to `localhost:3001`)
- Emits `execute` with command strings, `interrupt` to kill
- Listens to `output` (stdout/stderr), `command-end`, `clear-terminal`
- Exposes: `connect()`, `sendCommand()`, `interrupt()`, `logs[]`, `isConnected`, `isRunning`

### 3. `src/hooks/useDebugSessions.ts`
Simple localStorage hook to save/load recent debug sessions (date, flags, IP, connection type, status).

## Files to Modify

### 4. `src/App.tsx`
- Add route: `/deploy` → `DeployDebugPage`

### 5. `src/components/studio/Toolbar.tsx`
- Add a "Deploy & Debug" icon button (Smartphone icon) that navigates to `/deploy`

### 6. `package.json`
- Add `socket.io-client` dependency

## UI Design Details

- Dark neon theme: cards with `border-cyan-500/30` glow, orange/green accent buttons
- Terminal log area: monospace font, green text for stdout, red for stderr, auto-scroll
- Scrcpy presets as selectable radio cards with description
- Upload area with drag-and-drop styling, shows uploaded files list
- Responsive: stacks vertically on mobile
- Ctrl+C button next to terminal to send interrupt

## Key Technical Decisions

- Socket.io connection is lazy (only connects when user clicks "Start")
- No actual scrcpy execution in browser — commands are sent to backend via socket.io
- The page is standalone (no 3D canvas needed)
- Session history stored in localStorage with max 20 entries
- File upload stores references locally (names + sizes) since actual binary handling is server-side

