import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsModal } from './SettingsModal';
import { useAIConfig } from '../../context/AIConfigContext';

// Mock the context hook
jest.mock('../../context/AIConfigContext', () => ({
  useAIConfig: jest.fn(),
}));

describe('SettingsModal Security', () => {
  const mockUpdateConfig = jest.fn();
  const mockCloseSettings = jest.fn();

  const defaultProps = {
    isOpen: true,
    closeSettings: mockCloseSettings,
    config: {
      id: 'test',
      apiKey: 'sk-existing-key-12345678', // Longer key for masking test
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      name: 'Test Preset'
    },
    presets: [],
    currentPresetId: 'test',
    updateConfig: mockUpdateConfig,
    addPreset: jest.fn(),
    updatePreset: jest.fn(),
    deletePreset: jest.fn(),
    selectPreset: jest.fn(),
    resetConfig: jest.fn(),
    testConnection: jest.fn(),
    isTesting: false,
    testResult: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAIConfig as jest.Mock).mockReturnValue(defaultProps);
  });

  test('API Key should be masked initially', () => {
    render(<SettingsModal />);
    // Should show masked version like sk-e****5678
    expect(screen.getByText(/sk-e\*\*\*\*5678/)).toBeInTheDocument();
    // Input should NOT be present initially
    expect(screen.queryByPlaceholderText(/Enter your API Key/i)).not.toBeInTheDocument();
  });

  test('Clicking Change button should reveal input', () => {
    render(<SettingsModal />);
    
    const changeBtn = screen.getByText('更换');
    fireEvent.click(changeBtn);
    
    // Now input should be present
    const input = screen.getByPlaceholderText(/Enter your API Key/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  test('Typing in API Key input should update config', () => {
    render(<SettingsModal />);
    
    // Switch to edit mode first
    fireEvent.click(screen.getByText('更换'));
    
    const input = screen.getByPlaceholderText(/Enter your API Key/i);
    fireEvent.change(input, { target: { value: 'new-secret-key' } });
    
    expect(mockUpdateConfig).toHaveBeenCalledWith({ apiKey: 'new-secret-key' });
  });
});

describe('SettingsModal Base URL Validation', () => {
  const mockUpdateConfig = jest.fn();
  const defaultProps = {
    isOpen: true,
    closeSettings: jest.fn(),
    config: {
      id: 'test',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4',
      name: 'Test Preset'
    },
    presets: [],
    currentPresetId: 'test',
    updateConfig: mockUpdateConfig,
    addPreset: jest.fn(),
    updatePreset: jest.fn(),
    deletePreset: jest.fn(),
    selectPreset: jest.fn(),
    resetConfig: jest.fn(),
    testConnection: jest.fn(),
    isTesting: false,
    testResult: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAIConfig as jest.Mock).mockReturnValue(defaultProps);
  });

  test('Entering invalid URL shows error', () => {
    render(<SettingsModal />);
    const baseUrlInput = screen.getByPlaceholderText('https://api.openai.com/v1');
    
    fireEvent.change(baseUrlInput, { target: { value: 'http://inva lid' } });
    
    expect(screen.getByText(/请输入有效的 URL/i)).toBeInTheDocument();
    expect(mockUpdateConfig).toHaveBeenCalledWith({ baseUrl: 'http://inva lid' });
  });
});
