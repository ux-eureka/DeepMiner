import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AIConfig, AIPreset, DEFAULT_CONFIG } from '../types/ai-config';
import CryptoJS from 'crypto-js';

// --- Types & Interfaces ---

interface AIConfigContextType {
  config: AIPreset;
  presets: AIPreset[];
  currentPresetId: string;
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  
  // Preset Management
  addPreset: (preset: Omit<AIPreset, 'id'>) => void;
  updatePreset: (id: string, updates: Partial<AIPreset>) => void;
  deletePreset: (id: string) => void;
  selectPreset: (id: string) => void;
  
  // Legacy/Convenience wrappers (operate on current preset)
  updateConfig: (newConfig: Partial<AIConfig>) => void;
  resetConfig: () => void;
  
  testConnection: () => Promise<boolean>;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
}

// --- Constants & Security ---

const STORAGE_KEY = 'deepminer_ai_config'; // Legacy key
const PRESETS_STORAGE_KEY = 'deepminer_ai_presets';
const CURRENT_PRESET_KEY = 'deepminer_current_preset_id';
const AUDIT_LOG_KEY = 'deepminer_audit_log';

// Use a fixed key for local encryption (In a real app, this should be user-derived or managed by a backend)
// Since this is a client-side app, we use a hardcoded salt to obfuscate, but it's not truly secure against local admin access.
const ENCRYPTION_SECRET = 'deepminer-local-secure-salt-v1';

const encrypt = (text: string): string => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, ENCRYPTION_SECRET).toString();
};

const decrypt = (ciphertext: string): string => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_SECRET);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // Fallback for legacy base64 if AES fails (migration path)
    if (!originalText && ciphertext.length > 0) {
       try { return atob(ciphertext); } catch { return ciphertext; }
    }
    return originalText;
  } catch (e) {
    // Try legacy base64
    try { return atob(ciphertext); } catch { return ciphertext; }
  }
};

const logAudit = (action: string, details: string) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        details,
        userId: 'local-user' // Single user app
    };
    
    try {
        const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
        logs.push(logEntry);
        // Keep last 100 logs
        if (logs.length > 100) logs.shift();
        localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (e) {
        console.error('Audit log failed', e);
    }
};

// Access Environment Variables (injected by Vite)
const ENV_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

// Known leaked key to be scrubbed
const LEAKED_KEY = 'sk-kooqclttpgqfvetifmnzxkvedqamviujdjpxajkcmbwriaze';

const DEFAULT_PRESET: AIPreset = {
    id: 'default',
    name: (ENV_API_KEY && ENV_BASE_URL) ? 'System Environment' : 'Default',
    isDefault: true,
    apiKey: ENV_API_KEY,
    baseUrl: ENV_BASE_URL || DEFAULT_CONFIG.baseUrl,
    model: DEFAULT_CONFIG.model,
    temperature: DEFAULT_CONFIG.temperature,
    maxTokens: DEFAULT_CONFIG.maxTokens
};

// --- Context ---

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [presets, setPresets] = useState<AIPreset[]>([DEFAULT_PRESET]);
  const [currentPresetId, setCurrentPresetId] = useState<string>('default');
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Ref to track if initial load is done to avoid overwriting storage with default state
  const isLoaded = useRef(false);

  // Derived current config
  const currentConfig = presets.find(p => p.id === currentPresetId) || presets[0] || DEFAULT_PRESET;

  // 1. Load config from local storage on mount (DOMContentLoaded equivalent)
  useEffect(() => {
    const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
    const savedCurrentId = localStorage.getItem(CURRENT_PRESET_KEY);
    const legacyConfig = localStorage.getItem(STORAGE_KEY);

    if (savedPresets) {
      try {
        const parsedPresets: AIPreset[] = JSON.parse(savedPresets);
        // Decrypt API keys and scrub leaked keys
        const decryptedPresets = parsedPresets.map(p => {
            const rawKey = p.apiKey ? decrypt(p.apiKey) : '';
            return {
                ...p,
                apiKey: rawKey === LEAKED_KEY ? '' : rawKey
            };
        });
        
        // Merge Environment Config
        if (ENV_API_KEY && ENV_BASE_URL) {
            const defaultIndex = decryptedPresets.findIndex(p => p.id === 'default');
            const envPreset = { ...DEFAULT_PRESET };
            
            if (defaultIndex >= 0) {
                decryptedPresets[defaultIndex] = { ...decryptedPresets[defaultIndex], ...envPreset };
            } else {
                decryptedPresets.unshift(envPreset);
            }
        }
        
        setPresets(decryptedPresets);
        
        if (savedCurrentId && decryptedPresets.some(p => p.id === savedCurrentId)) {
            setCurrentPresetId(savedCurrentId);
        } else if (decryptedPresets.length > 0) {
            setCurrentPresetId(decryptedPresets[0].id);
        }
      } catch (e) {
        console.error('Failed to load AI presets:', e);
      }
    } else if (legacyConfig) {
        // Migration logic
        try {
            const parsed = JSON.parse(legacyConfig);
            if (parsed.apiKey) parsed.apiKey = decrypt(parsed.apiKey);
            if (parsed.apiKey === LEAKED_KEY) parsed.apiKey = '';

            const migratedPreset: AIPreset = {
                id: 'migrated-legacy',
                name: 'Migrated Config',
                ...DEFAULT_CONFIG,
                ...(() => {
                    const { provider: _provider, ...rest } = parsed;
                    return rest;
                })()
            };
            setPresets([migratedPreset, DEFAULT_PRESET]);
            setCurrentPresetId('migrated-legacy');
            logAudit('MIGRATE', 'Migrated legacy configuration');
        } catch (e) {
            console.error('Failed to migrate legacy config:', e);
        }
    } else if (ENV_API_KEY && ENV_BASE_URL) {
        setPresets([DEFAULT_PRESET]);
        setCurrentPresetId('default');
    }
    
    isLoaded.current = true;
  }, []);

  // 2. Persistence with Idempotency Check
  // We use a ref to store the last saved state string to avoid dirty writes
  const lastSavedState = useRef<string>('');

  useEffect(() => {
      if (!isLoaded.current) return;

      const presetsToSave = presets.map(p => ({
          ...p,
          // Encrypt API Key (skip if matching env var to avoid redundancy)
          apiKey: (ENV_API_KEY && p.apiKey === ENV_API_KEY) ? '' : (p.apiKey ? encrypt(p.apiKey) : '')
      }));
      
      const serialized = JSON.stringify(presetsToSave);
      
      // Idempotency: Only write if changed
      if (serialized !== lastSavedState.current) {
          localStorage.setItem(PRESETS_STORAGE_KEY, serialized);
          lastSavedState.current = serialized;
          logAudit('SAVE', `Saved ${presets.length} presets`);
      }
  }, [presets]);

  useEffect(() => {
      if (!isLoaded.current) return;
      localStorage.setItem(CURRENT_PRESET_KEY, currentPresetId);
  }, [currentPresetId]);

  // Preset Actions
  const addPreset = (presetData: Omit<AIPreset, 'id'>) => {
      if (presets.length >= 10) {
          alert("Maximum 10 presets allowed.");
          return;
      }
      const newPreset: AIPreset = {
          ...presetData,
          id: Date.now().toString()
      };
      setPresets(prev => [...prev, newPreset]);
      setCurrentPresetId(newPreset.id);
      logAudit('CREATE', `Created preset ${newPreset.id}`);
  };

  const updatePreset = (id: string, updates: Partial<AIPreset>) => {
      // Check for sensitive changes for audit
      if (updates.apiKey) {
          logAudit('UPDATE_KEY', `Updated API key for preset ${id}`);
      }
      
      setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePreset = (id: string) => {
      if (presets.length <= 1) {
          alert("Cannot delete the last preset.");
          return;
      }
      setPresets(prev => {
          const newPresets = prev.filter(p => p.id !== id);
          if (id === currentPresetId) {
              setCurrentPresetId(newPresets[0].id);
          }
          return newPresets;
      });
      logAudit('DELETE', `Deleted preset ${id}`);
  };

  const selectPreset = (id: string) => {
      if (presets.some(p => p.id === id)) {
          setCurrentPresetId(id);
          setTestResult(null);
      }
  };

  const updateConfig = (newConfig: Partial<AIConfig>) => {
      updatePreset(currentPresetId, newConfig);
  };

  const resetConfig = () => {
      updatePreset(currentPresetId, DEFAULT_CONFIG);
      setTestResult(null);
      logAudit('RESET', `Reset config for preset ${currentPresetId}`);
  };

  const openSettings = () => setIsOpen(true);
  const closeSettings = () => {
    setIsOpen(false);
    setTestResult(null);
  };

  const testConnection = async (): Promise<boolean> => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const apiKey = currentConfig.apiKey?.trim();
      const rawBaseUrl = currentConfig.baseUrl?.trim();
      const model = currentConfig.model?.trim() || DEFAULT_CONFIG.model;

      if (!apiKey || !rawBaseUrl) {
        throw new Error('未配置 API Key 或 Base URL。请先在设置中补全。');
      }

      let baseUrl = rawBaseUrl;
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = `https://${baseUrl}`;
      }

      try {
        const urlObj = new URL(baseUrl);
        if (urlObj.search) {
          const targetParam = urlObj.searchParams.get('target');
          if (targetParam) {
            baseUrl = urlObj.origin + urlObj.pathname;
          }
          if (urlObj.hostname === 'cloud.siliconflow.cn') {
            baseUrl = 'https://api.siliconflow.cn/v1';
          }
        }
      } catch {
        throw new Error('Base URL 格式不正确，请输入完整 URL，例如 https://api.openai.com/v1');
      }

      baseUrl = baseUrl.replace(/\/$/, '');
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };

      let requestEndpoint = endpoint;
      if (process.env.NODE_ENV !== 'production') {
        requestEndpoint = '/__dm_llm_proxy';
        headers['x-dm-endpoint'] = endpoint;
      }

      const resp = await fetch(requestEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          temperature: 0,
          max_tokens: 1,
          stream: false,
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        let detail: string = errorText;
        try {
          const json = JSON.parse(errorText);
          const candidate = json?.message ?? json?.error ?? json;
          if (typeof candidate === 'string') {
            detail = candidate;
          } else {
            detail = JSON.stringify(candidate);
          }
        } catch {
          detail = errorText;
        }
        throw new Error(`连接失败: ${resp.status} - ${detail}`);
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('连接失败: 返回内容为空');
      }

      setTestResult({ success: true, message: '连接成功' });
      setIsTesting(false);
      return true;
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      });
      setIsTesting(false);
      return false;
    }
  };

  return (
    <AIConfigContext.Provider
      value={{
        config: currentConfig,
        presets,
        currentPresetId,
        isOpen,
        openSettings,
        closeSettings,
        addPreset,
        updatePreset,
        deletePreset,
        selectPreset,
        updateConfig,
        resetConfig,
        testConnection,
        isTesting,
        testResult,
      }}
    >
      {children}
    </AIConfigContext.Provider>
  );
};

export const useAIConfig = () => {
  const context = useContext(AIConfigContext);
  if (context === undefined) {
    throw new Error('useAIConfig must be used within an AIConfigProvider');
  }
  return context;
};
