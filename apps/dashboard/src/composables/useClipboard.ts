import { ref } from 'vue';

type CopyStatus = 'idle' | 'copying' | 'success' | 'error';

export function useClipboard() {
  const status = ref<CopyStatus>('idle');
  const error = ref<string | null>(null);

  const copy = async (text: string) => {
    if (status.value === 'copying') return;
    
    status.value = 'copying';
    error.value = null;

    try {
      await navigator.clipboard.writeText(text);
      status.value = 'success';
      
      // Reset status after 2 seconds
      setTimeout(() => {
        if (status.value === 'success') {
          status.value = 'idle';
        }
      }, 2000);
    } catch (err) {
      status.value = 'error';
      error.value = (err as Error).message;
      
      // Reset status after 3 seconds
      setTimeout(() => {
        if (status.value === 'error') {
          status.value = 'idle';
        }
      }, 3000);
    }
  };

  return {
    status,
    error,
    copy,
    isIdle: () => status.value === 'idle',
    isCopying: () => status.value === 'copying',
    isSuccess: () => status.value === 'success',
    isError: () => status.value === 'error',
  };
}