import { reactive, toRefs } from 'vue';

export type DownloadStatus = 'idle' | 'loading' | 'success' | 'error';

interface DownloadState {
  status: DownloadStatus;
  message: string | null;
}

const extractFilename = (response: Response, fallback: string) => {
  const disposition = response.headers.get('content-disposition');
  if (disposition) {
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    if (match?.[1]) return match[1];
  }
  return fallback;
};

export function useFileDownload() {
  const state = reactive<DownloadState>({
    status: 'idle',
    message: null,
  });

  const download = async (url: string, fallbackName: string) => {
    state.status = 'loading';
    state.message = null;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed (${res.status}): ${text}`);
      }

      const blob = await res.blob();
      const filename = extractFilename(res, fallbackName);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      state.status = 'success';
      state.message = filename;
    } catch (error) {
      state.status = 'error';
      state.message = (error as Error).message;
    }
  };

  const reset = () => {
    state.status = 'idle';
    state.message = null;
  };

  return {
    ...toRefs(state),
    download,
    reset,
  };
}
