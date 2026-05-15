import { AppMode } from '../../shared/api';

import { LiveInterviewConfig } from './configs/LiveInterviewConfig';

import { WindowConfigFactory } from './WindowConfigFactory';

describe('WindowConfigFactory', () => {
  beforeEach(() => {
    (WindowConfigFactory as any).instance =
        null;
  });

  describe('getInstance', () => {
    test(
        'WHEN getInstance is called twice THEN it returns the same singleton',

        () => {
          const a =
              WindowConfigFactory.getInstance();

          const b =
              WindowConfigFactory.getInstance();

          expect(a).toBe(b);
        },
    );
  });

  describe('getConfig', () => {
    test(
        'WHEN appMode is LIVE_INTERVIEW THEN it returns LiveInterviewConfig',

        () => {
          const factory =
              WindowConfigFactory.getInstance();

          const config =
              factory.getConfig(
                  AppMode.LIVE_INTERVIEW,
              );

          expect(config)
              .toBe(
                  LiveInterviewConfig,
              );
        },
    );

    test(
        'WHEN appMode is unknown THEN it falls back to LiveInterviewConfig',

        () => {
          const factory =
              WindowConfigFactory.getInstance();

          const config =
              factory.getConfig(
                  'mystery' as AppMode,
              );

          expect(config)
              .toBe(
                  LiveInterviewConfig,
              );
        },
    );
  });
});