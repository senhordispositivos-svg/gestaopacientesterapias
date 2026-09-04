import React, { useState } from 'react';
import {
  Gauge,
  Calendar,
  Package,
  User as UserIcon,
  Cake,
  BarChart3,
  ClipboardCheck,
  Users,
  Headphones,
  Phone,
  Mail,
  ExternalLink,
  X,
  Sparkles,
  Activity,
  HeartPulse,
  Laptop,
  Sliders,
  Maximize,
  Minimize2,
} from 'lucide-react';
import { Tenant, User } from '../types/index';

interface MobileTabletHubProps {
  tenant: Tenant | null;
  user: User | null;
  activeView: string;
  onNavigate: (viewId: string) => void;
  onOpenPatientModal?: () => void;
  onOpenAnamnesisModal?: () => void;
  onSwitchToDesktop?: () => void;
  resolutionScale?: number;
  onOpenResolutionModal?: () => void;
  onChangeScaleStep?: (delta: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface HubTileConfig {
  id: string;
  title: string | string[];
  subplateText: string;
  icon: React.ComponentType<{ className?: string }>;
  isGoldHighlighted?: boolean;
  targetView: string;
}

export const MobileTabletHub: React.FC<MobileTabletHubProps> = ({
  tenant,
  user,
  onNavigate,
  onSwitchToDesktop,
  resolutionScale = 100,
  onOpenResolutionModal,
  onChangeScaleStep,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const tiles: HubTileConfig[] = [
    {
      id: 'dashboard',
      title: 'DASHBOARD',
      subplateText: 'DASHBOARD',
      icon: Gauge,
      isGoldHighlighted: true,
      targetView: 'dashboard',
    },
    {
      id: 'sessions',
      title: 'SESSÕES',
      subplateText: 'SESSÕES',
      icon: Calendar,
      isGoldHighlighted: false,
      targetView: 'sessions',
    },
    {
      id: 'packages',
      title: 'PACOTES',
      subplateText: 'PACOTES',
      icon: Package,
      isGoldHighlighted: false,
      targetView: 'packages',
    },
    {
      id: 'patients',
      title: 'PACIENTES',
      subplateText: 'PACIENTES',
      icon: UserIcon,
      isGoldHighlighted: false,
      targetView: 'patients',
    },
    {
      id: 'birthdays',
      title: 'ANIVERSARIANTES',
      subplateText: 'ANIVERSARIANTES',
      icon: Cake,
      isGoldHighlighted: false,
      targetView: 'birthdays',
    },
    {
      id: 'reports',
      title: 'RELATÓRIO',
      subplateText: 'RELATÓRIO',
      icon: BarChart3,
      isGoldHighlighted: false,
      targetView: 'reports',
    },
    {
      id: 'anamnesis',
      title: 'ANAMNESE',
      subplateText: 'ANAMNESE',
      icon: ClipboardCheck,
      isGoldHighlighted: false,
      targetView: 'anamnesis',
    },
    {
      id: 'professionals',
      title: ['USUÁRIOS E', 'PERMISSÕES'],
      subplateText: 'USUÁRIOS',
      icon: Users,
      isGoldHighlighted: false,
      targetView: 'professionals',
    },
    {
      id: 'support',
      title: 'SUPORTE TÉCNICO',
      subplateText: 'SUPORTE TÉCNICO',
      icon: Headphones,
      isGoldHighlighted: false,
      targetView: 'support_modal',
    },
  ];

  const handleTileClick = (tile: HubTileConfig) => {
    if (tile.id === 'support' || tile.targetView === 'support_modal') {
      setIsSupportModalOpen(true);
    } else {
      onNavigate(tile.targetView);
    }
  };

  const supportPhone = tenant?.supportPhone || tenant?.phone || '5511999999999';
  const supportEmail = tenant?.supportEmail || tenant?.email || 'suporte@clinicaterapias.com.br';

  return (
    <div
      id="mobile-tablet-reference-screen"
      className="relative min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] flex flex-col justify-between p-2.5 sm:p-4 md:p-5 select-none text-slate-100 overflow-hidden bg-radial from-[#15283f] via-[#0e1c2e] to-[#070e17] rounded-2xl md:rounded-3xl border border-slate-700/60 shadow-2xl"
    >
      {/* Background Metallic Subtle Shimmer & Fine Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(to right, #60a5fa 1px, transparent 1px), linear-gradient(to bottom, #60a5fa 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header matching reference image: Medical Cross + "Clínica de" / "Terapias Integradas" */}
      <div className="relative z-10 flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-700/50 mb-2 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Medical Cross Icon / Custom Company Logo in 3D Silver Emboss */}
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 border border-slate-500/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.6)] overflow-hidden shrink-0">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt="Logomarca da Empresa"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            )}
          </div>

          <div className="min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-medium text-slate-300 tracking-wider">
              Clínica de
            </span>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate max-w-[220px] sm:max-w-md">
              {tenant?.tradeName || tenant?.name || 'Terapias Integradas'}
            </h1>
          </div>
        </div>

        {/* Top right quick switcher & user badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Resolution Zoom Stepper & Modal Trigger */}
          {onOpenResolutionModal && (
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-0.5 shadow-sm">
              {onChangeScaleStep && (
                <button
                  type="button"
                  onClick={() => onChangeScaleStep(-5)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer"
                  title="Diminuir letras (Zoom -5%)"
                >
                  -
                </button>
              )}

              <button
                type="button"
                onClick={onOpenResolutionModal}
                className="flex items-center gap-1 px-2 py-1 text-teal-300 hover:text-white text-[11px] sm:text-xs font-bold transition cursor-pointer"
                title="Escolher melhor resolução para o seu tablet"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>{resolutionScale}%</span>
              </button>

              {onChangeScaleStep && (
                <button
                  type="button"
                  onClick={() => onChangeScaleStep(5)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer"
                  title="Aumentar letras (Zoom +5%)"
                >
                  +
                </button>
              )}
            </div>
          )}

          {onSwitchToDesktop && (
            <button
              type="button"
              onClick={onSwitchToDesktop}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer shadow-sm"
              title="Modo Computador / Notebook"
            >
              <Laptop className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline">Visão Desktop</span>
            </button>
          )}

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm border ${
                isFullscreen
                  ? 'bg-rose-950/70 hover:bg-rose-900/90 border-rose-500/70 text-rose-200 hover:text-white ring-1 ring-rose-500/40'
                  : 'bg-teal-950/60 hover:bg-teal-900/80 border-teal-500/50 text-teal-300 hover:text-white'
              }`}
              title={
                isFullscreen
                  ? 'Sair da Tela Cheia e voltar ao navegador'
                  : 'Modo Tela Cheia (Ocultar o navegador no tablet)'
              }
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="hidden sm:inline">Sair Tela Cheia</span>
                  <span className="sm:hidden">Sair</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="hidden sm:inline">Tela Cheia</span>
                  <span className="sm:hidden">Tela Cheia</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider hidden sm:inline-block">
              {user?.name?.split(' ')[0] || 'Conectado'}
            </span>
          </div>
        </div>
      </div>

      {/* 3x3 Tactile 3D Grid */}
      <main className="relative z-10 flex-1 flex items-center justify-center my-auto py-1 sm:py-2">
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
          {tiles.map((tile) => {
            const IconComponent = tile.icon;
            const isGold = tile.isGoldHighlighted;

            return (
              <div
                key={tile.id}
                id={`tactile-btn-${tile.id}`}
                onClick={() => handleTileClick(tile)}
                className="group relative cursor-pointer select-none transition-transform duration-150 active:scale-[0.98] transform"
              >
                {/* 3D Chamfered Outer Beveled Card Frame */}
                <div
                  className={`relative flex flex-col justify-between p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 min-h-[62px] sm:min-h-[68px] md:min-h-[74px] ${
                    isGold
                      ? 'metallic-bevel-gold border-amber-400/80 hover:border-amber-300 shadow-[0_6px_18px_rgba(0,0,0,0.85),0_0_14px_rgba(245,158,11,0.2)]'
                      : 'metallic-bevel-blue border-slate-500/70 hover:border-sky-400/80 shadow-[0_6px_16px_rgba(0,0,0,0.85),0_0_10px_rgba(56,189,248,0.12)]'
                  }`}
                >
                  {/* Subtle Inner Diamond Faceted Highlight Polygon */}
                  <div
                    className="absolute inset-1 rounded-lg sm:rounded-xl pointer-events-none opacity-40"
                    style={{
                      background: isGold
                        ? 'linear-gradient(135deg, rgba(254, 240, 138, 0.18) 0%, rgba(217, 119, 6, 0.08) 50%, rgba(0, 0, 0, 0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(186, 230, 253, 0.15) 0%, rgba(30, 58, 138, 0.08) 50%, rgba(0, 0, 0, 0.3) 100%)',
                    }}
                  />

                  {/* Corner Accent Facet Cuts */}
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 rounded-tl-lg pointer-events-none opacity-70 border-white/40" />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 rounded-tr-lg pointer-events-none opacity-70 border-white/40" />
                  <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 rounded-bl-lg pointer-events-none opacity-70 border-white/40" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 rounded-br-lg pointer-events-none opacity-70 border-white/40" />

                  {/* Card Center Content: 3D Chrome Icon + Embossed Metallic Title */}
                  <div className="relative z-10 flex items-center justify-start gap-2.5 sm:gap-3 my-auto">
                    {/* Embossed Chrome Icon Relief Frame */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isGold
                          ? 'bg-gradient-to-br from-amber-500/30 via-amber-700/20 to-slate-900 border border-amber-400/60 shadow-[inset_0_1px_2px_rgba(254,240,138,0.6),0_3px_6px_rgba(0,0,0,0.8)] text-amber-200'
                          : 'bg-gradient-to-br from-slate-600/40 via-slate-800/40 to-slate-950 border border-slate-400/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_3px_6px_rgba(0,0,0,0.8)] text-slate-200 group-hover:text-white'
                      }`}
                    >
                      <IconComponent
                        className={`w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                          isGold ? 'text-amber-200' : 'text-slate-100 group-hover:text-sky-200'
                        }`}
                      />
                    </div>

                    {/* Embossed Metallic Typography with balanced scale */}
                    <div className="flex-1 min-w-0">
                      {Array.isArray(tile.title) ? (
                        <div className="flex flex-col">
                          {tile.title.map((line, idx) => (
                            <span
                              key={idx}
                              className={`block font-black text-xs sm:text-xs md:text-xs lg:text-sm tracking-wide uppercase leading-tight truncate ${
                                isGold ? 'chrome-text-gold' : 'chrome-text-silver'
                              }`}
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span
                          className={`block font-black text-xs sm:text-xs md:text-sm lg:text-base tracking-wide uppercase leading-tight truncate ${
                            isGold ? 'chrome-text-gold' : 'chrome-text-silver'
                          }`}
                        >
                          {tile.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brushed Metal Plaque Subplate */}
                  <div className="relative z-10 w-full mt-1 pt-0.5 flex justify-center">
                    <div
                      className={`px-2 sm:px-3 py-0.5 rounded text-[8px] sm:text-[9px] md:text-[9.5px] font-extrabold uppercase tracking-wider border transition-all ${
                        isGold
                          ? 'metal-subplate-gold border-amber-500/50 text-amber-200'
                          : 'metal-subplate border-slate-600/70 text-slate-300 group-hover:text-white group-hover:border-slate-500'
                      }`}
                    >
                      <span>{tile.subplateText}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Info / Status Bar */}
      <div className="relative z-10 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-1.5 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
          <span className="font-semibold text-slate-300">
            Painel Tátil Interativo • Tempo Real
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onOpenResolutionModal && (
            <button
              type="button"
              onClick={onOpenResolutionModal}
              className="text-teal-400 hover:text-teal-300 font-bold transition flex items-center gap-1 cursor-pointer"
              title="Ajustar Resolução da Tela"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Resolução: {resolutionScale}%</span>
            </button>
          )}

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`font-bold transition flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg border ${
                isFullscreen
                  ? 'text-rose-300 hover:text-rose-200 bg-rose-950/40 border-rose-700/60'
                  : 'text-teal-300 hover:text-teal-200 bg-teal-950/40 border-teal-700/60'
              }`}
              title={
                isFullscreen
                  ? 'Sair do Modo Tela Cheia e voltar ao navegador'
                  : 'Ativar Modo Tela Cheia (Ocultar o Navegador)'
              }
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3 h-3 text-rose-400" />
                  <span>Sair da Tela Cheia</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3 h-3 text-teal-400" />
                  <span>Tela Cheia</span>
                </>
              )}
            </button>
          )}

          <span className="text-slate-400 hidden sm:inline">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>

          <button
            type="button"
            onClick={() => setIsSupportModalOpen(true)}
            className="text-teal-400 hover:text-teal-300 font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Suporte Técnico</span>
          </button>
        </div>
      </div>

      {/* Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Suporte Técnico</h3>
                <p className="text-xs text-teal-400">Atendimento à Clínica & Profissionais</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              Precisa de auxílio técnico com atendimentos, assinaturas, agendamentos ou sincronização do banco de dados?
            </p>

            <div className="space-y-3 mb-6">
              <a
                href={`https://wa.me/${supportPhone.replace(/\D/g, '')}?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20t%C3%A9cnico%20no%20sistema%20da%20cl%C3%ADnica.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl font-bold text-emerald-300 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <span>WhatsApp Suporte Direto</span>
                </div>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={`mailto:${supportEmail}?subject=Suporte%20T%C3%A9cnico%20-%20Sistema%20Cl%C3%ADnica`}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/60 rounded-xl font-bold text-slate-200 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5" />
                  <span>E-mail de Suporte</span>
                </div>
                <span className="text-xs text-slate-400">{supportEmail}</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setIsSupportModalOpen(false)}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
