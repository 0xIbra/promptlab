const { app } = window.require('@electron/remote');
const path = window.require('path');
const fs = window.require('fs').promises;
const os = window.require('os');

class Cache {
    constructor() {
        // Base cache directory: ~/.cache/repo-prompter/
        this.cacheDir = path.join(os.homedir(), '.cache', 'repo-prompter');
        this.ensureCacheDir();
    }

    async ensureCacheDir() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create cache directory:', error);
        }
    }

    // Get cache file path for a specific repo
    getRepoCachePath(repoPath) {
        // Create a safe filename from the repo path
        const safeRepoId = Buffer.from(repoPath).toString('base64');
        return path.join(this.cacheDir, `${safeRepoId}.json`);
    }

    // Save repo-specific data
    async saveRepoData(repoPath, data) {
        try {
            const cachePath = this.getRepoCachePath(repoPath);
            await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save repo cache:', error);
        }
    }

    // Load repo-specific data
    async loadRepoData(repoPath) {
        try {
            const cachePath = this.getRepoCachePath(repoPath);
            const data = await fs.readFile(cachePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Return default data structure if cache doesn't exist
            return {
                filters: [],
                lastOpened: new Date().toISOString(),
                selectedFiles: [],
                instructions: '',
                templates: []
            };
        }
    }

    // Save global app settings
    async saveGlobalSettings(settings) {
        try {
            const settingsPath = path.join(this.cacheDir, 'settings.json');
            await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
        } catch (error) {
            console.error('Failed to save global settings:', error);
        }
    }

    // Load global app settings
    async loadGlobalSettings() {
        try {
            const settingsPath = path.join(this.cacheDir, 'settings.json');
            const data = await fs.readFile(settingsPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Return default settings if file doesn't exist
            return {
                lastOpenedRepo: null,
                recentRepos: [],
                theme: 'dark',
                windowSize: { width: 1200, height: 800 }
            };
        }
    }

    // Update recent repos list
    async updateRecentRepos(repoPath) {
        const settings = await this.loadGlobalSettings();
        const recentRepos = settings.recentRepos || [];

        // Remove if exists and add to front
        const updatedRepos = [
            repoPath,
            ...recentRepos.filter(repo => repo !== repoPath)
        ].slice(0, 10); // Keep only last 10

        await this.saveGlobalSettings({
            ...settings,
            lastOpenedRepo: repoPath,
            recentRepos: updatedRepos
        });
    }

    // Save instruction templates
    async saveTemplates(templates) {
        try {
            const templatesPath = path.join(this.cacheDir, 'templates.json');
            await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
        } catch (error) {
            console.error('Failed to save templates:', error);
        }
    }

    // Load instruction templates
    async loadTemplates() {
        try {
            const templatesPath = path.join(this.cacheDir, 'templates.json');
            const data = await fs.readFile(templatesPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
}

// Export singleton instance
export const cache = new Cache();