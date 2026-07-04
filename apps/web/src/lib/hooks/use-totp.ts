import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

const TOTP_STATUS_KEY = ['auth', '2fa', 'status'];

export function useTotpStatus() {
  return useQuery<{ enabled: boolean }>({
    queryKey: TOTP_STATUS_KEY,
    queryFn: async () => {
      const res = await apiClient.get<{ enabled: boolean }>('/auth/2fa/status');
      return res.data;
    },
  });
}

export function useSetupTotp() {
  return useMutation<{ qrCodeDataUrl: string; secret: string }, Error>({
    mutationFn: async () => {
      const res = await apiClient.post<{ qrCodeDataUrl: string; secret: string }>(
        '/auth/2fa/setup',
      );
      return res.data;
    },
  });
}

export function useEnableTotp() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (code: string) => {
      const res = await apiClient.post<{ success: boolean }>('/auth/2fa/enable', { code });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TOTP_STATUS_KEY });
    },
  });
}

export function useDisableTotp() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (code: string) => {
      const res = await apiClient.post<{ success: boolean }>('/auth/2fa/disable', { code });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TOTP_STATUS_KEY });
    },
  });
}
