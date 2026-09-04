import { useState, useEffect, useCallback } from 'react';

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  error: string | null;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  });

  const [error, setError] = useState<string | null>(null);

  const checkIsFullscreen = useCallback((): boolean => {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }, []);

  const isSupported = typeof document !== 'undefined' && Boolean(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled ||
    document.documentElement.requestFullscreen ||
    (document.documentElement as any).webkitRequestFullscreen
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(checkIsFullscreen());
      setError(null);
    };

    const handleFullscreenError = (e: any) => {
      console.warn('[useFullscreen] Fullscreen event error:', e);
      setIsFullscreen(checkIsFullscreen());
      setError('O navegador ou a permissão da janela restringiu a tela cheia.');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    document.addEventListener('fullscreenerror', handleFullscreenError);
    document.addEventListener('webkitfullscreenerror', handleFullscreenError);
    document.addEventListener('mozfullscreenerror', handleFullscreenError);
    document.addEventListener('MSFullscreenError', handleFullscreenError);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      document.removeEventListener('fullscreenerror', handleFullscreenError);
      document.removeEventListener('webkitfullscreenerror', handleFullscreenError);
      document.removeEventListener('mozfullscreenerror', handleFullscreenError);
      document.removeEventListener('MSFullscreenError', handleFullscreenError);
    };
  }, [checkIsFullscreen]);

  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      } else {
        throw new Error('API de tela cheia não suportada neste navegador.');
      }
      setIsFullscreen(true);
      return true;
    } catch (err: any) {
      console.warn('[useFullscreen] Falha ao entrar em tela cheia:', err);
      const msg = err?.message?.includes('Permissions check failed') || err?.name === 'TypeError'
        ? 'Para tela cheia sem barras do navegador, abra em uma aba direta ou adicione à tela inicial do tablet.'
        : (err?.message || 'Não foi possível ativar tela cheia no momento.');
      setError(msg);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const doc = document as any;
      if (checkIsFullscreen()) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
      setIsFullscreen(false);
      return true;
    } catch (err: any) {
      console.warn('[useFullscreen] Falha ao sair de tela cheia:', err);
      setIsFullscreen(checkIsFullscreen());
      return false;
    }
  }, [checkIsFullscreen]);

  const toggleFullscreen = useCallback(async (): Promise<boolean> => {
    if (checkIsFullscreen()) {
      return await exitFullscreen();
    } else {
      return await enterFullscreen();
    }
  }, [checkIsFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    error,
  };
}
