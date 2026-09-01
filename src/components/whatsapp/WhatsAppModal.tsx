import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Session, Patient } from '../../types';
import { MessageSquare, Send, Copy, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: Session;
  patient?: Patient;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  session,
  patient,
}) => {
  const { tenant } = useAuth();
  const [validationUrl, setValidationUrl] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!tenant) return;
    setIsGenerating(true);
    try {
      if (session) {
        const res = await api.sendWhatsAppValidation(session.id, tenant.id);
        setValidationUrl(res.validationUrl);
        setMessageText(res.message);
      } else if (patient) {
        const msg = `Olá ${patient.name}! Desejamos um excelente dia e esperamos você na sua próxima sessão na ${tenant.name}.`;
        setMessageText(msg);
      }
    } catch (err) {
      console.error('Erro ao gerar validação WhatsApp:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, session, patient]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageText || validationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsAppWeb = () => {
    const encoded = encodeURIComponent(messageText);
    const targetPhone = patient?.phone || patient?.whatsapp || '';
    const phoneClean = targetPhone ? '55' + targetPhone.replace(/\D/g, '') : '';
    const url = phoneClean 
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const targetName = session?.patientName || patient?.name || 'Cliente';
  const subtitle = session 
    ? `Sessão #${session.sessionNumber} • ${targetName}`
    : `Mensagem para ${targetName}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Validação e Mensagem via WhatsApp"
      subtitle={subtitle}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* API Integration Status Badge */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Status da WhatsApp Business API:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
              tenant?.whatsappConfig.status === 'CONFIGURED'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {tenant?.whatsappConfig.status === 'CONFIGURED'
              ? 'CONFIGURADO & ATIVO'
              : 'Integração não configurada (Modo Simulação)'}
          </span>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Prévia da Mensagem Formatada
          </label>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-slate-850 border border-emerald-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
            {isGenerating ? 'Gerando token criptográfico de uso único...' : messageText}
          </div>
        </div>

        {/* Security Note */}
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
          <span>
            O link gerado contém um token de uso único. O cliente poderá abrir o link no smartphone, conferir o pacote e assinar a confirmação sem precisar criar conta.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={copyToClipboard}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Mensagem'}
          </button>

          <button
            type="button"
            onClick={openWhatsAppWeb}
            disabled={!messageText}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Abrir no WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
};
