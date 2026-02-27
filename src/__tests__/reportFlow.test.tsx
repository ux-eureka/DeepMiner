import { render, screen, waitFor } from '@testing-library/react';
import { ReportModal } from '../components/Modals/ReportModal';
import { ChatContext } from '../context/ChatContext';
import '@testing-library/jest-dom';
import React from 'react';

// Mock dependencies
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    setFont: jest.fn(),
    splitTextToSize: jest.fn().mockReturnValue([]),
    addPage: jest.fn(),
    save: jest.fn(),
    internal: { pageSize: { height: 1000 } }
  }));
});

jest.mock('canvas-confetti', () => jest.fn());

const mockDispatch = jest.fn();

const mockState = {
  currentMode: 'b_side',
  currentPhase: '5',
  messages: [
    { id: '1', type: 'user', content: 'Test Answer', phase: 1, timestamp: 123 }
  ],
  isModeLocked: true,
  isCompleted: true,
  isLoading: false,
  isCreateModalOpen: false,
  isReportModalOpen: true, // Modal is open
  history: []
};

describe('ReportModal Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should auto-generate report when modal opens without user interaction', async () => {
    render(
      <ChatContext.Provider value={{ state: mockState, dispatch: mockDispatch } as any}>
        <ReportModal />
      </ChatContext.Provider>
    );

    // Should show loading state immediately
    expect(screen.getByText(/正在深度分析业务逻辑/i)).toBeInTheDocument();
    
    // Wait for generation to complete (simulated delay)
    await waitFor(() => {
      expect(screen.getByText(/Diagnostic Report Ready/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show download button
    expect(screen.getByText(/Download PDF Report/i)).toBeInTheDocument();
  });

  it('should not show intermediate confirmation dialogs', () => {
    render(
      <ChatContext.Provider value={{ state: mockState, dispatch: mockDispatch } as any}>
        <ReportModal />
      </ChatContext.Provider>
    );

    // Verify no "Are you sure" or "Generate" buttons exist, process starts automatically
    const generateBtn = screen.queryByRole('button', { name: /generate/i });
    expect(generateBtn).not.toBeInTheDocument();
  });
});
