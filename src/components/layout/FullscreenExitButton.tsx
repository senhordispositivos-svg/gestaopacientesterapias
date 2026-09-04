import React, { useState } from 'react';
import { Minimize2, Maximize, X, MonitorCheck, HelpCircle } from 'lucide-react';

interface FullscreenExitButtonProps {
  isFullscreen: boolean;
  onExitFullscreen: () => void;
  onEnterFullscreen?: () => void;
  error?: string | null;
}

export const FullscreenExitButton: React.FC<FullscreenExitButtonProps> = ({
  isFullscreen,
  onExitFullscreen,
  onEnterFullscreen,
  error,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isFullscreen && !error) {
    return null;
  }

  return (
    <>
      {/* Floating Exit Fullscreen Control (Always accessible in Fullscreen mode) */}
      {isFullscreen && (
        <div
          className="fixed top-2.5 right-3 z-50 flex items-center gap-1.5 transition-all duration-200 pointer-events-auto"
          role="region"
          aria-label="Controle de Tela Cheia"
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-teal-400 border border-teal-500/50 rounded-full shadow-2xl backdrop-blur-md transition-transform hover:scale-105"
              title="Expandir opções de tela cheia"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center bg-slate-950/95 text-slate-100 border border-teal-500/60 rounded-full px-3 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.6)] backdrop-blur-md gap-2 animate-in fade-in slide-in-from-top-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
                <MonitorCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Tela Cheia Ativa</span>
              </div>

              <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

              <button
                type="button"
                onClick={onExitFullscreen}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-bold rounded-full shadow-sm transition active:scale-95 cursor-pointer"
                title="Sair do modo tela cheia e voltar ao navegador"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Sair da Tela Cheia</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1 text-slate-400 hover:text-slate-200 transition rounded-full hover:bg-slate-800"
                title="Minimizar botão flutuante"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notice if Fullscreen was blocked by iframe/browser security policies */}
      {error && !isFullscreen && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 border border-amber-500/60 text-slate-200 p-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-300">Dica para Tablet (Modo Kiosk)</p>
              <p className="text-slate-300 leading-relaxed">
                {error}
              </p>
              <p className="text-[11px] text-teal-400 font-medium pt-1">
                No Chrome do tablet: Toque nos 3 pontos (⋮) &gt; &quot;Adicionar à tela inicial&quot;. O app abrirá 100% tela cheia como aplicativo nativo!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
