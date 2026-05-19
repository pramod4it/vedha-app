import { API_ENDPOINTS } from '@shared/api.ts';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface ResumeExtractResponse {
  fileName: string;
  text: string;
}

const SERVER_UNAVAILABLE_MESSAGE =
  'Resume extraction server is unavailable. Please start the backend service or paste the resume text.';

function isServerUnavailableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  return (
    !error.response ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNRESET'
  );
}

export const resumeService = {
  async extract(file: File): Promise<ResumeExtractResponse> {
    const formData =
      new FormData();

    formData.append(
      'file',
      file,
    );

    let response;

    try {
      response =
        await axios.post<ResumeExtractResponse>(
          `${API_BASE_URL}${API_ENDPOINTS.RESUME.EXTRACT}`,
          formData,
          {
            timeout: 30000,
          },
        );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (isServerUnavailableError(error)) {
          throw new Error(SERVER_UNAVAILABLE_MESSAGE);
        }

        const message =
          (error.response?.data as { message?: string } | undefined)?.message ||
          (error.response?.status === 404
            ? 'Resume extraction endpoint was not found. Please restart vedha-service after the latest changes.'
            : undefined) ||
          (error.code === 'ECONNABORTED'
            ? 'Resume extraction timed out. Please try a smaller resume or paste the text.'
            : undefined) ||
          error.message;

        throw new Error(message);
      }

      throw error;
    }

    return response.data;
  },
};
