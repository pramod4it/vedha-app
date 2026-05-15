import { ipcMain, shell } from 'electron';

import {
  AppMode,
  type SubscriptionLevel,
} from '../shared/api';

import { IPC_EVENTS } from '../shared/constants';

import { AppStorage } from './app.storage';

import { AuthStorage } from './auth.storage';

import type { IIpcHandlerDeps } from './main';

const APP_WEBSITE =
    process.env.APP_WEBSITE ||
    'http://localhost:3000';

const SETTINGS_URL =
    `${APP_WEBSITE}/settings`;

const BILLING_URL =
    `${APP_WEBSITE}/billing`;

export function initializeIpcHandlers(
    deps: IIpcHandlerDeps,
): void {

  console.log(
      'Initializing IPC handlers',
  );

  const authStorage =
      AuthStorage.getInstance();

  const appStorage =
      AppStorage.getInstance();

  ipcMain.handle(
      IPC_EVENTS.TOOLTIP.MOUSE_ENTER,
      () => {
        console.log(
            'Tooltip mouse enter',
        );
      },
  );

  ipcMain.handle(
      IPC_EVENTS.TOOLTIP.MOUSE_LEAVE,
      () => {
        console.log(
            'Tooltip mouse leave',
        );
      },
  );

  ipcMain.handle(
      IPC_EVENTS.TOOLTIP.CLOSE_CLICK,
      () => {

        console.log(
            'Tooltip close button clicked - hiding overlay',
        );

        deps.hideMainWindow();
      },
  );

  ipcMain.handle(
      IPC_EVENTS.QUEUE
          .LOADED_NO_SCREENSHOTS,

      () => {

        console.log(
            'Queue page loaded with no screenshots',
        );

        deps.applyQueueWindowBehavior();
      },
  );

  ipcMain.handle(
      IPC_EVENTS.QUEUE
          .LOADED_WITH_SCREENSHOTS,

      (_event, screenshotCount) => {

        console.log(
            'Queue page loaded with screenshots:',
            screenshotCount,
        );

        deps.applyQueueWindowBehavior();
      },
  );

  ipcMain.handle(
      'get-screenshot-queue',
      () => {
        return deps.getScreenshotQueue();
      },
  );

  ipcMain.handle(
      'delete-screenshot',

      async (_event, path: string) => {
        return deps.deleteScreenshot(
            path,
        );
      },
  );

  ipcMain.handle(
      'clear-all-screenshots',

      async () => {
        return deps.clearAllScreenshots();
      },
  );

  ipcMain.handle(
      'get-image-preview',

      async (_event, path: string) => {
        return deps.getImagePreview(
            path,
        );
      },
  );

  ipcMain.handle(
      'update-content-dimensions',

      (
          _event,

          {
            width,
            height,
            source,
          }: {
            width: number;
            height: number;
            source: string;
          },
      ) => {

        console.log(
            '[IPC update-content-dimensions]',
            width,
            height,
            source,
        );

        if (width && height) {

          deps.setWindowDimensions(
              width,
              height,
              source,
          );
        }
      },
  );

  ipcMain.handle(
      'set-window-dimensions',

      (
          _event,
          width: number,
          height: number,
          source: string,
      ) => {

        deps.setWindowDimensions(
            width,
            height,
            source,
        );
      },
  );

  ipcMain.handle(
      'get-screenshots',

      async () => {

        try {

          const queue =
              deps.getScreenshotQueue();

          return await Promise.all(
              queue.map(
                  async (path) => ({
                    path,

                    preview:
                        await deps.getImagePreview(
                            path,
                        ),
                  }),
              ),
          );

        } catch (error) {

          console.error(
              'Error getting screenshots:',
              error,
          );

          throw error;
        }
      },
  );

  ipcMain.handle(
      'trigger-screenshot',

      async () => {

        const mainWindow =
            deps.getMainWindow();

        if (!mainWindow) {
          return {
            error:
                'No main window available',
          };
        }

        try {

          const screenshotPath =
              await deps.takeScreenshot();

          const preview =
              await deps.getImagePreview(
                  screenshotPath,
              );

          mainWindow.webContents.send(
              'screenshot-taken',
              {
                path: screenshotPath,
                preview,
              },
          );

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error triggering screenshot:',
              error,
          );

          return {
            error:
                'Failed to trigger screenshot',
          };
        }
      },
  );

  ipcMain.handle(
      'take-screenshot',

      async () => {

        try {

          const screenshotPath =
              await deps.takeScreenshot();

          const preview =
              await deps.getImagePreview(
                  screenshotPath,
              );

          return {
            path: screenshotPath,
            preview,
          };

        } catch (error) {

          console.error(
              'Error taking screenshot:',
              error,
          );

          return {
            error:
                'Failed to take screenshot',
          };
        }
      },
  );

  ipcMain.handle(
      'open-external-url',

      (_event, url: string) => {
        shell
            .openExternal(url)
            .catch(console.error);
      },
  );

  ipcMain.handle(
      'open-settings-portal',

      async () => {

        try {

          await shell.openExternal(
              SETTINGS_URL,
          );

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error opening settings page:',
              error,
          );

          return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to open settings page',
          };
        }
      },
  );

  ipcMain.handle(
      'open-subscription-portal',

      async () => {

        try {

          await shell.openExternal(
              BILLING_URL,
          );

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error opening billing page:',
              error,
          );

          return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to open billing page',
          };
        }
      },
  );

  ipcMain.handle(
      'toggle-window',

      () => {

        try {

          deps.toggleMainWindow();

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error toggling window:',
              error,
          );

          return {
            error:
                'Failed to toggle window',
          };
        }
      },
  );

  ipcMain.handle(
      'reset-queues',

      () => {

        try {

          deps.clearQueues();

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error resetting queues:',
              error,
          );

          return {
            error:
                'Failed to reset queues',
          };
        }
      },
  );

  ipcMain.handle(
      'auth-set-token',

      (
          _event,
          token: string,
          expiryTimestamp?: number,
      ) => {

        try {

          authStorage.setAuthToken(
              token,
              expiryTimestamp,
          );

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error setting auth token:',
              error,
          );

          return {
            error:
                'Failed to set auth token',
          };
        }
      },
  );

  ipcMain.handle(
      'auth-get-token',

      () => {

        try {

          const token =
              authStorage.getAuthToken();

          return {
            success: true,
            token,
          };

        } catch (error) {

          console.error(
              'Error getting auth token:',
              error,
          );

          return {
            error:
                'Failed to get auth token',
          };
        }
      },
  );

  ipcMain.handle(
      'auth-clear-token',

      () => {

        try {

          authStorage.clearAuthToken();

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error clearing auth token:',
              error,
          );

          return {
            error:
                'Failed to clear auth token',
          };
        }
      },
  );

  ipcMain.handle(
      'auth-is-authenticated',

      () => {

        try {

          const isAuthenticated =
              authStorage.isAuthenticated();

          return {
            success: true,
            isAuthenticated,
          };

        } catch (error) {

          console.error(
              'Error checking authentication:',
              error,
          );

          return {
            error:
                'Failed to check authentication',
          };
        }
      },
  );

  ipcMain.handle(
      'auth-set-last-used-email',

      (_event, email: string) => {

        try {

          authStorage.setLastUsedEmail(
              email,
          );

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error setting last used email:',
              error,
          );

          return {
            error:
                'Failed to set last used email',
          };
        }
      },
  );

  ipcMain.handle(
      'auth-get-last-used-email',

      () => {

        try {

          const email =
              authStorage.getLastUsedEmail();

          return {
            success: true,
            email,
          };

        } catch (error) {

          console.error(
              'Error getting last used email:',
              error,
          );

          return {
            error:
                'Failed to get last used email',
          };
        }
      },
  );

  ipcMain.handle(
      'auth-set-subscription-level',

      (
          _event,
          level: SubscriptionLevel,
      ) => {

        try {

          console.log("level kaba:",level)
          authStorage.setSubscriptionLevel(
              level,
          );

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error setting subscription level:',
              error,
          );

          return {
            error:
                'Failed to set subscription level',
          };
        }
      },
  );

  ipcMain.handle(
      IPC_EVENTS.APP_MODE.CHANGE,

      (
          _event,
          appMode: string,
      ) => {

        try {

          if (
              Object.values(AppMode).includes(
                  appMode as AppMode,
              )
          ) {

            deps.setAppMode(
                appMode as AppMode,
            );

            appStorage.setAppMode(
                appMode as AppMode,
            );
          }

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error changing app mode:',
              error,
          );

          return {
            error:
                'Failed to change app mode',
          };
        }
      },
  );

  ipcMain.handle(
      'get-app-mode',

      () => {

        try {

          return {
            success: true,
            appMode:
                deps.getAppMode(),
          };

        } catch (error) {

          console.error(
              'Error getting app mode:',
              error,
          );

          return {
            error:
                'Failed to get app mode',
          };
        }
      },
  );

  ipcMain.handle(
      'set-interview-metadata',

      (
          _event,
          metadata: {
            companyName: string;
            interviewerName: string;
            interviewRound: string;
            answerDepth?: 'short' | 'medium' | 'systemdesign';
            targetRole?: string;
            techStack?: string;
            resumeSummary?: string;
            jobDescription?: string;
            extraInstructions?: string;
          },
      ) => {

        try {

          appStorage.setInterviewMetadata(
              {
                ...metadata,
                answerDepth:
                    metadata.answerDepth ||
                    'medium',
              },
          );

          return {
            success: true,
          };

        } catch (error) {

          console.error(
              'Error setting interview metadata:',
              error,
          );

          return {
            error:
                'Failed to set interview metadata',
          };
        }
      },
  );

  ipcMain.handle(
      'get-interview-metadata',

      () => {

        try {

          return {
            success: true,
            metadata:
                appStorage.getInterviewMetadata(),
          };

        } catch (error) {

          console.error(
              'Error getting interview metadata:',
              error,
          );

          return {
            error:
                'Failed to get interview metadata',
          };
        }
      },
  );
}
