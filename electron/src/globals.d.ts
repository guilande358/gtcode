// electron/src/globals.d.ts
declare module 'electron' {
  export * from 'electron';
}

declare module 'electron-serve' {
  const content: any;
  export default content;
}

declare module 'electron-updater' {
  export const autoUpdater: any;
}

declare module 'electron-window-state' {
  const content: any;
  export default content;
}

declare module 'electron-is-dev' {
  const content: boolean;
  export default content;
}

declare module 'electron-unhandled' {
  const content: any;
  export default content;
}

// tipos para o processo principal do Electron
declare namespace NodeJS {
  interface Process {
    type: string;
  }
}
