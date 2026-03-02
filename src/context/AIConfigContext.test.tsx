import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIConfigProvider, useAIConfig } from './AIConfigContext';

// Helper component to expose context
const TestComponent = () => {
  const { config, updateConfig, updatePreset, resetConfig, presets, currentPresetId } = useAIConfig();
  return (
    <div>
      <div data-testid="config-id">{config.id}</div>
      <div data-testid="config-name">{config.name}</div>
      <div data-testid="config-apikey">{config.apiKey}</div>
      <button
        onClick={() => {
          updatePreset(currentPresetId, { name: 'Updated Name' });
          updateConfig({ apiKey: 'new-key' });
        }}
      >
        Update
      </button>
      <button onClick={resetConfig}>Reset</button>
      <div data-testid="presets-count">{presets.length}</div>
    </div>
  );
};

describe('AIConfig Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('Should load default preset on first mount', () => {
    render(
      <AIConfigProvider>
        <TestComponent />
      </AIConfigProvider>
    );
    expect(screen.getByTestId('config-id')).toHaveTextContent('default');
  });

  test('Should persist updates to localStorage', async () => {
    render(
      <AIConfigProvider>
        <TestComponent />
      </AIConfigProvider>
    );

    fireEvent.click(screen.getByText('Update'));
    
    // Wait for state update
    await waitFor(() => {
        expect(screen.getByTestId('config-name')).toHaveTextContent('Updated Name');
    });

    // Check localStorage
    const stored = localStorage.getItem('deepminer_ai_presets');
    expect(stored).not.toBeNull();
    expect(stored).toContain('Updated Name');
    // API key should be encrypted, so we shouldn't see 'new-key' in plain text if encryption works
    // But since our encrypt function is deterministic with fixed salt, we can check it's NOT plain text
    expect(stored).not.toContain('"apiKey":"new-key"'); 
  });

  test('Should restore state after reload (simulated)', async () => {
    // 1. Set initial state
    const { unmount } = render(
      <AIConfigProvider>
        <TestComponent />
      </AIConfigProvider>
    );

    fireEvent.click(screen.getByText('Update'));
    await waitFor(() => expect(screen.getByTestId('config-name')).toHaveTextContent('Updated Name'));
    
    // 2. Unmount (simulate close)
    unmount();

    // 3. Remount (simulate reload)
    render(
      <AIConfigProvider>
        <TestComponent />
      </AIConfigProvider>
    );

    // Should have persisted data
    expect(screen.getByTestId('config-name')).toHaveTextContent('Updated Name');
  });
});
