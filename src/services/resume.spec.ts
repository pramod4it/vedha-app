import axios from 'axios';
import { resumeService } from './resume.ts';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('resumeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.isAxiosError.mockImplementation(
      (error): error is Parameters<typeof mockedAxios.post>[0] & Error =>
        Boolean(error && typeof error === 'object' && (error as { isAxiosError?: boolean }).isAxiosError),
    );
  });

  it('returns a helpful recoverable error when the backend is unavailable during PDF upload', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    const file =
      new File(['resume'], 'resume.pdf', {
        type: 'application/pdf',
      });

    await expect(resumeService.extract(file)).rejects.toThrow(
      'Resume extraction server is unavailable. Please start the backend service or paste the resume text.',
    );
  });

  it('preserves backend validation messages', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          message: 'Only PDF files are supported.',
        },
      },
      message: 'Request failed with status code 400',
    });

    const file =
      new File(['resume'], 'resume.pdf', {
        type: 'application/pdf',
      });

    await expect(resumeService.extract(file)).rejects.toThrow('Only PDF files are supported.');
  });
});
