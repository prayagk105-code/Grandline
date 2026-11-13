import axios from 'axios';

export interface ParsedApiError {
  status: number;
  message: string;
  errorCode?: string;
  fieldErrors?: Record<string, string[]>;
}

interface ProblemDetailsShape {
  status?: number;
  title?: string;
  detail?: string;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export function parseApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): ParsedApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as ProblemDetailsShape | undefined;

    if (!error.response) {
      return {
        status: 0,
        message: 'Unable to reach the DAYFORM server. Check your connection and try again.'
      };
    }

    return {
      status,
      message: data?.detail || data?.message || data?.title || fallback,
      errorCode: data?.errorCode,
      fieldErrors: data?.errors
    };
  }

  if (error instanceof Error) {
    return { status: 0, message: error.message || fallback };
  }

  return { status: 0, message: fallback };
}

