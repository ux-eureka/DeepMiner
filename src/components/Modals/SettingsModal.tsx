import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  Key, 
  Server, 
  Cpu, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  Plus,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useAIConfig } from '../../context/AIConfigContext';
import { AIProvider, DEFAULT_CONFIGS } from '../../types/ai-config';
import { cn } from '../../utils/cn';

export const SettingsModal: React.FC = () => {
  const { 
    isOpen, 
    closeSettings, 
    config, 
    presets,
    currentPresetId,
    addPreset,
    updatePreset,
    deletePreset,
    selectPreset,
    updateConfig, 
    resetConfig, 
    testConnection, 
    isTesting, 
    testResult 
  } = useAIConfig();

  const [showApiKey, setShowApiKey] = useState(false);

  if (!isOpen) return null;

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ provider: e.target.value as AIProvider });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateConfig({ [name]: value });
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      updatePreset(currentPresetId, { name: e.target.value });
  };

  const handleAddPreset = () => {
      addPreset({
          name: 'New Preset',
          ...DEFAULT_CONFIGS.openai
      });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSettings();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex h-[70vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar - Presets List */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                  <h3 className="font-semibold text-slate-700">预设配置</h3>
                  <button 
                    onClick={handleAddPreset}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                    title="新建预设"
                  >
                      <Plus className="w-4 h-4" />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {presets.map(preset => (
                      <div 
                        key={preset.id}
                        onClick={() => selectPreset(preset.id)}
                        className={cn(
                            "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all border",
                            currentPresetId === preset.id 
                                ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100" 
                                : "border-transparent hover:bg-gray-100 text-slate-600"
                        )}
                      >
                          <div className="flex flex-col min-w-0">
                              <span className={cn(
                                  "text-sm font-medium truncate",
                                  currentPresetId === preset.id ? "text-blue-700" : "text-slate-700"
                              )}>
                                  {preset.name}
                              </span>
                              <span className="text-xs text-gray-400 truncate uppercase">
                                  {preset.provider}
                              </span>
                          </div>
                          {presets.length > 1 && (
                              <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(confirm('确定要删除这个预设吗？')) deletePreset(preset.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-all"
                              >
                                  <Trash2 className="w-3.5 h-3.5" />
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2 text-slate-700">
                <Settings className="w-5 h-5" />
                <h2 className="text-lg font-semibold">模型参数设置</h2>
                </div>
                <button
                onClick={closeSettings}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                <X className="w-5 h-5" />
                </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Preset Name */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">预设名称</label>
                    <input
                        type="text"
                        value={config.name}
                        onChange={handleNameChange}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 text-slate-700 font-medium"
                    />
                </div>

                {/* Provider Selection */}
                <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">AI 服务提供商</label>
                <div className="relative">
                    <select
                    name="provider"
                    value={config.provider}
                    onChange={handleProviderChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 text-slate-700"
                    >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="custom">Custom (OpenAI Compatible)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Activity className="w-4 h-4" />
                    </div>
                </div>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">API Key</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Key className="w-4 h-4" />
                    </div>
                    <input
                    type={showApiKey ? "text" : "password"}
                    name="apiKey"
                    value={config.apiKey}
                    onChange={handleInputChange}
                    placeholder={`Enter your ${config.provider} API Key`}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 text-slate-700 placeholder:text-gray-300 font-mono text-sm"
                    />
                    <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    密钥将仅在本地加密存储，不会上传至服务器。
                </p>
                </div>

                {/* Base URL & Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Base URL</label>
                    <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Server className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        name="baseUrl"
                        value={config.baseUrl}
                        onChange={handleInputChange}
                        placeholder="https://api.openai.com/v1"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 text-slate-700 text-sm"
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Model Name</label>
                    <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Cpu className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        name="model"
                        value={config.model}
                        onChange={handleInputChange}
                        placeholder="gpt-4-turbo"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 text-slate-700 text-sm"
                    />
                    </div>
                </div>
                </div>

                {/* Test Connection Result */}
                <AnimatePresence>
                {testResult && (
                    <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                        "p-4 rounded-lg flex items-start gap-3 text-sm",
                        testResult.success 
                        ? "bg-green-50 text-green-700 border border-green-100" 
                        : "bg-red-50 text-red-700 border border-red-100"
                    )}
                    >
                    {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    <div>
                        <p className="font-medium">{testResult.success ? "连接成功" : "连接失败"}</p>
                        <p className="opacity-90 mt-1">{testResult.message}</p>
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                onClick={resetConfig}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                <RotateCcw className="w-4 h-4" />
                恢复默认
                </button>
                
                <div className="flex items-center gap-3">
                <button
                    onClick={testConnection}
                    disabled={isTesting}
                    className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200",
                    isTesting && "opacity-70 cursor-not-allowed"
                    )}
                >
                    {isTesting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                        测试连接...
                    </>
                    ) : (
                    <>
                        <Activity className="w-4 h-4" />
                        测试连接
                    </>
                    )}
                </button>
                
                <button
                    onClick={closeSettings}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    保存并关闭
                </button>
                </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

