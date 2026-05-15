import { AppMode } from '@shared/api.ts';
import type React from 'react';

const APP_MODE_HINTS: Record<AppMode, string> = {
  [AppMode.LIVE_INTERVIEW]:
    'A helpful tool that shows your problem, thoughts, and code all in one view. It works as an invisible layer during coding interviews.',
};

interface AppModeHintBoxProps {
  currentAppMode: AppMode;
}

export const AppModeHintBox: React.FC<AppModeHintBoxProps> = ({ currentAppMode }) => {
  return (
    <div className="px-2 mb-3">
      <div className="bg-white/5 border border-white/10 rounded-sm p-2">
        <p className="text-[11px] leading-relaxed text-gray-300">
          {APP_MODE_HINTS[currentAppMode]}
        </p>
      </div>
    </div>
  );
};
