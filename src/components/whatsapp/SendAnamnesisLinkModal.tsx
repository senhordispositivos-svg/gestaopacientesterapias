import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Patient, User } from '../../types';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  UserPlus,
  Users,
  ExternalLink,
  Sparkles,
  FileSignature,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { copyToClipboard } from '../../utils/clipboard';

interface SendAnamnesisLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  initialPatient?: Patient | null;
  patients?: Patient[];
  patientsList?: Patient[];
  professionals?: User[];
  professionalsList?: User[];
}

export const SendAnamnesisLinkModal: React.FC<SendAnamnesisLinkModalProps> = ({
  isOpen,
  onClose,
  patient,
  initialPatient,
  patients,
  patientsList,
  professionals,
  professionalsList,
}) => {
  const effectivePatient = patient !== undefined ? patient : initialPatient;
  const effectivePatientsList = patients || patientsList || [];
  const effectiveProfessionalsList = professionals || professionalsList || [];
  const { tenant, user } = useAuth();

  const [mode, setMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [selectedProfId, setSelectedProfId] = useState<string>('');

  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [useShortLink, setUseShortLink] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (effectivePatient) {
        setMode('EXISTING');
        setSelectedPatientId(effectivePatient.id || '');
        setCustomName(effectivePatient.name || '');
        setCustomPhone(effectivePatient.phone || effectivePatient.whatsapp || '');
      } else {
        setMode('NEW');
        setSelectedPatientId('');
        setCustomName('');
        setCustomPhone('');
      }
      setSelectedProfId(user?.id || '');
      setShowQrCode(false);
      setUseShortLink(true);
    }
  }, [isOpen, effectivePatient, user]);

  // Update URL and message when inputs change
  useEffect(() => {
    if (!isOpen) return;

    let targetPatient: Partial<Patient> | null = null;
    if (mode === 'EXISTING') {
      const found = effectivePatientsList.find(p => p.id === selectedPatientId);
      if (found) {
        targetPatient = found;
        setCustomName(found.name);
        setCustomPhone(found.phone || found.whatsapp || '');
      }
    } else {
      if (customName.trim()) {
        targetPatient = {
          name: customName.trim(),
          phone: customPhone.trim(),
          whatsapp: customPhone.trim(),
        };
      }
    }

    const targetProf = effectiveProfessionalsList.find(u => u.id === selectedProfId) || user;

    api.sendAnamnesisWhatsApp(tenant, targetPatient, targetProf, { short: useShortLink }).then(res => {
      setGeneratedUrl(res.validationUrl);
      setMessageText(res.message);
    });
  }, [isOpen, mode, selectedPatientId, customName, customPhone, selectedProfId, tenant, user, effectivePatientsList, effectiveProfessionalsList, useShortLink]);

  const handleCopyLink = async () => {
    if (!generatedUrl) return;
    const ok = await copyToClipboard(generatedUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyMessage = async () => {
    if (!messageText) return;
    const ok = await copyToClipboard(messageText);
    if (ok) {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    const rawPhone = mode === 'EXISTING'
      ? (effectivePatientsList.find(p => p.id === selectedPatientId)?.phone || customPhone)
      : customPhone;
    const cleanPhone = rawPhone ? '55' + rawPhone.replace(/\D/g, '') : '';
    const encoded = encodeURIComponent(messageText);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const qrImageUrl = generatedUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(generatedUrl)}&margin=10`
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Ficha de Cadastro & Anamnese"
      subtitle="Gere um link seguro e exclusivo para o paciente preencher no WhatsApp"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Recipient Mode Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('EXISTING')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'EXISTING'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Paciente Cadastrado
          </button>
          <button
            type="button"
            onClick={() => setMode('NEW')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'NEW'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Novo Paciente / Contato
          </button>
        </div>

        {/* Mode Form Details */}
        {mode === 'EXISTING' ? (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Selecione o Paciente
            </label>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">Selecione um paciente na lista...</option>
              {effectivePatientsList.map(pat => (
                <option key={pat.id} value={pat.id}>
                  {pat.name} {pat.phone ? `• ${pat.phone}` : ''} {pat.cpf ? `• CPF: ${pat.cpf}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome do Paciente / Contato
              </label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Ex: Maria Clara Silva"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                WhatsApp / Celular (Opcional)
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Link Box */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-teal-600" />
                Link de Envio
              </label>
              {useShortLink ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Link Curto Otimizado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Link Completo
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUseShortLink(!useShortLink)}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                title="Alternar entre link encurtado e completo"
              >
                {useShortLink ? 'Ver link completo' : 'Usar link reduzido'}
              </button>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                {showQrCode ? 'Ocultar QR Code' : 'Ver QR Code'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
            <input
              type="text"
              readOnly
              value={generatedUrl}
              className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 font-mono truncate px-2 focus:outline-none"
            />
            {generatedUrl && (
              <a
                href={generatedUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition shrink-0"
                title="Testar e abrir link em nova guia"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white flex items-center gap-1.5 transition shrink-0 shadow-sm notranslate"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">✓ Link reduzido:</span>
            <span>Cabe perfeitamente em 1 linha no WhatsApp, sem códigos extensos.</span>
          </p>
        </div>

        {/* QR Code view if toggled */}
        {showQrCode && generatedUrl && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Escaneie na Recepção com a Câmera do Smartphone
            </p>
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <img src={qrImageUrl} alt="QR Code Ficha Anamnese" className="w-48 h-48 rounded" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              O paciente pode apontar a câmera do celular no balcão da clínica para abrir e assinar a ficha.
            </p>
          </div>
        )}

        {/* WhatsApp Message Preview */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Prévia da Mensagem para o WhatsApp
          </label>
          <textarea
            rows={4}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-slate-850 border border-emerald-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Strict Isolation & Security Notice */}
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 text-[11px] flex items-start gap-2.5 border border-teal-200 dark:border-teal-900/50">
          <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Acesso 100% Seguro e Isolado</p>
            <p className="text-teal-700 dark:text-teal-300">
              O paciente terá acesso <strong>exclusivamente</strong> a esta ficha de cadastro e anamnese. Ele não necessita de login e não poderá visualizar nenhuma outra informação ou prontuário da clínica.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition notranslate"
          >
            {copiedMsg ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mensagem Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 shrink-0" />
                <span>Copiar Mensagem</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!generatedUrl}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Enviar no WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
};
