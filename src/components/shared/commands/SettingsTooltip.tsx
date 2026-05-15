import type { AppMode } from '@shared/api.ts';
import { IPC_EVENTS } from '@shared/constants.ts';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { sendToElectron } from '../../../utils/electron.ts';
import GearIcon from './GearIcon';
import ShortcutsTooltip, { type ShortcutItem } from './ShortcutsTooltip';

interface SettingsTooltipProps {
  shortcuts: ShortcutItem[];
  currentAppMode: AppMode;
  onSignOut: () => void;
  onTooltipVisibilityChange: (visible: boolean, height: number) => void;
  setAppMode: (appMode: AppMode) => void;
  isFree?: boolean;
  userEmail?: string;
}

const SettingsTooltip: React.FC<SettingsTooltipProps> = ({
  shortcuts,
  currentAppMode,
  onSignOut,
  onTooltipVisibilityChange,
  setAppMode,
  isFree,
  userEmail,
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tooltipHeight = 0;
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10;
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight);
  }, [isTooltipVisible, onTooltipVisibilityChange]);

  const toggleTooltip = () => {
    setIsTooltipVisible((visible) => !visible);
    sendToElectron(IPC_EVENTS.TOOLTIP.MOUSE_ENTER);
  };

  const closeTooltip = () => {
    setIsTooltipVisible(false);
    sendToElectron(IPC_EVENTS.TOOLTIP.MOUSE_LEAVE);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={toggleTooltip}
        className="flex items-center justify-center"
        aria-label="Open settings"
        aria-expanded={isTooltipVisible}
      >
        <GearIcon />
      </button>
      {isTooltipVisible && (
        <ShortcutsTooltip
          tooltipRef={tooltipRef}
          shortcuts={shortcuts}
          currentAppMode={currentAppMode}
          setAppMode={setAppMode}
          onSignOut={onSignOut}
          isFree={isFree}
          userEmail={userEmail}
          onClose={closeTooltip}
        />
      )}
    </div>
  );
};

export default SettingsTooltip;
