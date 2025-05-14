import { QueryClient } from '@tanstack/react-query';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });
  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = 'returnNull' | 'throw';

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: string[] }): Promise<T | null> => {
    try {
      const [url, ...params] = queryKey;
      const queryString = params.length
        ? `?${new URLSearchParams(Object.fromEntries(
            params.map((p, i) => [`p${i}`, p.toString()])
          )).toString()}`
        : '';
      return await apiRequest<T>(`${url}${queryString}`);
    } catch (e: any) {
      if (e?.response?.status === 401 && options.on401 === 'returnNull') {
        return null;
      }
      throw e;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});