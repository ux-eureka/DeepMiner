import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        desktop1440: {
          name: 'Desktop 1440',
          styles: { width: '1440px', height: '900px' },
        },
        desktop1280: {
          name: 'Desktop 1280',
          styles: { width: '1280px', height: '800px' },
        },
        tablet768: {
          name: 'Tablet 768',
          styles: { width: '768px', height: '900px' },
        },
        mobile375: {
          name: 'Mobile 375',
          styles: { width: '375px', height: '812px' },
        },
      },
    },
  },
};

export default preview;

