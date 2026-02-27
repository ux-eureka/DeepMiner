import React from 'react';
import { CreateModeModal } from './Modals/CreateModeModal';
import { ReportModal } from './Modals/ReportModal';
import { SettingsModal } from './Modals/SettingsModal';

export const Modals: React.FC = () => {
  return (
    <>
      <CreateModeModal />
      <ReportModal />
      <SettingsModal />
    </>
  );
};
