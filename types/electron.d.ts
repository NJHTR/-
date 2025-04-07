interface IpcRenderer {
  invoke(channel: string, ...args: any[]): Promise<any>;
}

interface Electron {
  ipcRenderer: IpcRenderer;
}

declare global {
  interface Window {
    electron: Electron;
  }
} 