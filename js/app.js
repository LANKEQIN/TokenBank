/**
 * TokenBank 主应用模块
 * 负责页面交互和业务逻辑协调
 */
const App = {
    /**
     * 当前编辑的平台 ID
     */
    editingPlatformId: null,

    /**
     * 当前步骤
     */
    currentStep: 1,

    /**
     * 总步骤数
     */
    totalSteps: 3,

    /**
     * 初始化应用
     */
    init() {
        this.initTheme();
        this.bindEvents();
        this.render();
    },

    /**
     * 初始化主题
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    },

    /**
     * 设置主题
     * @param {string} theme - 主题名称 'light' 或 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const toggleBtn = document.getElementById('themeToggle');
        toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    },

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        document.getElementById('addPlatformBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('platformForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        document.getElementById('platformModal').addEventListener('click', (e) => {
            if (e.target.id === 'platformModal') {
                this.closeModal();
            }
        });

        document.querySelectorAll('input[name="platformType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleTypeChange(e));
        });

        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());
    },

    /**
     * 处理平台类型变化
     * @param {Event} e - 事件对象
     */
    handleTypeChange(e) {
        const type = e.target.value;
        const platformNameGroup = document.getElementById('platformNameGroup');
        const platformNameInput = document.getElementById('platformName');

        if (type === 'other') {
            platformNameGroup.style.display = 'block';
            platformNameInput.placeholder = '请输入自定义平台名称';
            platformNameInput.focus();
        } else {
            platformNameGroup.style.display = 'none';
            platformNameInput.value = '';
        }
    },

    /**
     * 渲染页面
     */
    render() {
        this.renderStats();
        this.renderPlatforms();
    },

    /**
     * 渲染统计信息
     */
    renderStats() {
        const platforms = PlatformManager.getAllPlatforms();
        
        document.getElementById('totalPlatforms').textContent = platforms.length;
        
        const totals = PlatformManager.getTotalBalance();
        let totalText = '';
        Object.entries(totals).forEach(([currency, amount]) => {
            const symbol = PlatformManager.getCurrencySymbol(currency);
            if (currency === 'tokens') {
                totalText += `${amount.toLocaleString()} ${symbol} `;
            } else {
                totalText += `${symbol}${amount.toFixed(2)} `;
            }
        });
        document.getElementById('totalBalance').textContent = totalText || '0.00';
        
        const expiringCount = PlatformManager.getExpiringSoonCount(7);
        document.getElementById('expiringSoon').textContent = expiringCount;
    },

    /**
     * 渲染平台列表
     */
    renderPlatforms() {
        const platforms = PlatformManager.getAllPlatforms();
        const grid = document.getElementById('platformsGrid');
        
        if (platforms.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📊</div>
                    <h3>还没有添加任何平台</h3>
                    <p>点击上方"添加平台"按钮开始记录您的 AI 平台额度</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = platforms.map(platform => this.createPlatformCard(platform)).join('');
        
        grid.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editPlatform(btn.dataset.id));
        });
        
        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deletePlatform(btn.dataset.id));
        });
    },

    /**
     * 创建平台卡片 HTML
     * @param {Object} platform - 平台数据
     * @returns {string} 卡片 HTML
     */
    createPlatformCard(platform) {
        const typeIcon = PlatformManager.getTypeIcon(platform.type);
        const typeName = PlatformManager.getTypeName(platform.type);
        const balanceText = PlatformManager.formatBalance(platform.balance, platform.currency);
        const balanceStatus = platform.plan 
            ? PlatformManager.getBalanceStatusByPlan(platform.balance, platform.currency, platform.plan)
            : PlatformManager.getBalanceStatus(platform.balance, platform.currency);
        const expiryText = PlatformManager.formatDate(platform.expiryDate);
        const isExpiring = PlatformManager.isExpiringSoon(platform.expiryDate);
        
        const planIcon = PlatformManager.getPlanIcon(platform.plan);
        const planName = PlatformManager.getPlanName(platform.plan);
        const planClass = platform.plan || '';
        
        return `
            <div class="platform-card">
                <div class="platform-header">
                    <div>
                        <div class="platform-name">${typeIcon} ${platform.name}</div>
                        <div class="platform-tags">
                            <span class="platform-tag type">${typeName}</span>
                            ${platform.plan ? `<span class="platform-tag plan ${planClass}">${planIcon} ${planName}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="platform-balance ${balanceStatus}">${balanceText}</div>
                <div class="platform-info">货币: ${platform.currency}</div>
                <div class="platform-info ${isExpiring ? 'warning' : ''}">过期: ${expiryText}</div>
                ${platform.notes ? `<div class="platform-info" style="margin-top: 0.5rem;">${platform.notes}</div>` : ''}
                <div class="platform-actions">
                    <button class="btn btn-secondary btn-sm edit-btn" data-id="${platform.id}">编辑</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${platform.id}">删除</button>
                </div>
            </div>
        `;
    },

    /**
     * 打开模态框
     * @param {Object} platform - 要编辑的平台数据（可选）
     */
    openModal(platform = null) {
        const modal = document.getElementById('platformModal');
        const form = document.getElementById('platformForm');
        const title = document.getElementById('modalTitle');
        
        form.reset();
        this.currentStep = 1;
        
        if (platform) {
            this.editingPlatformId = platform.id;
            title.textContent = '编辑平台';
            document.getElementById('platformId').value = platform.id;
            const platformTypeRadio = document.querySelector(`input[name="platformType"][value="${platform.type}"]`);
            if (platformTypeRadio) {
                platformTypeRadio.checked = true;
            }
            document.getElementById('planType').value = platform.plan || '';
            document.getElementById('balance').value = platform.balance;
            document.getElementById('currency').value = platform.currency;
            document.getElementById('expiryDate').value = platform.expiryDate || '';
            document.getElementById('notes').value = platform.notes || '';
            
            if (platform.type === 'other') {
                document.getElementById('platformName').value = platform.name;
            }
        } else {
            this.editingPlatformId = null;
            title.textContent = '添加平台';
        }

        this.handleTypeChange({ target: document.querySelector('input[name="platformType"]:checked') || { value: '' } });
        this.updateStepUI();
        
        modal.classList.add('active');
    },

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('platformModal');
        modal.classList.remove('active');
        this.editingPlatformId = null;
    },

    /**
     * 处理表单提交
     * @param {Event} e - 表单事件
     */
    handleFormSubmit(e) {
        e.preventDefault();
        
        const platformTypeRadio = document.querySelector('input[name="platformType"]:checked');
        const platformType = platformTypeRadio ? platformTypeRadio.value : '';
        let platformName = document.getElementById('platformName').value;
        
        if (platformType !== 'other') {
            platformName = PlatformManager.getTypeName(platformType);
        }
        
        const data = {
            name: platformName,
            type: platformType,
            plan: document.getElementById('planType').value || null,
            balance: document.getElementById('balance').value,
            currency: document.getElementById('currency').value,
            expiryDate: document.getElementById('expiryDate').value,
            notes: document.getElementById('notes').value
        };
        
        const validation = PlatformManager.validatePlatform(data);
        if (!validation.valid) {
            alert(validation.errors.join('\n'));
            return;
        }
        
        let success;
        if (this.editingPlatformId) {
            success = PlatformManager.updatePlatform(this.editingPlatformId, data);
        } else {
            success = PlatformManager.createPlatform(data);
        }
        
        if (success) {
            this.closeModal();
            this.render();
        } else {
            alert('操作失败，请重试');
        }
    },

    /**
     * 编辑平台
     * @param {string} id - 平台 ID
     */
    editPlatform(id) {
        const platform = PlatformManager.getPlatform(id);
        if (platform) {
            this.openModal(platform);
        }
    },

    /**
     * 删除平台
     * @param {string} id - 平台 ID
     */
    deletePlatform(id) {
        if (confirm('确定要删除这个平台吗？此操作不可恢复。')) {
            const success = PlatformManager.deletePlatform(id);
            if (success) {
                this.render();
            } else {
                alert('删除失败，请重试');
            }
        }
    },

    /**
     * 进入下一步
     */
    nextStep() {
        if (!this.validateStep(this.currentStep)) {
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepUI();
        }
    },

    /**
     * 返回上一步
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
        }
    },

    /**
     * 更新步骤 UI
     */
    updateStepUI() {
        const steps = document.querySelectorAll('.step-indicator');
        const stepContents = document.querySelectorAll('.wizard-step');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            if (stepNum < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNum === this.currentStep) {
                step.classList.add('active');
            }
        });

        stepContents.forEach((content, index) => {
            const stepNum = index + 1;
            if (stepNum === this.currentStep) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });

        if (this.currentStep === 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-block';
        }

        if (this.currentStep === this.totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
            this.updateSummary();
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    },

    /**
     * 验证当前步骤
     * @param {number} step - 步骤编号
     * @returns {boolean} 验证结果
     */
    validateStep(step) {
        if (step === 1) {
            const platformTypeRadio = document.querySelector('input[name="platformType"]:checked');
            const platformType = platformTypeRadio ? platformTypeRadio.value : '';
            if (!platformType) {
                alert('请选择平台类型');
                return false;
            }
            if (platformType === 'other') {
                const platformName = document.getElementById('platformName').value;
                if (!platformName.trim()) {
                    alert('请输入自定义平台名称');
                    return false;
                }
            }
        } else if (step === 2) {
            const balance = document.getElementById('balance').value;
            const currency = document.getElementById('currency').value;
            if (!balance || parseFloat(balance) <= 0) {
                alert('请输入有效的额度');
                return false;
            }
            if (!currency) {
                alert('请选择货币类型');
                return false;
            }
        }
        return true;
    },

    /**
     * 更新确认信息
     */
    updateSummary() {
        const platformTypeRadio = document.querySelector('input[name="platformType"]:checked');
        const platformType = platformTypeRadio ? platformTypeRadio.value : '';
        const platformName = platformType === 'other' 
            ? document.getElementById('platformName').value 
            : PlatformManager.getTypeName(platformType);
        const planType = document.getElementById('planType').value;
        const balance = document.getElementById('balance').value;
        const currency = document.getElementById('currency').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const notes = document.getElementById('notes').value;

        const planName = planType ? PlatformManager.getPlanName(planType) : '无';
        const planIcon = planType ? PlatformManager.getPlanIcon(planType) : '';
        const typeIcon = PlatformManager.getTypeIcon(platformType);
        const typeName = PlatformManager.getTypeName(platformType);

        document.getElementById('summaryName').textContent = platformName;
        document.getElementById('summaryType').textContent = `${typeIcon} ${typeName}`;
        document.getElementById('summaryPlan').textContent = planType ? `${planIcon} ${planName}` : '无';
        document.getElementById('summaryBalance').textContent = `${balance} ${currency}`;
        document.getElementById('summaryCurrency').textContent = currency;
        document.getElementById('summaryExpiry').textContent = expiryDate || '未设置';
        document.getElementById('summaryNotes').textContent = notes || '无';
    }
};

/**
 * 页面加载完成后初始化应用
 */
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
