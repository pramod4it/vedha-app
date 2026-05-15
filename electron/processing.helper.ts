import fs from 'node:fs';
import path from 'node:path';

import axios from 'axios';

import {
  type DebugResponse,
  type SolveResponse,
} from '../shared/api';

import { AppStorage } from './app.storage';
import { AuthStorage } from './auth.storage';

import type { IProcessingHelperDeps } from './main';

import type { ProcessingParams } from './processors/AppModeProcessor';

import { AppModeProcessorFactory } from './processors/AppModeProcessorFactory';

import type { ScreenshotHelper } from './screenshot.helper';

export class ProcessingHelper {
  private deps: IProcessingHelperDeps;

  private screenshotHelper: ScreenshotHelper;

  private authStorage: AuthStorage;

  private processorFactory: AppModeProcessorFactory;

  private currentProcessingAbortController:
      | AbortController
      | null = null;

  private currentExtraProcessingAbortController:
      | AbortController
      | null = null;

  constructor(deps: IProcessingHelperDeps) {
    this.deps = deps;

    this.screenshotHelper =
        deps.getScreenshotHelper()!;

    this.authStorage =
        AuthStorage.getInstance();

    this.processorFactory =
        AppModeProcessorFactory.getInstance();
  }

  private readImageAsDataUri(
      filePath: string,
  ): string {
    const ext = path
        .extname(filePath)
        .toLowerCase();

    const mimeType =
        ext === '.jpg' ||
        ext === '.jpeg'
            ? 'image/jpeg'
            : 'image/png';

    const base64 = fs
        .readFileSync(filePath)
        .toString('base64');

    return `data:${mimeType};base64,${base64}`;
  }

  private getAuthToken(): string | null {
    try {
      const token =
          this.authStorage.getAuthToken();
      console.log(
          'TOKEN FROM STORAGE:',
          token,
      );

      if (!token) {
        console.warn(
            'No auth token found',
        );

        return null;
      }

      return token;
    } catch (error) {
      console.error(
          'Error getting auth token:',
          error,
      );

      return null;
    }
  }

  public async processScreenshotsSolve(): Promise<void> {
    const mainWindow =
        this.deps.getMainWindow();

    if (!mainWindow) {
      return;
    }

    const view = this.deps.getView();

    console.log(
        'Processing screenshots in view:',
        view,
    );

    if (view === 'queue') {
      const screenshotQueue =
          this.screenshotHelper.getScreenshotQueue();

      console.log(
          'Processing main queue screenshots:',
          screenshotQueue,
      );

      if (
          screenshotQueue.length === 0
      ) {
        mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS
                .NO_SCREENSHOTS,
        );

        return;
      }

      mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS
              .INITIAL_START,
      );

      try {
        this.currentProcessingAbortController =
            new AbortController();

        const { signal } =
            this
                .currentProcessingAbortController;

        const screenshots =
            await Promise.all(
                screenshotQueue.map(
                    async (path) => ({
                      path,

                      preview:
                          await this.screenshotHelper.getImagePreview(
                              path,
                          ),

                      data: this.readImageAsDataUri(
                          path,
                      ),
                    }),
                ),
            );

        const result =
            await this.processScreenshotsHelperSolve(
                screenshots,
                signal,
            );

        if (!result.success) {
          console.log(
              'Processing failed:',
              result.error,
          );

          mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS
                  .INITIAL_SOLUTION_ERROR,

              result.error,
          );

          this.deps.setView('queue');

          return;
        }

        mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS
                .SOLUTION_SUCCESS,

            result.data,
        );

        this.deps.setView(
            'solutions',
        );
      } catch (error: any) {
        console.error(
            'Processing error:',
            error,
        );

        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS
                  .INITIAL_SOLUTION_ERROR,

              'Processing was canceled by the user.',
          );
        } else {
          mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS
                  .INITIAL_SOLUTION_ERROR,

              error?.message ||
              'Server error. Please try again.',
          );
        }

        this.deps.setView('queue');
      } finally {
        this.currentProcessingAbortController =
            null;
      }
    } else {
      const screenshotQueue =
          this.screenshotHelper.getScreenshotQueue();

      console.log(
          'Processing debug screenshots:',
          screenshotQueue,
      );

      if (
          screenshotQueue.length === 0
      ) {
        mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS
                .NO_SCREENSHOTS,
        );

        return;
      }

      mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS
              .DEBUG_START,
      );

      this.currentExtraProcessingAbortController =
          new AbortController();

      const { signal } =
          this
              .currentExtraProcessingAbortController;

      try {
        const screenshots =
            await Promise.all(
                screenshotQueue.map(
                    async (path) => ({
                      path,

                      preview:
                          await this.screenshotHelper.getImagePreview(
                              path,
                          ),

                      data: this.readImageAsDataUri(
                          path,
                      ),
                    }),
                ),
            );

        const result =
            await this.processExtraScreenshotsHelper(
                screenshots,
                signal,
            );

        if (result.success) {
          this.deps.setHasDebugged(
              true,
          );

          mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS
                  .DEBUG_SUCCESS,

              result.data,
          );
        } else {
          mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS
                  .DEBUG_ERROR,

              result.error,
          );
        }
      } catch (error: any) {
        console.error(
            'Debug processing error:',
            error,
        );

        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS
                  .DEBUG_ERROR,

              'Debug processing was canceled by the user.',
          );
        } else {
          mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS
                  .DEBUG_ERROR,

              error?.message,
          );
        }
      } finally {
        this.currentExtraProcessingAbortController =
            null;
      }
    }
  }

  private async processScreenshotsHelperSolve(
      screenshots: Array<{
        path: string;
        data: string;
      }>,

      signal: AbortSignal,
  ): Promise<{
    success: boolean;

    data?: SolveResponse;

    error?: string;
  }> {
    try {
      const images = screenshots.map(
          (screenshot) =>
              screenshot.data,
      );

      const mainWindow =
          this.deps.getMainWindow();

      const isMock =
          process.env.IS_MOCK ===
          'true';

      const currentAppMode =
          this.deps.getAppMode();

      const processor =
          this.processorFactory.getProcessor(
              currentAppMode,
          );

      if (!mainWindow) {
        return {
          success: false,
          error:
              'Main window not available',
        };
      }

      const token =
          this.getAuthToken();

      if (!token) {
        return {
          success: false,
          error:
              'Authentication required. Please log in.',
        };
      }

      const headers: Record<
          string,
          string
      > = {
        'Content-Type':
            'application/json',

        Authorization: `Bearer ${token}`,
      };

      const readableVarNames =
          AppStorage.getInstance().getReadableVarNames();

      const interviewMetadata =
          AppStorage.getInstance().getInterviewMetadata();

      const processingParams: ProcessingParams =
          {
            images,
            isMock,
            readableVarNames,
            companyName:
                interviewMetadata?.companyName,
            interviewerName:
                interviewMetadata?.interviewerName,
            interviewRound:
                interviewMetadata?.interviewRound,
            answerDepth:
                interviewMetadata?.answerDepth,
            targetRole:
                interviewMetadata?.targetRole,
            techStack:
                interviewMetadata?.techStack,
            resumeSummary:
                interviewMetadata?.resumeSummary,
            jobDescription:
                interviewMetadata?.jobDescription,
            extraInstructions:
                interviewMetadata?.extraInstructions,
            signal,
            headers,
          };

      const result =
          await processor.processSolve(
              processingParams,
          );

      if (!result.success) {
        return {
          success: false,
          error:
              result.error ||
              'Failed to process solution',
        };
      }

      const solutionData =
          result.data;

      if (
          solutionData &&
          'conversationId' in
          solutionData
      ) {
        this.deps.setConversationId(
            solutionData.conversationId,
        );
      }

      return {
        success: true,
        data: solutionData,
      };
    } catch (error: unknown) {
      console.error(
          'Processing Helper Error:',
          error,
      );

      return {
        success: false,
        error:
            error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
      };
    }
  }

  private async processExtraScreenshotsHelper(
      screenshots: Array<{
        path: string;
        data: string;
      }>,

      signal: AbortSignal,
  ): Promise<{
    success: boolean;

    data?: DebugResponse;

    error?: string;
  }> {
    try {
      const images = screenshots.map(
          (screenshot) =>
              screenshot.data,
      );

      const token =
          this.getAuthToken();

      const isMock =
          process.env.IS_MOCK ===
          'true';

      if (!token) {
        return {
          success: false,
          error:
              'Your session has expired. Please sign in again.',
        };
      }

      const headers: Record<
          string,
          string
      > = {
        'Content-Type':
            'application/json',

        Authorization: `Bearer ${token}`,
      };

      const currentAppMode =
          this.deps.getAppMode();

      const processor =
          this.processorFactory.getProcessor(
              currentAppMode,
          );

      const readableVarNames =
          AppStorage.getInstance().getReadableVarNames();

      const processingParams: ProcessingParams =
          {
            images,
            isMock,
            readableVarNames,
            signal,
            headers,

            conversationId:
                this.deps.getConversationId() ||
                undefined,
          };

      const result =
          await processor.processDebug(
              processingParams,
          );

      if (!result.success) {
        return {
          success: false,
          error:
              result.error ||
              'Failed to process debug request',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error: unknown) {
      console.error(
          'Debug Processing Helper Error:',
          error,
      );

      return {
        success: false,
        error:
            error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
      };
    }
  }

  public cancelOngoingRequests(): void {
    let wasCancelled = false;

    if (
        this
            .currentProcessingAbortController
    ) {
      this.currentProcessingAbortController.abort();

      this.currentProcessingAbortController =
          null;

      wasCancelled = true;
    }

    if (
        this
            .currentExtraProcessingAbortController
    ) {
      this.currentExtraProcessingAbortController.abort();

      this.currentExtraProcessingAbortController =
          null;

      wasCancelled = true;
    }

    this.deps.setHasDebugged(false);

    this.screenshotHelper.resetQueue();

    const mainWindow =
        this.deps.getMainWindow();

    if (
        wasCancelled &&
        mainWindow &&
        !mainWindow.isDestroyed()
    ) {
      mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS
              .NO_SCREENSHOTS,
      );
    }
  }
}
