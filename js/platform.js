/**
 * 平台数据管理模块
 * 负责平台数据的业务逻辑处理
 */
const PlatformManager = {
    /**
     * 平台类型配置
     */
    platformTypes: {
        aliyun: { name: '阿里云百炼', icon: '🔷' },
        volcano: { name: '火山引擎', icon: '🌋' },
        deepseek: { name: 'DeepSeek', icon: '🔮' },
        openrouter: { name: 'OpenRouter', icon: '🌐' },
        openai: { name: 'OpenAI', icon: '🤖' },
        anthropic: { name: 'Anthropic', icon: '🧠' },
        zhipu: { name: '智谱AI', icon: '💡' },
        moonshot: { name: 'Moonshot', icon: '🌙' },
        other: { name: '其他', icon: '📦' }
    },

    /**
     * 计划类型配置
     */
    planTypes: {
        free: { name: '免费版', icon: '🆓', color: '#64748b', description: '基础功能，有限额度' },
        basic: { name: '基础版', icon: '🥉', color: '#10b981', description: '标准功能，中等额度' },
        pro: { name: '专业版', icon: '🥈', color: '#3b82f6', description: '高级功能，较大额度' },
        enterprise: { name: '企业版', icon: '🥇', color: '#8b5cf6', description: '完整功能，无限额度' },
        custom: { name: '定制版', icon: '⚡', color: '#f59e0b', description: '自定义配置' },
        volcano_collab: { name: '火山协作计划', icon: '🔥', color: '#ff6b35', description: '每天刷新200万token额度', dailyRefresh: true, dailyTokens: 2000000 }
    },

    /**
     * 获取所有平台
     * @returns {Array} 平台数据数组
     */
    getAllPlatforms() {
        return StorageManager.getPlatforms();
    },

    /**
     * 获取单个平台
     * @param {string} id - 平台 ID
     * @returns {Object|null} 平台数据对象或 null
     */
    getPlatform(id) {
        return StorageManager.getPlatformById(id);
    },

    /**
     * 创建新平台
     * @param {Object} data - 平台数据
     * @returns {boolean} 是否创建成功
     */
    createPlatform(data) {
        const platform = {
            name: data.name,
            type: data.type,
            plan: data.plan || null,
            balance: parseFloat(data.balance),
            currency: data.currency || 'CNY',
            expiryDate: data.expiryDate || null,
            notes: data.notes || ''
        };
        return StorageManager.addPlatform(platform);
    },

    /**
     * 更新平台信息
     * @param {string} id - 平台 ID
     * @param {Object} data - 更新的数据
     * @returns {boolean} 是否更新成功
     */
    updatePlatform(id, data) {
        const updates = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.type !== undefined) updates.type = data.type;
        if (data.plan !== undefined) updates.plan = data.plan;
        if (data.balance !== undefined) updates.balance = parseFloat(data.balance);
        if (data.currency !== undefined) updates.currency = data.currency;
        if (data.expiryDate !== undefined) updates.expiryDate = data.expiryDate;
        if (data.notes !== undefined) updates.notes = data.notes;
        return StorageManager.updatePlatform(id, updates);
    },

    /**
     * 删除平台
     * @param {string} id - 平台 ID
     * @returns {boolean} 是否删除成功
     */
    deletePlatform(id) {
        return StorageManager.deletePlatform(id);
    },

    /**
     * 更新平台余额
     * @param {string} id - 平台 ID
     * @param {number} balance - 新余额
     * @returns {boolean} 是否更新成功
     */
    updateBalance(id, balance) {
        return StorageManager.updateBalance(id, balance);
    },

    /**
     * 获取平台类型显示名称
     * @param {string} type - 平台类型代码
     * @returns {string} 显示名称
     */
    getTypeName(type) {
        return this.platformTypes[type]?.name || type;
    },

    /**
     * 获取平台类型图标
     * @param {string} type - 平台类型代码
     * @returns {string} 图标
     */
    getTypeIcon(type) {
        return this.platformTypes[type]?.icon || '📦';
    },

    /**
     * 获取货币符号
     * @param {string} currency - 货币代码
     * @returns {string} 货币符号
     */
    getCurrencySymbol(currency) {
        const symbols = {
            CNY: '¥',
            USD: '$',
            tokens: 'tokens'
        };
        return symbols[currency] || currency;
    },

    /**
     * 格式化余额显示
     * @param {number} balance - 余额
     * @param {string} currency - 货币代码
     * @returns {string} 格式化后的余额
     */
    formatBalance(balance, currency) {
        const symbol = this.getCurrencySymbol(currency);
        if (currency === 'tokens') {
            return `${balance.toLocaleString()} ${symbol}`;
        }
        return `${symbol}${balance.toFixed(2)}`;
    },

    /**
     * 获取余额状态
     * @param {number} balance - 余额
     * @param {string} currency - 货币代码
     * @returns {string} 状态类名
     */
    getBalanceStatus(balance, currency) {
        return '';
    },

    /**
     * 检查平台是否即将过期
     * @param {string} expiryDate - 过期日期
     * @param {number} days - 天数阈值
     * @returns {boolean} 是否即将过期
     */
    isExpiringSoon(expiryDate, days = 7) {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= days;
    },

    /**
     * 获取即将过期的平台数量
     * @param {number} days - 天数阈值
     * @returns {number} 即将过期的平台数量
     */
    getExpiringSoonCount(days = 7) {
        const platforms = this.getAllPlatforms();
        return platforms.filter(p => this.isExpiringSoon(p.expiryDate, days)).length;
    },

    /**
     * 计算总余额（按货币类型分组）
     * @returns {Object} 各货币类型的总余额
     */
    getTotalBalance() {
        const platforms = this.getAllPlatforms();
        const totals = {};
        
        platforms.forEach(platform => {
            const currency = platform.currency;
            if (!totals[currency]) {
                totals[currency] = 0;
            }
            totals[currency] += platform.balance;
        });
        
        return totals;
    },

    /**
     * 格式化日期显示
     * @param {string} dateStr - 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '未设置';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * 验证平台数据
     * @param {Object} data - 平台数据
     * @returns {Object} 验证结果 { valid: boolean, errors: Array }
     */
    validatePlatform(data) {
        const errors = [];
        
        if (!data.name || data.name.trim() === '') {
            errors.push('平台名称不能为空');
        }
        
        if (data.balance === undefined || data.balance === null || data.balance === '') {
            errors.push('余额不能为空');
        } else if (isNaN(data.balance) || parseFloat(data.balance) < 0) {
            errors.push('余额必须是有效的非负数');
        }
        
        if (data.expiryDate) {
            const expiryDate = new Date(data.expiryDate);
            if (isNaN(expiryDate.getTime())) {
                errors.push('过期日期格式不正确');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * 获取计划类型显示名称
     * @param {string} plan - 计划类型代码
     * @returns {string} 显示名称
     */
    getPlanName(plan) {
        return this.planTypes[plan]?.name || '未设置';
    },

    /**
     * 获取计划类型图标
     * @param {string} plan - 计划类型代码
     * @returns {string} 图标
     */
    getPlanIcon(plan) {
        return this.planTypes[plan]?.icon || '';
    },

    /**
     * 获取计划类型颜色
     * @param {string} plan - 计划类型代码
     * @returns {string} 颜色值
     */
    getPlanColor(plan) {
        return this.planTypes[plan]?.color || '#64748b';
    },

    /**
     * 获取计划类型描述
     * @param {string} plan - 计划类型代码
     * @returns {string} 描述信息
     */
    getPlanDescription(plan) {
        return this.planTypes[plan]?.description || '';
    },

    /**
     * 根据计划类型获取余额阈值
     * @param {string} plan - 计划类型代码
     * @returns {Object} 阈值配置 { low: number, critical: number }
     */
    getPlanThresholds(plan) {
        const thresholds = {
            free: { low: 10, critical: 5 },
            basic: { low: 50, critical: 20 },
            pro: { low: 100, critical: 50 },
            enterprise: { low: 500, critical: 200 },
            custom: { low: 100, critical: 50 }
        };
        return thresholds[plan] || { low: 50, critical: 20 };
    },

    /**
     * 根据计划类型获取余额状态
     * @param {number} balance - 余额
     * @param {string} currency - 货币代码
     * @param {string} plan - 计划类型代码
     * @returns {string} 状态类名
     */
    getBalanceStatusByPlan(balance, currency, plan) {
        return '';
    },

    /**
     * 按计划类型分组统计平台
     * @returns {Object} 各计划类型的平台数量和总余额
     */
    getStatsByPlan() {
        const platforms = this.getAllPlatforms();
        const stats = {};
        
        Object.keys(this.planTypes).forEach(plan => {
            stats[plan] = {
                count: 0,
                totalBalance: 0,
                platforms: []
            };
        });
        
        platforms.forEach(platform => {
            const plan = platform.plan || 'free';
            if (stats[plan]) {
                stats[plan].count++;
                stats[plan].totalBalance += platform.balance;
                stats[plan].platforms.push(platform);
            }
        });
        
        return stats;
    },

    /**
     * 获取计划优先级（用于排序）
     * @param {string} plan - 计划类型代码
     * @returns {number} 优先级数值（越高越重要）
     */
    getPlanPriority(plan) {
        const priorities = {
            enterprise: 5,
            pro: 4,
            basic: 3,
            custom: 2,
            free: 1,
            volcano_collab: 6
        };
        return priorities[plan] || 0;
    },

    /**
     * 检查计划是否支持每日刷新
     * @param {string} plan - 计划类型代码
     * @returns {boolean} 是否支持每日刷新
     */
    isDailyRefreshPlan(plan) {
        return this.planTypes[plan]?.dailyRefresh || false;
    },

    /**
     * 获取计划的每日token额度
     * @param {string} plan - 计划类型代码
     * @returns {number} 每日token额度
     */
    getDailyTokens(plan) {
        return this.planTypes[plan]?.dailyTokens || 0;
    },

    /**
     * 获取计划的最后刷新日期
     * @param {string} platformId - 平台ID
     * @returns {string|null} 最后刷新日期
     */
    getLastRefreshDate(platformId) {
        const platform = this.getPlatform(platformId);
        return platform?.lastRefreshDate || null;
    },

    /**
     * 检查是否需要刷新额度
     * @param {string} platformId - 平台ID
     * @returns {boolean} 是否需要刷新
     */
    needsRefresh(platformId) {
        const platform = this.getPlatform(platformId);
        if (!platform || !this.isDailyRefreshPlan(platform.plan)) {
            return false;
        }
        
        const lastRefresh = platform.lastRefreshDate;
        if (!lastRefresh) {
            return true;
        }
        
        const today = new Date().toDateString();
        const lastRefreshDate = new Date(lastRefresh).toDateString();
        return today !== lastRefreshDate;
    },

    /**
     * 刷新平台的每日额度
     * @param {string} platformId - 平台ID
     * @returns {boolean} 是否刷新成功
     */
    refreshDailyBalance(platformId) {
        const platform = this.getPlatform(platformId);
        if (!platform || !this.isDailyRefreshPlan(platform.plan)) {
            return false;
        }
        
        const dailyTokens = this.getDailyTokens(platform.plan);
        const today = new Date().toISOString();
        
        const success = StorageManager.updatePlatform(platformId, {
            balance: dailyTokens,
            currency: 'tokens',
            lastRefreshDate: today
        });
        
        return success;
    },

    /**
     * 批量刷新所有需要刷新的平台额度
     * @returns {number} 刷新的平台数量
     */
    refreshAllDailyPlatforms() {
        const platforms = this.getAllPlatforms();
        let refreshedCount = 0;
        
        platforms.forEach(platform => {
            if (this.needsRefresh(platform.id)) {
                if (this.refreshDailyBalance(platform.id)) {
                    refreshedCount++;
                }
            }
        });
        
        return refreshedCount;
    },

    /**
     * 获取平台显示的余额信息（包含刷新提示）
     * @param {Object} platform - 平台数据
     * @returns {Object} 余额显示信息
     */
    getBalanceDisplayInfo(platform) {
        const isDailyRefresh = this.isDailyRefreshPlan(platform.plan);
        const needsRefresh = isDailyRefresh && this.needsRefresh(platform.id);
        const dailyTokens = this.getDailyTokens(platform.plan);
        
        return {
            balanceText: this.formatBalance(platform.balance, platform.currency),
            isDailyRefresh,
            needsRefresh,
            dailyTokens,
            lastRefreshDate: platform.lastRefreshDate
                ? new Date(platform.lastRefreshDate).toLocaleDateString('zh-CN')
                : '从未刷新'
        };
    }
};
