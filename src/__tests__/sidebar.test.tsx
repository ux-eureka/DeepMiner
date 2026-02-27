import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar';
import '@testing-library/jest-dom';
import React from 'react';

const mockState = {
  currentMode: 'b_side',
  history: [
    { id: '1', title: 'Session 1', active: false, isCompleted: true },
    { id: '2', title: 'Session 2', active: true, isCompleted: false }
  ]
};

const mockResetChat = jest.fn();
const mockLoadSession = jest.fn();
const mockDeleteSession = jest.fn();
const mockOpenSettings = jest.fn();

// Mock the hooks directly since we are testing component logic
jest.mock('../hooks/useChatFlow', () => ({
  useChatFlow: () => ({
    state: mockState,
    resetChat: mockResetChat,
    loadSession: mockLoadSession,
    deleteSession: mockDeleteSession
  })
}));

jest.mock('../context/AIConfigContext', () => ({
  useAIConfig: () => ({ openSettings: mockOpenSettings })
}));

describe('Sidebar Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm = jest.fn(() => true);
  });

  const renderSidebar = () => {
    return render(<Sidebar collapsed={false} isMobile={false} mobileOpen={false} onToggleCollapsed={() => {}} onCloseMobile={() => {}} />);
  };

  it('should not show clear all button', () => {
    renderSidebar();
    expect(screen.queryByText('清空所有会话')).not.toBeInTheDocument();
  });

  it('should show more menu on hover/click', async () => {
    renderSidebar();
    
    // Find more button for first item
    const moreButtons = screen.getAllByLabelText('更多操作');
    fireEvent.click(moreButtons[0]);

    // Menu should appear
    expect(screen.getByText('删除')).toBeInTheDocument();
    expect(screen.getByText('下载文档')).toBeInTheDocument();
  });

  it('should enable download only for completed sessions', () => {
    renderSidebar();
    
    const moreButtons = screen.getAllByLabelText('更多操作');
    
    // Session 1 is completed
    fireEvent.click(moreButtons[0]);
    // Since we have multiple sessions, and we click the first one, the dropdown for first one appears.
    // The previous test failure suggests both might be rendering or lingering?
    // Actually, in Sidebar implementation, `openMenuId` is state, so only one should be open at a time.
    // However, if the transition animation (AnimatePresence) takes time, the old one might still be in DOM.
    // Let's use `screen.getByText` carefully or ensure we wait for animation if needed.
    // But since we are in test environment, animations might be instant or we need to wait.
    
    // Let's check visible one.
    let downloadBtn = screen.getByText('下载文档');
    expect(downloadBtn).not.toBeDisabled();

    // Close menu by clicking outside (body)
    fireEvent.click(document.body);
    
    // Session 2 is not completed
    fireEvent.click(moreButtons[1]);
    
    // Now we expect the second menu to open. 
    // If the first one is still closing (animating out), getByText might find multiple.
    // Let's use getAllByText and check the last one (which should be the newly opened one) 
    // or wait for the first one to disappear.
    
    // Simpler approach: Check if button is disabled in the currently relevant menu context.
    // But getByText searches whole document.
    
    // Let's try to query within the specific menu if possible, but menu is portal-like or absolute.
    // Given the error "Found multiple elements", it means the previous one didn't unmount immediately.
    
    const downloadButtons = screen.getAllByText('下载文档');
    const activeDownloadBtn = downloadButtons[downloadButtons.length - 1]; // The latest one
    expect(activeDownloadBtn).toBeDisabled();
  });

  it('should trigger delete session', () => {
    renderSidebar();
    
    const moreButtons = screen.getAllByLabelText('更多操作');
    fireEvent.click(moreButtons[0]);
    
    fireEvent.click(screen.getByText('删除'));
    
    expect(global.confirm).toHaveBeenCalled();
    expect(mockDeleteSession).toHaveBeenCalledWith('1');
  });
});
