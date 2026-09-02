import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Session, Patient } from '../../types';
import {
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  FileSignature,
  Calendar,
  Sparkles,
  QrCode,
} from 'lucide-react';
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
  const { tenant, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'SESSION' | 'ANAMNESIS' | 'CUSTOM'>('SESSION');
  const [validationUrl, setValidationUrl] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (session) {
        setActiveTab('SESSION');
      } else {
        setActiveTab('ANAMNESIS');
      }
      setShowQr(false);
    }
  }, [isOpen, session]);

  const handleGenerate = async () => {
    if (!tenant) return;
    setIsGenerating(true);
    try {
      if (activeTab === 'SESSION' && session) {
        const res = await api.sendWhatsAppValidation(session.id, tenant.id);
        setValidationUrl(res.validationUrl);
        setMessageText(res.message);
      } else if (activeTab === 'ANAMNESIS') {
        const res = await api.sendAnamnesisWhatsApp(tenant, patient, user);
        setValidationUrl(res.validationUrl);
        setMessageText(res.message);
      } else if (activeTab === 'CUSTOM' || (!session && activeTab === 'SESSION')) {
        const pName = patient?.name || 'Cliente';
        const msg = `Olá ${pName}! Passando para desejar um ótimo dia da equipe da ${tenant.tradeName || tenant.name}. Caso precise reagendar ou tirar dúvidas, estamos à disposição!`;
        setValidationUrl('');
        setMessageText(msg);
      }
    } catch (err) {
      console.error('Erro ao gerar mensagem WhatsApp:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, activeTab, session, patient, tenant, user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrlOnly = () => {
    if (!validationUrl) return;
    navigator.clipboard.writeText(validationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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

  const qrImageUrl = validationUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validationUrl)}&margin=10`
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comunicação & Validação via WhatsApp"
      subtitle={subtitle}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {session && (
            <button
              type="button"
              onClick={() => setActiveTab('SESSION')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'SESSION'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Sessão #{session.sessionNumber}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('ANAMNESIS')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ANAMNESIS'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            Ficha de Cadastro & Anamnese
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CUSTOM')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'CUSTOM'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Lembrete Geral
          </button>
        </div>

        {/* Validation URL Box if available */}
        {validationUrl && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileSignature className="w-3.5 h-3.5 text-teal-600" />
                Link Direto para o Paciente
              </span>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <QrCode className="w-3 h-3" />
                {showQr ? 'Ocultar QR' : 'Exibir QR'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={validationUrl}
                className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-400 font-mono truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={copyUrlOnly}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-100 shrink-0 shadow-sm"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedUrl ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            {showQr && (
              <div className="pt-2 flex flex-col items-center">
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <img src={qrImageUrl} alt="QR Code" className="w-36 h-36 rounded" />
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Escaneie com a câmera do celular</span>
              </div>
            )}
          </div>
        )}

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Prévia da Mensagem Formatada
          </label>
          <textarea
            rows={4}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-slate-850 border border-emerald-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Security Note */}
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
          <span>
            {activeTab === 'ANAMNESIS'
              ? 'O paciente terá acesso estritamente a este formulário de cadastro, garantindo total privacidade e segurança sem visualização de outros dados da clínica.'
              : 'O link gerado contém token de uso único criptografado, permitindo confirmação rápida e segura.'}
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
            disabled={!messageText || isGenerating}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Enviar no WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
};
