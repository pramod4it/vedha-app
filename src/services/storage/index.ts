import { SubscriptionLevel } from '../../../shared/api';
import { isSelfHosted } from '../../../shared/constants';
import { ApiStorageProvider } from './ApiStorageProvider';

import { LocalStorageProvider } from './LocalStorageProvider';

import type { IStorageProvider } from './StorageProvider';

export * from './StorageProvider';

let storageProvider: IStorageProvider | null =
    null;

let storageProviderKey: string | null =
    null;

export const getStorageProvider =
    (
        subscriptionLevel?: SubscriptionLevel,
    ): IStorageProvider => {
        const providerKey =
            isSelfHosted() || subscriptionLevel !== SubscriptionLevel.PRO
                ? 'local'
                : 'api';

        if (
            !storageProvider ||
            storageProviderKey !== providerKey
        ) {

            storageProvider =
                providerKey === 'api'
                    ? new ApiStorageProvider()
                    : new LocalStorageProvider();

            storageProviderKey =
                providerKey;
        }

        return storageProvider;
    };

export const resetStorageProvider =
    (): void => {

        storageProvider = null;
        storageProviderKey = null;
    };
