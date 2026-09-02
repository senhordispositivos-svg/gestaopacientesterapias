import React, { useState, useEffect } from 'react';
import { CanvasSignature } from '../common/CanvasSignature';
import { api } from '../../services/api';
import { CheckCircle2, ShieldCheck, Building2, AlertCircle, Clock, Lock } from 'lucide-react';

interface PublicValidationPageProps {
  token: string;
  onBackToApp?: () => void;
}

export const PublicValidationPage: React.FC<PublicValidationPageProps> = ({
  token,
  onBackToApp,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadPublicData() {
      setLoading(true);
      setError('');
      try {
        const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const payloadData = query ? (query.get('d') || query.get('data')) : null;
        const res = await api.getPublicValidationData(token, payloadData);
        setData(res);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Token de validação inválido ou expirado.');
        } else {
          setError('Token de validação inválido ou expirado.');
        }
      } finally {
        setLoading(false);
      }
    }
    if (token) loadPublicData();
  }, [token]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedCheck) {
      alert('Marque a caixa de confirmação de atendimento.');
      return;
    }
    if (!signatureUrl) {
      alert('Desenhe e confirme sua assinatura no quadro.');
      return;
    }

    setIsSubmitting(true);
    try {
      const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const payloadData = query ? (query.get('d') || query.get('data')) : null;
      await api.confirmPublicAttendance(token, signatureUrl, payloadData);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || 'Erro ao confirmar atendimento.');
      } else {
        alert('Erro ao confirmar atendimento.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">Carregando validação segura de atendimento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Link Indisponível</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
            >
              Voltar para a Aplicação
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAlreadySigned = data?.isAlreadySigned || !!data?.session?.clientSignatureUrl || !!data?.clientSignatureUrl;
  const existingSignature = data?.clientSignatureUrl || data?.session?.clientSignatureUrl;
  const signedDate = data?.signedAt || data?.session?.clientConfirmedAt || data?.session?.attendedAt;

  if (success || isAlreadySigned) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">
              {isAlreadySigned && !success ? 'Atendimento Já Validado e Assinado' : 'Atendimento Confirmado com Sucesso!'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
              {isAlreadySigned && !success
                ? 'Esta sessão já foi assinada digitalmente pelo paciente e está devidamente autenticada no sistema.'
                : 'Sua assinatura digital foi registrada com sucesso e vinculada ao prontuário da clínica.'}
            </p>
          </div>

          {/* Session details */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Paciente:</span>
              <strong className="text-white">{data?.patient?.name || data?.session?.patientName}</strong>
            </div>
            {data?.patient?.cpf && (
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">CPF:</span>
                <span className="text-slate-200 font-mono">{data.patient.cpf}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Sessão:</span>
              <strong className="text-teal-300">Sessão #{data?.session?.sessionNumber}</strong>
            </div>
            {signedDate && (
              <div className="flex justify-between">
                <span className="text-slate-400">Data da Assinatura:</span>
                <span className="text-emerald-400 font-semibold">
                  {new Date(signedDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {/* Render Signature Image if Available */}
          {(existingSignature || signatureUrl) && (
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Assinatura Digital Registrada</p>
              <img
                src={existingSignature || signatureUrl}
                alt="Assinatura do Paciente"
                className="max-h-24 mx-auto object-contain"
              />
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                Assinatura Válida • Registro Criptografado
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-800/80 text-[11px] text-slate-400 font-mono border border-slate-750">
            🔒 Documento Seguro Bloqueado para Novas Edições
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition mt-2"
            >
              Ir para Painel Administrativo
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Clinic Header */}
        <div className="p-6 bg-gradient-to-r from-teal-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xl">
              {data?.tenant?.logoUrl ? (
                <img src={data.tenant.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="font-black text-base text-white">{data?.tenant?.tradeName}</h2>
              <p className="text-[11px] text-teal-300 font-semibold">Validação de Atendimento Realizado</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-teal-400 font-bold px-2.5 py-1 rounded-full bg-teal-950 border border-teal-800">
            <Lock className="w-3 h-3" /> Link Seguro
          </div>
        </div>

        {/* Client & Session Info */}
        <div className="p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cliente / Paciente</p>
            <p className="text-base font-extrabold text-white">{data?.patient?.name}</p>
            <p className="text-xs text-teal-400 font-semibold">{data?.package?.title}</p>
          </div>

          {/* Session Progress List */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Progresso do Pacote de Sessões
            </p>
            <div className="grid grid-cols-1 gap-2">
              {data?.allSessions?.map((s: any) => (
                <div
                  key={s.sessionNumber}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    s.isCurrent
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300 ring-2 ring-teal-500/20'
                      : s.status === 'COMPLETED'
                      ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400'
                      : 'bg-slate-800/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {s.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-500" />
                    )}
                    <span>
                      Sessão #{s.sessionNumber} {s.isCurrent && '(Atual - Em Validação)'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase">{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Form */}
          <form onSubmit={handleConfirm} className="space-y-4 pt-4 border-t border-slate-800">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedCheck}
                onChange={e => setConfirmedCheck(e.target.checked)}
                className="w-5 h-5 rounded text-teal-500 focus:ring-teal-500 mt-0.5"
              />
              <span className="text-xs font-extrabold text-white leading-relaxed">
                ESTOU CIENTE QUE REALIZEI O ATENDIMENTO.
              </span>
            </label>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Assinatura Digital de Validação
              </label>
              <CanvasSignature
                onSave={url => setSignatureUrl(url)}
                onChange={url => setSignatureUrl(url)}
                width={450}
                height={180}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !confirmedCheck || !signatureUrl}
              className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-xl transition disabled:opacity-40 flex items-center justify-center gap-2 notranslate"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin shrink-0" />
                  <span>Confirmando...</span>
                </span>
              ) : (
                <span>CONFIRMAR ATENDIMENTO</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
