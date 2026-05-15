import { SubscriptionLevel } from '../../../shared/api';

import { LocalStorageProvider } from './LocalStorageProvider';

import type { IStorageProvider } from './StorageProvider';

export * from './StorageProvider';

let storageProvider: IStorageProvider | null =
    null;

export const getStorageProvider =
    (
        _subscriptionLevel?: SubscriptionLevel,
    ): IStorageProvider => {

        if (!storageProvider) {

            storageProvider =
                new LocalStorageProvider();
        }

        return storageProvider;
    };

export const resetStorageProvider =
    (): void => {

        storageProvider = null;
    };