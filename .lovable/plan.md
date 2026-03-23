

# Capacitor Desktop/Mobile Setup + Deploy Page Polish

## Overview

Add Capacitor configuration to make GcodeForce Studio buildable as a native desktop app (Windows/Mac via Electron) and mobile app (iOS/Android). The existing Deploy & Debug page already has full Scrcpy/socket.io integration -- this plan focuses on the Capacitor scaffolding and package.json scripts.

## Changes

### 1. Create `capacitor.config.ts`
- appId: `com.gcodeforce.studio`
- appName: `GcodeForce Studio`
- webDir: `dist`
- server config with `androidScheme: "https"` and `cleartext: true`
- Dev server URL pointing to sandbox preview

### 2. Update `package.json`
Add dependencies:
- `@capacitor/core`
- `@capacitor/cli` (dev)
- `@capacitor/ios`
- `@capacitor/android`
- `@capacitor-community/electron`

Add scripts:
- `cap:add:electron`, `cap:add:platforms`, `cap:sync`, `cap:run:electron`, `cap:build:electron`

### 3. Update `vite.config.ts`
- Add `base: './'` so Electron file:// loading works correctly

### 4. Update `README.md`
Add build instructions for desktop (Electron) and mobile (iOS/Android) including:
- `npm run build && npx cap sync`
- `npx cap add @capacitor-community/electron`
- `npx cap run @capacitor-community/electron`

### 5. Update PWA manifest (`public/manifest.json`)
- Ensure `name`, `short_name`, `start_url`, `display: standalone`, theme/background colors, and icons are set for installable PWA

## Technical Notes
- The existing socket.io integration in `useScrcpySocket.ts` already uses `VITE_BACKEND_URL` with fallback to `localhost:3001`
- The Deploy & Debug page already has full theme support
- No backend code is added to the project (Node.js server remains external)
- Capacitor plugins are installed but `npx cap add` / `npx cap sync` must be run locally by the user after cloning

