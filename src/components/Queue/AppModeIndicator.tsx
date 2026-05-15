import type React from 'react';
import { AppMode } from '../../../shared/api';
import { useAppMode } from '../../contexts/appMode';

export const AppModeIndicator: React.FC = () => {
  const { currentAppMode } = useAppMode();

  const getIndicatorConfig = () => {
    switch (currentAppMode) {
      case AppMode.LIVE_INTERVIEW:
        return {
          dotColor: 'bg-green-500',
          text: 'Live Interview - invisible',
        };
      default:
        return {
          dotColor: 'bg-green-500',
          text: 'Live Interview - invisible',
        };
    }
  };

  const { dotColor, text } = getIndicatorConfig();

  return (
    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-sm font-medium text-white">{text}</span>
    </div>
  );
};
