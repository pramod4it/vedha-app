import { ApiAuthProvider } from './ApiAuthProvider';
import type { IAuthProvider } from './AuthProvider';

export * from './AuthProvider';

let authProvider: IAuthProvider | null = null;

export const getAuthProvider = (): IAuthProvider => {
  if (!authProvider) {
    authProvider = new ApiAuthProvider();
  }

  return authProvider;
};