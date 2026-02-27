import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { SystemCard } from '../components/ChatArea/SystemCard';

function setMobile(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('max-width: 767px') ? matches : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('Sidebar collapse/expand', () => {
  it('toggles sidebar and moves toggle button location on desktop', async () => {
    setMobile(false);
    const user = userEvent.setup();
    render(<App />);

    const sidebar = await screen.findByTestId('sidebar');
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    const toggleInSidebar = await screen.findByTestId('sidebar-toggle');
    expect(toggleInSidebar).toHaveAttribute('data-location', 'sidebar');

    await user.click(toggleInSidebar);

    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    const toggleTopLeft = await screen.findByTestId('sidebar-toggle');
    expect(toggleTopLeft).toHaveAttribute('data-location', 'top-left');
  });

  it('opens and closes sidebar in mobile mode with overlay', async () => {
    setMobile(true);
    const user = userEvent.setup();
    render(<App />);

    const overlay = await screen.findByTestId('sidebar-overlay');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');

    const toggle = await screen.findByTestId('sidebar-toggle');
    await user.click(toggle);
    expect(overlay).toHaveAttribute('aria-hidden', 'false');

    await user.click(overlay);
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SystemCard avatar removal', () => {
  it('does not render Bot icon node', () => {
    render(
      <SystemCard
        content="hello"
        phase="1"
        type="system"
        data={{ title: 't', questions: ['1.1 q'] }}
      />
    );
    expect(document.querySelector('.lucide-bot')).toBeNull();
  });
});

