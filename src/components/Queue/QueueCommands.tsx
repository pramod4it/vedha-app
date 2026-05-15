import type React from 'react';
import { useAppMode } from '../../contexts/appMode';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { authService } from '../../services/auth.ts';
import { COMMAND_KEY } from '../../utils/platform';
import CommandButton from '../shared/commands/CommandButton';
import CommandSeparator from '../shared/commands/CommandSeparator';
import SettingsTooltip from '../shared/commands/SettingsTooltip';
import { AppModeIndicator } from './AppModeIndicator';

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void;
  screenshotCount?: number;
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshotCount = 0,
}) => {
  const { currentAppMode, setAppMode } = useAppMode();
  const { isFree, user } = useSubscription();

  const handleSignOut = () => {
    authService.signOut().catch(console.error);
  };

  return (
    <div className="pt-2 w-fit max-w-full">
      <div className="min-w-[320px] text-xs text-gray-100 bg-[#1E2530]/80 rounded-lg py-2 px-4">
        <div className="w-full mb-2 flex justify-center">
          <AppModeIndicator />
        </div>

        <div className="flex items-center justify-center gap-3">
          <CommandButton
            label={
              screenshotCount === 0
                ? 'Take first screenshot'
                : screenshotCount === 1
                  ? 'Next screenshot'
                  : 'Reset screenshot'
            }
            shortcut="H"
          />

          {screenshotCount > 0 && !isFree && <CommandButton label="Solve" shortcut="Enter" />}

          {screenshotCount > 0 && <CommandButton label="Start Over" shortcut="G" />}

          <CommandSeparator />
          <SettingsTooltip
            isFree={isFree}
            userEmail={user.user.email}
            shortcuts={[
              {
                label: 'Toggle Window',
                shortcut: [COMMAND_KEY, 'B'],
                description: 'Show or hide this window.',
              },
              {
                label: 'Take Screenshot',
                shortcut: [COMMAND_KEY, 'H'],
                description: 'Take a screenshot of the problem description.',
              },
              {
                label: 'Solve',
                shortcut: [COMMAND_KEY, 'Enter'],
                description:
                  screenshotCount > 0
                    ? 'Generate a solution based on the current problem.'
                    : 'Take a screenshot first to generate a solution.',
              },
              {
                label: 'Start Over',
                shortcut: [COMMAND_KEY, 'G'],
                description: 'Start fresh with a new question.',
              },
            ]}
            currentAppMode={currentAppMode}
            setAppMode={setAppMode}
            onSignOut={handleSignOut}
            onTooltipVisibilityChange={onTooltipVisibilityChange}
          />
        </div>
      </div>
    </div>
  );
};

export default QueueCommands;
