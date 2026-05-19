import {
  ProgrammingLanguage,
  SubscriptionLevel,
  UserLanguage,
  type AuthenticatedUser,
  type AuthResponse,
} from '@shared/api.ts';
import type { IAuthProvider } from './AuthProvider';

const SELF_HOSTED_TOKEN =
  'self-hosted-local-session';

export class SelfHostedAuthProvider implements IAuthProvider {
  private token: string | null =
    SELF_HOSTED_TOKEN;

  login(email: string): Promise<AuthResponse> {
    this.token =
      SELF_HOSTED_TOKEN;

    return Promise.resolve({
      data: {
        user: {
          email,
        },
        session: {
          access_token: SELF_HOSTED_TOKEN,
        },
      },
      error: null,
    });
  }

  signUp(email: string): Promise<AuthResponse> {
    return this.login(
      email,
    );
  }

  getCurrentUser(): Promise<AuthenticatedUser | null> {
    if (!this.token) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      user: {
        email: 'self-hosted@vedha.local',
      },
      subscription: {
        active_from: null,
        active_to: null,
        level: SubscriptionLevel.PRO,
      },
      settings: {
        solutionLanguage: ProgrammingLanguage.Java,
        userLanguage: UserLanguage.EN_US,
      },
    });
  }

  setAuthToken(token: string): Promise<void> {
    this.token =
      token || SELF_HOSTED_TOKEN;

    return Promise.resolve();
  }

  clearAuthToken(): Promise<void> {
    this.token =
      null;

    return Promise.resolve();
  }

  getAuthToken(): Promise<string | null> {
    return Promise.resolve(
      this.token,
    );
  }

  async signOut(): Promise<void> {
    await this.clearAuthToken();
  }

  isAuthenticated(): Promise<boolean> {
    return Promise.resolve(
      this.token !== null,
    );
  }
}
