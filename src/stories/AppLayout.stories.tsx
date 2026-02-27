import type { Meta, StoryObj } from '@storybook/react';
import App from '../App';

const meta: Meta = {
  title: 'App/Layout',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

export const Desktop1440: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1440' } },
};

export const Desktop1280: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
};

export const Tablet768: Story = {
  parameters: { viewport: { defaultViewport: 'tablet768' } },
};

export const Mobile375: Story = {
  parameters: { viewport: { defaultViewport: 'mobile375' } },
};

