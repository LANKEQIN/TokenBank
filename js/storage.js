/**
 * 数据存储管理模块
 * 负责所有数据的本地存储和读取操作
 */
const StorageManager = {
    /**
     * 存储键名常量
     */
    STORAGE_KEY: 'tokenbank_platforms',

    /**
     * 从 localStorage 获取所有平台数据
     * @returns {Array} 平台数据数组
     */
    getPlatforms() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取数据失败:', error);
            return [];
        }
    },

    /**
     * 保存平台数据到 localStorage
     * @param {Array} platforms - 平台数据数组
     * @returns {boolean} 是否保存成功
     */
    savePlatforms(platforms) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(platforms));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    /**
     * 添加单个平台
     * @param {Object} platform - 平台数据对象
     * @returns {boolean} 是否添加成功
     */
    addPlatform(platform) {
        const platforms = this.getPlatforms();
        platform.id = this.generateId();
        platform.createdAt = new Date().toISOString();
        platform.updatedAt = new Date().toISOString();
        platforms.push(platform);
        return this.savePlatforms(platforms);
    },

    /**
     * 更新单个平台
     * @param {string} id - 平台 ID
     * @param {Object} updates - 要更新的字段
     * @returns {boolean} 是否更新成功
     */
    updatePlatform(id, updates) {
        const platforms = this.getPlatforms();
        const index = platforms.findIndex(p => p.id === id);
        if (index === -1) return false;
        
        platforms[index] = {
            ...platforms[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        return this.savePlatforms(platforms);
    },

    /**
     * 删除单个平台
     * @param {string} id - 平台 ID
     * @returns {boolean} 是否删除成功
     */
    deletePlatform(id) {
        const platforms = this.getPlatforms();
        const filtered = platforms.filter(p => p.id !== id);
        if (filtered.length === platforms.length) return false;
        return this.savePlatforms(filtered);
    },

    /**
     * 根据 ID 获取单个平台
     * @param {string} id - 平台 ID
     * @returns {Object|null} 平台数据对象或 null
     */
    getPlatformById(id) {
        const platforms = this.getPlatforms();
        return platforms.find(p => p.id === id) || null;
    },

    /**
     * 更新平台余额
     * @param {string} id - 平台 ID
     * @param {number} balance - 新的余额
     * @returns {boolean} 是否更新成功
     */
    updateBalance(id, balance) {
        return this.updatePlatform(id, { balance: parseFloat(balance) });
    },

    /**
     * 生成唯一 ID
     * @returns {string} 唯一 ID
     */
    generateId() {
        return 'platform_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 清空所有数据
     * @returns {boolean} 是否清空成功
     */
    clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    },

    /**
     * 导出数据为 JSON
     * @returns {string} JSON 格式的数据
     */
    exportData() {
        const platforms = this.getPlatforms();
        return JSON.stringify(platforms, null, 2);
    },

    /**
     * 导入 JSON 数据
     * @param {string} jsonData - JSON 格式的数据
     * @returns {boolean} 是否导入成功
     */
    importData(jsonData) {
        try {
            const platforms = JSON.parse(jsonData);
            if (!Array.isArray(platforms)) throw new Error('数据格式错误');
            return this.savePlatforms(platforms);
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
};
