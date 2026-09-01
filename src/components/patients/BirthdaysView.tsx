import React, { useState } from 'react';
import { Patient } from '../../types';
import { calculateAge, formatDate } from '../../utils/crypto';
import {
  Cake,
  Gift,
  Send,
  Calendar,
  Sparkles,
  Search,
  MessageSquare,
  Check,
  Copy,
  PartyPopper,
  Bell,
  Heart,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface BirthdaysViewProps {
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  onSendWhatsApp?: (patient: Patient) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const BirthdaysView: React.FC<BirthdaysViewProps> = ({
  patients,
  onSelectPatient,
}) => {
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0-11
  const currentDay = now.getDate();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [filterMode, setFilterMode] = useState<'MONTH' | 'TODAY' | 'NEXT_7_DAYS'>('MONTH');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Patient for WhatsApp Motivational Message Modal
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);

  // Parse patient birthdate to get day and month
  const getPatientBirthdayInfo = (pat: Patient) => {
    if (!pat.birthDate) return { day: 0, month: -1, age: 0, isToday: false, isTomorrow: false, daysUntil: 999 };

    const parts = pat.birthDate.split('-');
    if (parts.length !== 3) return { day: 0, month: -1, age: 0, isToday: false, isTomorrow: false, daysUntil: 999 };

    const bYear = parseInt(parts[0], 10);
    const bMonth = parseInt(parts[1], 10) - 1; // 0-indexed
    const bDay = parseInt(parts[2], 10);

    const age = calculateAge(pat.birthDate);

    // Calculate days until next birthday
    const thisYearBday = new Date(now.getFullYear(), bMonth, bDay);
    if (thisYearBday < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      thisYearBday.setFullYear(now.getFullYear() + 1);
    }

    const diffTime = thisYearBday.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isToday = bMonth === currentMonthIdx && bDay === currentDay;
    const isTomorrow = bMonth === currentMonthIdx && bDay === currentDay + 1;

    return { day: bDay, month: bMonth, age, isToday, isTomorrow, daysUntil };
  };

  // Patients who have birthdays today or tomorrow across all patients
  const patientsBirthdayToday = patients.filter(p => {
    const info = getPatientBirthdayInfo(p);
    return info.isToday;
  });

  const patientsBirthdayNext7Days = patients.filter(p => {
    const info = getPatientBirthdayInfo(p);
    return info.daysUntil >= 0 && info.daysUntil <= 7;
  });

  // Filtered List based on selectedMonth and filterMode
  const filteredPatients = patients
    .map(p => ({ patient: p, ...getPatientBirthdayInfo(p) }))
    .filter(item => {
      if (item.month === -1) return false;

      if (searchTerm) {
        const matchName = item.patient.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCpf = item.patient.cpf.includes(searchTerm);
        if (!matchName && !matchCpf) return false;
      }

      if (filterMode === 'TODAY') {
        return item.isToday;
      }

      if (filterMode === 'NEXT_7_DAYS') {
        return item.daysUntil >= 0 && item.daysUntil <= 7;
      }

      // Default: Month
      return item.month === selectedMonth;
    })
    .sort((a, b) => a.day - b.day);

  // Motivational templates generator
  const getMotivationalTemplates = (pat: Patient) => {
    const firstName = pat.name.split(' ')[0];
    const info = getPatientBirthdayInfo(pat);
    const ageText = info.age > 0 ? `pelos seus ${info.age} anos` : '';

    return [
      {
        id: 'saude',
        title: '🌟 Saúde & Bem-Estar',
        text: `Olá, ${firstName}! 🎉\n\nEm nome de toda a nossa equipe de Fisioterapia e Massoterapia, desejamos a você um Feliz Aniversário ${ageText}! 🎂✨\n\nQue este novo ciclo traga ainda mais saúde, vitalidade, equilíbrio do corpo e da mente, e momentos inesquecíveis de paz. É uma honra podermos cuidar do seu bem-estar!\n\nAproveite muito o seu dia especial com carinho e renovação! 💆‍♀️🌿`,
      },
      {
        id: 'superacao',
        title: '💪 Força & Inspiração',
        text: `Parabéns pelo seu aniversário, ${firstName}! 🎈✨\n\nQue seu novo ano de vida seja marcado por conquistas extraordinárias, leveza na caminhada, força para superar desafios e muita disposição para viver com plenitude!\n\nConte sempre conosco para manter sua saúde e energia no nível mais alto. Um forte abraço de toda a clínica! 🌸`,
      },
      {
        id: 'gratidao',
        title: '✨ Gratidão & Luz',
        text: `Hoje o dia é todo seu, ${firstName}! 🎉🥳\n\nQue alegria celebrar o seu aniversário! Agradecemos muito a sua confiança em nosso trabalho. Desejamos que seu caminho seja repleto de luz, prosperidade, saúde de ferro e infinitos motivos para sorrir.\n\nFeliz Aniversário! 🎂❤️`,
      },
    ];
  };

  const handleOpenModal = (pat: Patient) => {
    setModalPatient(pat);
    setSelectedTemplateIndex(0);
    const templates = getMotivationalTemplates(pat);
    setCustomMessage(templates[0].text);
    setCopiedText(false);
  };

  const handleSelectTemplate = (index: number) => {
    setSelectedTemplateIndex(index);
    if (modalPatient) {
      const templates = getMotivationalTemplates(modalPatient);
      setCustomMessage(templates[index].text);
    }
  };

  const handleSendWhatsApp = () => {
    if (!modalPatient) return;
    const cleanPhone = modalPatient.whatsapp?.replace(/\D/g, '') || modalPatient.phone?.replace(/\D/g, '');
    const encoded = encodeURIComponent(customMessage);
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
              <PartyPopper className="w-4 h-4 text-amber-200" /> Relacionamento & Fidelização de Pacientes
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Aniversariantes do Mês
            </h2>
            <p className="text-xs sm:text-sm text-pink-100 max-w-2xl font-medium">
              Acompanhe as datas comemorativas dos seus pacientes, receba lembretes automáticos e envie mensagens motivacionais personalizadas diretamente pelo WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
              🎂
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-pink-200 tracking-wider">
                Total no Mês de {MONTH_NAMES[selectedMonth]}
              </p>
              <p className="text-2xl font-black text-white">
                {filteredPatients.length}{' '}
                <span className="text-xs font-medium text-pink-100">pacientes</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Birthday Notification Banner Alert if Birthdays Today */}
      {patientsBirthdayToday.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              🎉
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 animate-pulse" /> Notificação de Aniversário Hoje!
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Você tem <strong>{patientsBirthdayToday.length} paciente(s)</strong> fazendo aniversário hoje! Envie uma mensagem motivacional e fortaleça o vínculo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {patientsBirthdayToday.map(pat => (
              <button
                key={pat.id}
                type="button"
                onClick={() => handleOpenModal(pat)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" /> Parabenizar {pat.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Month Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Mês de Referência:
          </span>
          <select
            value={selectedMonth}
            onChange={e => {
              setSelectedMonth(parseInt(e.target.value, 10));
              setFilterMode('MONTH');
            }}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx}>
                {m} {idx === currentMonthIdx ? '(Mês Atual)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterMode('MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterMode === 'MONTH'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todas do Mês ({patients.filter(p => getPatientBirthdayInfo(p).month === selectedMonth).length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              filterMode === 'TODAY'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            🎉 Aniversário Hoje ({patientsBirthdayToday.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('NEXT_7_DAYS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              filterMode === 'NEXT_7_DAYS'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40'
            }`}
          >
            📅 Próximos 7 Dias ({patientsBirthdayNext7Days.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Birthday Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-3xl mx-auto">
            🎂
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            Nenhum aniversariante encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Não há registros de aniversariantes para o filtro selecionado no mês de {MONTH_NAMES[selectedMonth]}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(({ patient, day, month, age, isToday, isTomorrow, daysUntil }) => {
            const dateStr = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}`;

            return (
              <div
                key={patient.id}
                className={`p-5 rounded-3xl border transition-all duration-200 shadow-2xs relative overflow-hidden flex flex-col justify-between ${
                  isToday
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/40'
                    : isTomorrow
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1 ${
                        isToday
                          ? 'bg-amber-500 text-white animate-pulse'
                          : isTomorrow
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Cake className="w-3.5 h-3.5" /> Dia {dateStr}
                    </span>

                    {age > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold">
                        {age} anos
                      </span>
                    )}
                  </div>

                  {isToday ? (
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> É Hoje!
                    </span>
                  ) : isTomorrow ? (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      Amanhã
                    </span>
                  ) : daysUntil > 0 && daysUntil <= 30 ? (
                    <span className="text-[11px] font-bold text-slate-500">
                      Em {daysUntil} dia(s)
                    </span>
                  ) : null}
                </div>

                {/* Patient Information Body */}
                <div className="space-y-2 mb-4">
                  <h4
                    onClick={() => onSelectPatient && onSelectPatient(patient)}
                    className="font-extrabold text-slate-900 dark:text-white text-base hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                  >
                    {patient.name}
                  </h4>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                    <p>
                      <strong>Telefone/WhatsApp:</strong> {patient.whatsapp || patient.phone || 'Não informado'}
                    </p>
                    {patient.profession && (
                      <p>
                        <strong>Profissão:</strong> {patient.profession}
                      </p>
                    )}
                    {patient.assignedProfessionalName && (
                      <p className="text-teal-700 dark:text-teal-400 font-semibold">
                        Profissional Responsável: {patient.assignedProfessionalName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPatient && onSelectPatient(patient)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Ver Prontuário
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenModal(patient)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar Parabéns
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motivational Birthday WhatsApp Sender Modal */}
      {modalPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                  🎁
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Enviar Mensagem Motivacional de Aniversário
                  </h3>
                  <p className="text-xs text-pink-100 font-medium">
                    Paciente: <strong className="text-white">{modalPatient.name}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalPatient(null)}
                className="text-white/80 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Template Selectors */}
              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">
                  Escolha um Modelo de Texto Motivacional:
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {getMotivationalTemplates(modalPatient).map((tpl, idx) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(idx)}
                      className={`p-2.5 rounded-2xl border text-left font-bold transition ${
                        selectedTemplateIndex === idx
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <p className="text-[11px] leading-tight">{tpl.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Text Area */}
              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Sua Mensagem Personalizada (pode ser editada):
                </label>
                <textarea
                  rows={6}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Recipient Phone Info */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                    Destinatário no WhatsApp
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {modalPatient.name} ({modalPatient.whatsapp || modalPatient.phone})
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedText ? 'Copiado!' : 'Copiar Texto'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalPatient(null)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2 shadow-md transition"
                >
                  <Send className="w-4 h-4" /> Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
