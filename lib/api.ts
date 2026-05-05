export const getApiBaseUrl = () => {
  return (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
};

export const API_BASE_URL = getApiBaseUrl();

type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
};

export async function apiFetch(input: string, options: ApiFetchOptions = {}) {
  const { timeoutMs = 15000, ...requestOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...requestOptions,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Unable to reach NexGO API after ${Math.round(timeoutMs / 1000)}s. Check your internet connection and try again.`
      );
    }

    throw new Error(
      `Unable to reach NexGO API at ${API_BASE_URL}. Please check your internet connection or install the latest app build.`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}
