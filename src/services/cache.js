const { ipcRenderer } = window.require('electron');

export const cache = {
    async loadGlobalSettings() {
        return await ipcRenderer.invoke('load-global-settings');
    },

    async saveGlobalSettings(settings) {
        return await ipcRenderer.invoke('save-global-settings', settings);
    },

    async loadUISettings() {
        return await ipcRenderer.invoke('load-ui-settings');
    },

    async saveUISettings(settings) {
        return await ipcRenderer.invoke('save-ui-settings', settings);
    },

    async loadRepoData(repoPath) {
        return await ipcRenderer.invoke('load-repo-data', repoPath);
    },

    async saveRepoData(repoPath, data) {
        return await ipcRenderer.invoke('save-repo-data', repoPath, data);
    },

    async updateRecentRepos(repoPath) {
        return await ipcRenderer.invoke('update-recent-repos', repoPath);
    }
};