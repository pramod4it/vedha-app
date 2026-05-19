import { AppMode, ProgrammingLanguage, UserLanguage } from '@shared/api.ts';
import { LOCAL_STORAGE_KEYS } from '@shared/storage';
import type { IStorageProvider, UserSettings } from './StorageProvider';

export class LocalStorageProvider implements IStorageProvider {
  private readonly STORAGE_KEY = LOCAL_STORAGE_KEYS.VEDHA_SETTINGS;

  private normalizeAppMode(appMode?: AppMode): AppMode {
    return appMode === AppMode.LIVE_INTERVIEW
      ? AppMode.LIVE_INTERVIEW
      : AppMode.LIVE_INTERVIEW;
  }

  private normalizeSolutionLanguage(language?: ProgrammingLanguage): ProgrammingLanguage {
    return language === ProgrammingLanguage.C ||
      language === ProgrammingLanguage.Cpp ||
      language === ProgrammingLanguage.Java
      ? language
      : ProgrammingLanguage.Java;
  }

  getSettings(): Promise<UserSettings> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          solutionLanguage?: ProgrammingLanguage;
          userLanguage?: UserLanguage;
          appMode?: AppMode;
        };

        return Promise.resolve({
          solutionLanguage: this.normalizeSolutionLanguage(parsed.solutionLanguage),
          userLanguage: parsed.userLanguage || UserLanguage.EN_US,
          appMode: this.normalizeAppMode(parsed.appMode),
        });
      } catch (error) {
        console.warn('Failed to parse stored settings:', error);
      }
    }

    return Promise.resolve({
      solutionLanguage: ProgrammingLanguage.Java,
      userLanguage: UserLanguage.EN_US,
      appMode: AppMode.LIVE_INTERVIEW,
    });
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    if (settings.solutionLanguage) {
      newSettings.solutionLanguage =
        this.normalizeSolutionLanguage(settings.solutionLanguage);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
  }

  async getSolutionLanguage(): Promise<ProgrammingLanguage> {
    const settings = await this.getSettings();

    return settings.solutionLanguage;
  }

  async setSolutionLanguage(language: ProgrammingLanguage): Promise<void> {
    await this.updateSettings({ solutionLanguage: language });
  }

  async getUserLanguage(): Promise<UserLanguage> {
    const settings = await this.getSettings();

    return settings.userLanguage;
  }

  async setUserLanguage(language: UserLanguage): Promise<void> {
    await this.updateSettings({ userLanguage: language });
  }

  async getAppMode(): Promise<AppMode> {
    const settings = await this.getSettings();

    return settings.appMode;
  }

  async setAppMode(appMode: AppMode): Promise<void> {
    await this.updateSettings({ appMode: this.normalizeAppMode(appMode) });
  }
}
