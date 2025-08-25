 // AI对话生成图片应用
class ChatApp {
    constructor() {
        this.chatArea = document.getElementById('chatArea');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.imageArea = document.getElementById('imageArea');
        
        // 图片历史记录
        this.generatedImages = [];
        
        // 硅基流动API配置
        this.apiConfig = {
            // 硅基流动API端点
            chatEndpoint: 'https://api.siliconflow.cn/v1/chat/completions',
            imageEndpoint: 'https://api.siliconflow.cn/v1/images/generations',
            apiKey: 'sk-xdrtnwmuscwrzcexskpkszttqehszgmhzadzhngzkzbmfwgi', // 硅基流动API密钥
            imageModel: 'Kwai-Kolors/Kolors', // 图片生成模型
            chatModel: 'Qwen/Qwen2.5-7B-Instruct' // 对话模型
        };
        
        this.init();
    }
    
    init() {
        // 绑定发送按钮事件
        this.sendBtn.addEventListener('click', () => {
            this.handleSubmit();
        });
        
        // 输入框回车发送
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit();
            }
        });
        
        // 自动聚焦输入框
        this.userInput.focus();
    }
    
    handleSubmit() {
        const message = this.userInput.value.trim();
        if (!message) return;
        
        // 添加用户消息
        this.addMessage(message, 'user');
        
        // 清空输入框
        this.userInput.value = '';
        
        // 禁用发送按钮
        this.setLoadingState(true);
        
        // 显示加载指示器
        const loadingId = this.showLoading();
        
        // 处理消息
        this.processMessage(message, loadingId);
    }
    
    async processMessage(message, loadingId) {
        try {
            // 模拟API调用延迟
            await this.delay(1000);
            
            // 检查是否是图片生成请求
            const isImageRequest = this.checkImageRequest(message);
            
            if (isImageRequest) {
                // 生成AI回复
                const aiResponse = `正在为您生成图片："${message}"`;
                this.removeLoading(loadingId);
                this.addMessage(aiResponse, 'ai');
                
                // 生成图片
                await this.generateImage(message);
            } else {
                // 普通对话回复
                const aiResponse = await this.getChatResponse(message);
                this.removeLoading(loadingId);
                this.addMessage(aiResponse, 'ai');
            }
        } catch (error) {
            this.removeLoading(loadingId);
            this.showError('抱歉，处理您的请求时出现了错误。请稍后再试。');
            console.error('处理消息错误:', error);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    checkImageRequest(message) {
        // 检查消息是否包含图片生成关键词
        const imageKeywords = ['生成', '创建', '画', '图片', '图像', '照片', 'generate', 'create', 'draw', 'image', 'picture'];
        return imageKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }
    
    async getChatResponse(message) {
        // 调用硅基流动聊天API
        
        try {
            const response = await fetch(this.apiConfig.chatEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.apiConfig.chatModel,
                    messages: [
                        {role: 'system', content: '你是一个友好的AI助手，可以帮助用户生成图片。当用户想生成图片时，请友好地确认并帮助优化描述。'},
                        {role: 'user', content: message}
                    ],
                    stream: false
                })
            });
            
            if (!response.ok) {
                console.error('Chat API错误:', response.status);
                return this.getDefaultResponse(message);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Chat API调用失败:', error);
            // 如果API调用失败，返回默认响应
            return this.getDefaultResponse(message);
        }
    }
    
    getDefaultResponse(message) {
        // 默认响应逻辑
        const responses = [
            '我理解您的需求。如果您想生成图片，请详细描述您想要的图像内容。',
            '很高兴与您交流！您可以告诉我想要生成什么样的图片。',
            '我可以帮您生成各种风格的图片，请描述您的创意！',
            '这是个有趣的想法！您想要我为您生成相关的图片吗？'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    async generateImage(prompt) {
        try {
            // 显示生成中提示
            this.showImageGenerating();
            
            // 调用硅基流动图片生成API
            const response = await fetch(this.apiConfig.imageEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.apiConfig.imageModel,
                    prompt: prompt,
                    image_size: '1024x1024', // 图片尺寸
                    batch_size: 1, // 批量大小
                    num_inference_steps: 20, // 推理步数
                    guidance_scale: 7.5 // 引导比例
                })
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('图片生成API错误:', response.status, errorData);
                
                // 移除生成指示器
                const indicator = document.getElementById('generating-indicator');
                if (indicator) indicator.remove();
                
                throw new Error(`图片生成失败: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 移除生成指示器
            const indicator = document.getElementById('generating-indicator');
            if (indicator) indicator.remove();
            
            if (data.images && data.images.length > 0) {
                const imageUrl = data.images[0].url;
                this.displayImage(imageUrl, prompt);
                this.addMessage('✨ 图片生成成功！您可以在右侧查看。', 'ai');
                
                // 提醒用户图片链接有效期
                this.addMessage('💡 提示：生成的图片链接有效期为1小时，如需保存请及时下载。', 'ai');
            } else {
                throw new Error('未返回图片数据');
            }
        } catch (error) {
            // 移除生成指示器
            const indicator = document.getElementById('generating-indicator');
            if (indicator) indicator.remove();
            
            this.showError('图片生成失败，请稍后再试。错误信息：' + error.message);
            console.error('图片生成错误:', error);
        }
    }
    
    displayImage(url, prompt) {
        // 清除"无数据"提示
        const noDataMsg = this.imageArea.querySelector('.text-gray-500');
        if (noDataMsg) {
            noDataMsg.remove();
        }
        
        // 创建图片容器
        const imageWrapper = document.createElement('div');
        const imageId = 'img-' + Date.now();
        imageWrapper.id = imageId;
        imageWrapper.className = 'cyber-image-container animate-fade-in mb-4';
        
        const timestamp = new Date().toLocaleTimeString();
        imageWrapper.innerHTML = `
            <div class="cyber-image rounded-lg overflow-hidden relative group">
                <img src="${url}" 
                     alt="${this.escapeHtml(prompt)}" 
                     class="w-full h-auto"
                     loading="lazy">
                <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="chatApp.regenerateImage('${imageId}', '${this.escapeHtml(prompt).replace(/'/g, "\\'")}')" 
                            class="cyber-btn p-2 rounded text-xs"
                            title="重新生成">
                        REGENERATE
                    </button>
                    <button onclick="window.open('${url}', '_blank')" 
                            class="cyber-btn p-2 rounded text-xs"
                            title="下载图片">
                        DOWNLOAD
                    </button>
                </div>
                <div class="p-3 bg-black bg-opacity-50">
                    <p class="text-xs text-green-400 truncate" title="${this.escapeHtml(prompt)}">${this.escapeHtml(prompt)}</p>
                    <p class="text-xs text-cyan-500 mt-1">[${timestamp}]</p>
                    <p class="text-xs text-yellow-400 mt-1">⚠ EXPIRES IN 1H</p>
                </div>
            </div>
        `;
        
        // 添加到容器顶部
        this.imageArea.insertBefore(imageWrapper, this.imageArea.firstChild);
        
        // 保存到历史记录
        this.generatedImages.push({ url, prompt, timestamp: new Date(), id: imageId });
        
        // 限制显示的图片数量
        if (this.imageArea.children.length > 5) {
            this.imageArea.removeChild(this.imageArea.lastChild);
        }
        
        // 图片加载错误处理
        const img = imageWrapper.querySelector('img');
        img.onerror = () => {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iT3JiaXRyb24iIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZjAwZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FUlJPUjwvdGV4dD48L3N2Zz4=';
            img.alt = '[ ERROR ] LOAD FAILED';
        };
    }
    
    async regenerateImage(imageId, prompt) {
        // 找到要替换的图片容器
        const imageContainer = document.getElementById(imageId);
        if (!imageContainer) {
            this.showError('无法找到要重新生成的图片');
            return;
        }
        
        // 显示重新生成动画
        const originalContent = imageContainer.innerHTML;
        imageContainer.innerHTML = `
            <div class="border-2 border-dashed border-purple-500 rounded-lg p-8 text-center">
                <div class="cyber-loader mx-auto mb-4"></div>
                <p class="text-purple-400 uppercase tracking-wider animate-pulse">Regenerating...</p>
                <p class="text-xs text-gray-500 mt-2">[ Recalculating Neural Patterns ]</p>
            </div>
        `;
        
        try {
            // 调用API重新生成图片
            const response = await fetch(this.apiConfig.imageEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.apiConfig.imageModel,
                    prompt: prompt,
                    image_size: '1024x1024',
                    batch_size: 1,
                    num_inference_steps: 20,
                    guidance_scale: 7.5
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP错误! 状态: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.images && data.images.length > 0) {
                // 更新图片
                const newUrl = data.images[0].url;
                const timestamp = new Date().toLocaleTimeString();
                
                imageContainer.innerHTML = `
                    <div class="cyber-image rounded-lg overflow-hidden relative group">
                        <img src="${newUrl}" 
                             alt="${this.escapeHtml(prompt)}" 
                             class="w-full h-auto"
                             loading="lazy">
                        <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="chatApp.regenerateImage('${imageId}', '${this.escapeHtml(prompt).replace(/'/g, "\\'")}')" 
                                    class="cyber-btn p-2 rounded text-xs"
                                    title="重新生成">
                                REGENERATE
                            </button>
                            <button onclick="window.open('${newUrl}', '_blank')" 
                                    class="cyber-btn p-2 rounded text-xs"
                                    title="下载图片">
                                DOWNLOAD
                            </button>
                        </div>
                        <div class="p-3 bg-black bg-opacity-50">
                            <p class="text-xs text-green-400 truncate" title="${this.escapeHtml(prompt)}">${this.escapeHtml(prompt)}</p>
                            <p class="text-xs text-cyan-500 mt-1">[${timestamp}] <span class="text-purple-400">REGENERATED</span></p>
                            <p class="text-xs text-yellow-400 mt-1">⚠ EXPIRES IN 1H</p>
                        </div>
                    </div>
                `;
                
                // 添加成功闪烁效果
                imageContainer.classList.add('animate-pulse');
                setTimeout(() => {
                    imageContainer.classList.remove('animate-pulse');
                }, 1000);
                
                // 更新历史记录
                const index = this.generatedImages.findIndex(img => img.id === imageId);
                if (index !== -1) {
                    this.generatedImages[index].url = newUrl;
                    this.generatedImages[index].timestamp = new Date();
                }
                
            } else {
                throw new Error('未收到新的图片数据');
            }
        } catch (error) {
            // 恢复原始内容
            imageContainer.innerHTML = originalContent;
            this.showError(`重新生成失败: ${error.message}`);
            console.error('重新生成图片失败:', error);
        }
    }
    
    showImageGenerating() {
        const generatingDiv = document.createElement('div');
        generatingDiv.id = 'generating-indicator';
        generatingDiv.className = 'cyber-image-container animate-fade-in mb-4';
        generatingDiv.innerHTML = `
            <div class="border-2 border-dashed border-green-500 rounded-lg p-8 text-center">
                <div class="cyber-loader mx-auto mb-4"></div>
                <p class="text-green-400 uppercase tracking-wider animate-pulse">Synthesizing Image...</p>
                <p class="text-xs text-gray-500 mt-2">[ Neural Network Processing ]</p>
            </div>
        `;
        
        // 清除"无数据"提示
        const noDataMsg = this.imageArea.querySelector('.text-gray-500');
        if (noDataMsg) {
            noDataMsg.remove();
        }
        
        this.imageArea.insertBefore(generatingDiv, this.imageArea.firstChild);
        
        // 2秒后自动移除（如果还存在）
        setTimeout(() => {
            const indicator = document.getElementById('generating-indicator');
            if (indicator) {
                indicator.remove();
            }
        }, 2000);
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        
        if (type === 'user') {
            messageDiv.className = 'message-user rounded-lg p-3 md:p-4 max-w-[90%] sm:max-w-[80%] ml-auto animate-fade-in';
            messageDiv.innerHTML = `
                <p class="text-pink-300 text-sm md:text-base">
                    <span class="text-xs uppercase tracking-wider text-pink-500">[ USER ]</span><br>
                    ${this.escapeHtml(content)}
                </p>
            `;
        } else if (type === 'ai') {
            messageDiv.className = 'message-ai rounded-lg p-3 md:p-4 max-w-[90%] sm:max-w-[80%] animate-fade-in';
            messageDiv.innerHTML = `
                <p class="text-cyan-300 text-sm md:text-base">
                    <span class="text-xs uppercase tracking-wider text-cyan-500">[ SYSTEM ]</span><br>
                    ${this.escapeHtml(content)}
                </p>
            `;
        } else if (type === 'error') {
            messageDiv.className = 'message-ai rounded-lg p-3 md:p-4 max-w-[90%] sm:max-w-[80%] animate-fade-in border-red-500';
            messageDiv.innerHTML = `
                <p class="text-red-400 text-sm md:text-base">
                    <span class="text-xs uppercase tracking-wider text-red-500">[ ERROR ]</span><br>
                    ${this.escapeHtml(content)}
                </p>
            `;
        }
        
        this.chatArea.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-' + Date.now();
        loadingDiv.className = 'message-ai rounded-lg p-3 md:p-4 max-w-[90%] sm:max-w-[80%] animate-fade-in';
        loadingDiv.innerHTML = `
            <div class="flex items-center gap-2 md:gap-3">
                <div class="cyber-loader"></div>
                <span class="text-cyan-400 text-sm md:text-base uppercase tracking-wider animate-pulse">Processing...</span>
            </div>
        `;
        this.chatArea.appendChild(loadingDiv);
        this.scrollToBottom();
        return loadingDiv.id;
    }
    
    removeLoading(loadingId) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    showError(message) {
        this.addMessage(`❌ ${message}`, 'error');
    }
    
    setLoadingState(isLoading) {
        this.sendBtn.disabled = isLoading;
        this.userInput.disabled = isLoading;
        
        if (!isLoading) {
            this.userInput.focus();
        }
    }
    
    scrollToBottom() {
        this.chatArea.scrollTop = this.chatArea.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    
    // 将app实例暴露到window对象，以便按钮的onclick事件可以访问
    window.chatApp = app;
    
    // 显示欢迎消息
    app.addMessage('欢迎使用AI图片生成器！请输入您想生成的图片描述。', 'ai');
    
    // 网络状态监听
    window.addEventListener('online', () => {
        console.log('网络已恢复');
    });
    
    window.addEventListener('offline', () => {
        console.log('网络已断开');
        app.showError('网络连接已断开，请检查您的网络设置。');
    });
});
