import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Sparkles,
  X,
  Gauge,
  Sliders,
  CheckCircle2,
  Maximize,
  Minimize2,
} from 'lucide-react';

interface ResolutionScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface ScalePreset {
  scale: number;
  label: string;
  badge: string;
  description: string;
  icon: typeof Tablet;
  recommendedFor?: string;
}

const PRESETS: ScalePreset[] = [
  {
    scale: 75,
    label: '75% • Ultra Compacto',
    badge: 'Telas Pequenas',
    description: 'Ideal para tablets de 7" a 8" ou visualização horizontal estreita.',
    icon: Smartphone,
    recommendedFor: 'Tablets pequenos / Modo paisagem estreito',
  },
  {
    scale: 80,
    label: '80% • Tablet Compacto',
    badge: 'Recomendado',
    description: 'Perfeito para tablets de 8" a 10" (elimina cortes e reduz letras gigantes).',
    icon: Tablet,
    recommendedFor: 'Galaxy Tab, iPad Mini, telas de 1024x600',
  },
  {
    scale: 85,
    label: '85% • Tablet Padrão',
    badge: 'Equilibrado',
    description: 'Ajuste ideal para a grande maioria dos tablets de 10" a 11".',
    icon: Tablet,
    recommendedFor: 'iPad 10.2", Galaxy Tab S, telas de 1280x800',
  },
  {
    scale: 90,
    label: '90% • Equilibrado',
    badge: 'Leve Redução',
    description: 'Excelente harmonia entre legibilidade das letras e espaço de tela.',
    icon: Tablet,
    recommendedFor: 'Tablets grandes (11"-12") e notebooks',
  },
  {
    scale: 100,
    label: '100% • Padrão Original',
    badge: 'Computador',
    description: 'Escala padrão sem redução (tamanho nativo para computadores e monitores).',
    icon: Monitor,
    recommendedFor: 'Desktops, Notebooks e monitores Full HD',
  },
  {
    scale: 110,
    label: '110% • Letras Maiores',
    badge: 'Acessibilidade',
    description: 'Aumenta o tamanho dos textos e botões para maior facilidade de leitura.',
    icon: ZoomIn,
    recommendedFor: 'Monitores 2K/4K ou pessoas com dificuldade de visão',
  },
];

export const ResolutionScaleModal: React.FC<ResolutionScaleModalProps> = ({
  isOpen,
  onClose,
  currentScale,
  onScaleChange,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [screenInfo, setScreenInfo] = useState({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      });

      const handleResize = () => {
        setScreenInfo({
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!isOpen) return null;

  // Auto detect recommendation based on viewport
  const getAutoRecommendation = () => {
    const isLandscape = screenInfo.width > screenInfo.height;
    if (isLandscape && screenInfo.height <= 650) {
      return 80;
    }
    if (screenInfo.width <= 1024 && screenInfo.height <= 750) {
      return 85;
    }
    if (screenInfo.width <= 768) {
      return 80;
    }
    return 100;
  };

  const autoScale = getAutoRecommendation();

  const handleStep = (delta: number) => {
    const next = Math.min(130, Math.max(70, currentScale + delta));
    onScaleChange(next);
  };

  return (
    <div
      id="resolution-scale-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Ajuste de Resolução e Escala
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 font-extrabold">
                  {currentScale}%
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Calibre o tamanho ideal dos botões e letras para o seu tablet ou monitor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Quick Screen Detection Alert */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <span className="text-slate-300 font-medium">
                  Sua tela atual:{' '}
                  <strong className="text-white">
                    {screenInfo.width} x {screenInfo.height}px
                  </strong>{' '}
                  ({screenInfo.width > screenInfo.height ? 'Modo Horizontal' : 'Modo Vertical'})
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Recomendação inteligente para este dispositivo:{' '}
                  <strong className="text-teal-300">{autoScale}%</strong>
                </p>
              </div>
            </div>
            {currentScale !== autoScale && (
              <button
                type="button"
                onClick={() => onScaleChange(autoScale)}
                className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aplicar {autoScale}%</span>
              </button>
            )}
          </div>

          {/* Modo Tela Cheia Kiosk (Ocultar Navegador no Tablet) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30 shrink-0 mt-0.5">
                  <Maximize className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Modo Tela Cheia (Ocultar Navegador)</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isFullscreen ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {isFullscreen ? 'Ativado' : 'Desativado'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Oculta a barra de endereços, botões e abas do navegador no tablet, transformando em tela cheia total.
                  </p>
                </div>
              </div>

              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer ${
                    isFullscreen
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                  }`}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Sair da Tela Cheia</span>
                    </>
                  ) : (
                    <>
                      <Maximize className="w-3.5 h-3.5" />
                      <span>Ativar Tela Cheia</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-teal-400 block">💡 Para abrir SEMPRE sem navegador no tablet (Kiosk Permanente):</span>
              <p className="leading-relaxed">
                • <strong>Android (Chrome / Edge / Samsung Internet):</strong> Toque nos 3 pontinhos (⋮) no topo do navegador e selecione <strong>&quot;Adicionar à tela inicial&quot;</strong> ou <strong>&quot;Instalar aplicativo&quot;</strong>.
              </p>
              <p className="leading-relaxed">
                • <strong>iPad (Safari):</strong> Toque no ícone de Compartilhar (quadrado com seta para cima) e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
              </p>
            </div>
          </div>

          {/* Slider & Fine-Tuning Control */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Ajuste Fino Manual
              </span>
              <span className="text-lg font-black text-teal-400 font-mono">
                {currentScale}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStep(-5)}
                disabled={currentScale <= 70}
                className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 flex items-center justify-center text-white font-bold transition shrink-0 cursor-pointer"
                title="Diminuir 5%"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="70"
                max="125"
                step="5"
                value={currentScale}
                onChange={(e) => onScaleChange(Number(e.target.value))}
                className="flex-1 accent-teal-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => handleStep(5)}
                disabled={currentScale >= 125}
                className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 flex items-center justify-center text-white font-bold transition shrink-0 cursor-pointer"
                title="Aumentar 5%"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onScaleChange(100)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-semibold text-slate-300 hover:text-white transition shrink-0 cursor-pointer flex items-center gap-1"
                title="Redefinir para 100%"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Resetar</span>
              </button>
            </div>
          </div>

          {/* Scale Presets Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Escolha o Perfil que melhor se adapta ao seu aparelho:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESETS.map((preset) => {
                const isSelected = currentScale === preset.scale;
                const IconComponent = preset.icon;

                return (
                  <button
                    key={preset.scale}
                    type="button"
                    onClick={() => onScaleChange(preset.scale)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-950/40 border-teal-400 ring-2 ring-teal-500/20 shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <IconComponent
                          className={`w-4 h-4 ${
                            isSelected ? 'text-teal-300' : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`font-bold text-xs ${
                            isSelected ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {preset.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-teal-500/30 text-teal-200 border border-teal-400/40'
                            : 'bg-slate-700/80 text-slate-400'
                        }`}
                      >
                        {preset.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-tight">
                      {preset.description}
                    </p>

                    {preset.recommendedFor && (
                      <span className="block text-[10px] text-teal-400/80 font-medium mt-1.5">
                        ↳ {preset.recommendedFor}
                      </span>
                    )}

                    {isSelected && (
                      <div className="absolute right-2.5 bottom-2 text-teal-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            💾 O ajuste fica salvo automaticamente na memória deste aparelho.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition shadow-sm cursor-pointer"
          >
            Concluir Ajuste
          </button>
        </div>
      </div>
    </div>
  );
};
