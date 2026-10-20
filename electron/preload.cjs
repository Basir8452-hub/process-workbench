const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('workbench', {
  loadStore: () => ipcRenderer.invoke('store:load'),
  saveStore: (data) => ipcRenderer.invoke('store:save', data),
  backupStore: () => ipcRenderer.invoke('store:backup'),
  exportStore: () => ipcRenderer.invoke('store:export'),
  importStore: () => ipcRenderer.invoke('store:import'),
  saveExcel: (buffer, defaultName) => ipcRenderer.invoke('excel:save', buffer, defaultName),
  openExcel: () => ipcRenderer.invoke('excel:open'),
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  openDataFolder: (kind) => ipcRenderer.invoke('app:open-folder', kind),
  aiChat: (request) => ipcRenderer.invoke('ai:chat', request),
  fetchNewsFeeds: (feedUrls) => ipcRenderer.invoke('news:fetch', feedUrls),
  notify: (payload) => ipcRenderer.invoke('app:notify', payload),
})
