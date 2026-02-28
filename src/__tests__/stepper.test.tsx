import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FloatingStepper } from '../components/FloatingStepper';
import { VirtualStepperList } from '../components/VirtualStepperList';
import { ChatContext } from '../context/ChatContext';
import { MODE_CONFIG } from '../config/promptsConfig';

// Mock scrollTo
window.HTMLElement.prototype.scrollTo = jest.fn();

// Mock useProgress hook via module mock or just context
// Since FloatingStepper uses useProgress which uses ChatContext, we can mock Context.

const mockState = {
  currentMode: 'b_side',
  currentPhase: '1',
  messages: [{ id: '1', content: 'hello', type: 'user', timestamp: 123 }],
  isCompleted: false,
  isProcessing: false,
  phases: {
      1: { title: 'Phase 1', task: 'Task 1' },
      2: { title: 'Phase 2', task: 'Task 2' },
      3: { title: 'Phase 3', task: 'Task 3' },
      // ... generate 100 phases
  }
};

// Generate 100 phases
for (let i = 4; i <= 105; i++) {
    // @ts-ignore
    mockState.phases[i] = { title: `Phase ${i}`, task: `Task ${i}` };
}

const mockContextValue = {
  state: mockState,
  dispatch: jest.fn(),
  initMode: jest.fn(),
  sendMessage: jest.fn(),
  resetChat: jest.fn(),
  loadSession: jest.fn(),
  addCustomMode: jest.fn(),
  deleteSession: jest.fn(),
  appendPhase: jest.fn(),
};

describe('VirtualStepperList', () => {
  const progress = Object.keys(mockState.phases).map(key => ({
      phase: key,
      title: mockState.phases[key as any].title,
      isCompleted: parseInt(key) < 1,
      isActive: key === '1'
  }));

  it('renders visible items correctly', () => {
    render(
      <VirtualStepperList 
        progress={progress}
        isHovered={false}
        onPhaseClick={jest.fn()}
      />
    );
    
    // Should render first few items
    expect(screen.getByText('PHASE 1')).toBeInTheDocument();
    // Should NOT render item 100 (virtualized)
    // Note: our simple virtualizer renders based on scroll. Initial scroll is 0.
    // Container height is 0 in jsdom unless mocked.
    // We need to mock clientHeight
  });
});

describe('FloatingStepper Integration', () => {
  it('renders without crashing with many items', () => {
    render(
      <ChatContext.Provider value={mockContextValue as any}>
        <FloatingStepper />
      </ChatContext.Provider>
    );
    
    expect(screen.getByText('PHASE 1')).toBeInTheDocument();
  });
});
