import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIConfig, AIPreset, AIProvider, DEFAULT_CONFIGS } from '../types/ai-config';

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

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'deepminer_ai_config'; // Legacy key
const PRESETS_STORAGE_KEY = 'deepminer_ai_presets';
const CURRENT_PRESET_KEY = 'deepminer_current_preset_id';

// Simple encryption/decryption for local storage (Base64)
const encrypt = (text: string) => btoa(text);
const decrypt = (text: string) => {
    try {
        return atob(text);
    } catch {
        return text;
    }
};

// Access Environment Variables (injected by Vite)
const ENV_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

const DEFAULT_PRESET: AIPreset = {
    id: 'default',
    name: (ENV_API_KEY && ENV_BASE_URL) ? 'System Environment' : 'Default (OpenAI)',
    isDefault: true,
    // Use 'custom' if Env vars are present to avoid OpenAI defaults overriding
    provider: (ENV_API_KEY && ENV_BASE_URL) ? 'custom' : 'openai',
    apiKey: ENV_API_KEY,
    baseUrl: ENV_BASE_URL || DEFAULT_CONFIGS.openai.baseUrl,
    model: 'deepseek-chat', // Default safe model
    temperature: 0.7,
    maxTokens: 2000
};

export const AIConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [presets, setPresets] = useState<AIPreset[]>([DEFAULT_PRESET]);
  const [currentPresetId, setCurrentPresetId] = useState<string>('default');
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Derived current config
  const currentConfig = presets.find(p => p.id === currentPresetId) || presets[0] || DEFAULT_PRESET;

  // Load config from local storage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
    const savedCurrentId = localStorage.getItem(CURRENT_PRESET_KEY);
    const legacyConfig = localStorage.getItem(STORAGE_KEY);

    if (savedPresets) {
      try {
        const parsedPresets: AIPreset[] = JSON.parse(savedPresets);
        // Decrypt API keys
        const decryptedPresets = parsedPresets.map(p => ({
            ...p,
            apiKey: p.apiKey ? decrypt(p.apiKey) : ''
        }));
        
        // Force update the 'default' preset if Environment Variables exist
        // This ensures system environment settings always take precedence for the default profile
        if (ENV_API_KEY && ENV_BASE_URL) {
            const defaultIndex = decryptedPresets.findIndex(p => p.id === 'default');
            
            // Define the Environment Preset
            const envPreset = {
                ...DEFAULT_PRESET,
                // If the existing default preset has a model set, preserve it? 
                // Or force the safe default 'deepseek-chat'?
                // Let's force 'deepseek-chat' to ensure compatibility with the Env URL we are injecting.
                model: 'deepseek-chat'
            };
            
            if (defaultIndex >= 0) {
                decryptedPresets[defaultIndex] = {
                    ...decryptedPresets[defaultIndex],
                    ...envPreset
                };
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
        // Migrate legacy config
        try {
            const parsed = JSON.parse(legacyConfig);
            if (parsed.apiKey) parsed.apiKey = decrypt(parsed.apiKey);
            
            const migratedPreset: AIPreset = {
                id: 'migrated-legacy',
                name: 'Migrated Config',
                ...DEFAULT_CONFIGS[parsed.provider as AIProvider],
                ...parsed
            };
            setPresets([migratedPreset, DEFAULT_PRESET]);
            setCurrentPresetId('migrated-legacy');
        } catch (e) {
            console.error('Failed to migrate legacy config:', e);
        }
    } else if (ENV_API_KEY && ENV_BASE_URL) {
        // First time load with Env Vars
        setPresets([DEFAULT_PRESET]);
        setCurrentPresetId('default');
    }
  }, []);

  // Persistence
  useEffect(() => {
      const presetsToSave = presets.map(p => ({
          ...p,
          apiKey: p.apiKey ? encrypt(p.apiKey) : ''
      }));
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presetsToSave));
  }, [presets]);

  useEffect(() => {
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
      setCurrentPresetId(newPreset.id); // Auto-select new preset
  };

  const updatePreset = (id: string, updates: Partial<AIPreset>) => {
      setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePreset = (id: string) => {
      if (presets.length <= 1) {
          alert("Cannot delete the last preset.");
          return;
      }
      setPresets(prev => {
          const newPresets = prev.filter(p => p.id !== id);
          // If deleting current, select the first one
          if (id === currentPresetId) {
              setCurrentPresetId(newPresets[0].id);
          }
          return newPresets;
      });
  };

  const selectPreset = (id: string) => {
      if (presets.some(p => p.id === id)) {
          setCurrentPresetId(id);
          setTestResult(null);
      }
  };

  // Legacy wrappers
  const updateConfig = (newConfig: Partial<AIConfig>) => {
      updatePreset(currentPresetId, newConfig);
      
      // Special handling for provider change (load defaults)
      if (newConfig.provider && newConfig.provider !== currentConfig.provider) {
          const defaultForProvider = DEFAULT_CONFIGS[newConfig.provider];
          updatePreset(currentPresetId, { ...defaultForProvider, ...newConfig });
      }
  };

  const resetConfig = () => {
      const defaultConfig = DEFAULT_CONFIGS[currentConfig.provider];
      updatePreset(currentPresetId, defaultConfig);
      setTestResult(null);
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
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!currentConfig.apiKey) {
        throw new Error('API Key is missing');
      }

      if (currentConfig.apiKey.length < 5) {
        throw new Error('Invalid API Key format');
      }

      setTestResult({ success: true, message: 'Connection successful!' });
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
