import { SubscriptionLevel } from '../../../shared/api';
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
        void subscriptionLevel;

        const providerKey =
            'local';

        if (
            !storageProvider ||
            storageProviderKey !== providerKey
        ) {

            storageProvider =
                new LocalStorageProvider();

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
