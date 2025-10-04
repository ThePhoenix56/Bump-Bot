const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startTask: (token, guildId, channelId) => {
    ipcRenderer.send('start-task', { token, guildId, channelId });
  },

  stopTask: (id) => {
    ipcRenderer.send('stop-task', id);
  },

  onTasksUpdated: (callback) => {
    ipcRenderer.on('tasks-updated', (_, tasks) => {
      callback(tasks);
    });
  },

  loadTokens: () => {
    ipcRenderer.send('load-tokens');
  },

  onTokensLoaded: (callback) => {
    ipcRenderer.on('tokens-loaded', (_, data) => {
      callback(data);
    });
  }
});
