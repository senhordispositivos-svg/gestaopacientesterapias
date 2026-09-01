import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CPFInput } from '../common/CPFInput';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { Patient, User } from '../../types';
import { formatPhone, formatCEP, validateCPF } from '../../utils/cpf';
import { useAuth } from '../../context/AuthContext';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Partial<Patient>) => Promise<void>;
  patientToEdit?: Patient | null;
  professionals?: User[];
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patientToEdit,
  professionals = [],
}) => {
  const { tenant } = useAuth();
  const safeProfessionals = professionals || [];
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Outro' | string>('Feminino');
  const [email, setEmail] = useState('');
  const [isCpfValid, setIsCpfValid] = useState(false);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profession, setProfession] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [referencePoint, setReferencePoint] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedProfessionalId, setAssignedProfessionalId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setErrorMessage('');
    setFormErrors({});
    if (patientToEdit) {
      setName(patientToEdit.name || '');
      setPhotoUrl(patientToEdit.photoUrl || patientToEdit.avatarUrl || '');
      setCpf(patientToEdit.cpf || '');
      setRg(patientToEdit.rg || '');
      setGender(patientToEdit.gender || 'Feminino');
      setEmail(patientToEdit.email || '');
      setIsCpfValid(validateCPF(patientToEdit.cpf || ''));
      setPhone(patientToEdit.phone || '');
      setWhatsapp(patientToEdit.whatsapp || '');
      setProfession(patientToEdit.profession || '');
      setBirthDate(patientToEdit.birthDate || '');
      setCep(patientToEdit.cep || '');
      setStreet(patientToEdit.street || '');
      setNumber(patientToEdit.number || '');
      setComplement(patientToEdit.complement || '');
      setNeighborhood(patientToEdit.neighborhood || '');
      setCity(patientToEdit.city || '');
      setState(patientToEdit.state || '');
      setReferencePoint(patientToEdit.referencePoint || '');
      setNotes(patientToEdit.notes || '');
      setAssignedProfessionalId(patientToEdit.assignedProfessionalId || '');
    } else {
      setName('');
      setPhotoUrl('');
      setCpf('');
      setRg('');
      setGender('Feminino');
      setEmail('');
      setIsCpfValid(false);
      setPhone('');
      setWhatsapp('');
      setProfession('');
      setBirthDate('');
      setCep('');
      setStreet('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity(tenant?.city || '');
      setState(tenant?.state || '');
      setReferencePoint('');
      setNotes('');
      setAssignedProfessionalId(safeProfessionals[0]?.id || '');
    }
  }, [patientToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'O campo "Nome Completo" é obrigatório.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'O campo "Telefone" é obrigatório.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setErrorMessage('Por favor, preencha todos os campos obrigatórios assinalados abaixo com asterisco (*).');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const selectedProf = safeProfessionals.find(p => p.id === assignedProfessionalId);
      await onSave({
        name: name.trim(),
        photoUrl: photoUrl || undefined,
        avatarUrl: photoUrl || undefined,
        cpf: cpf.trim(),
        rg: rg.trim(),
        gender: gender || 'Feminino',
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: (whatsapp || phone).trim(),
        profession: profession.trim(),
        birthDate: birthDate || '',
        cep: cep.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim() || 'São Paulo',
        state: state.trim() || 'SP',
        referencePoint: referencePoint.trim(),
        notes: notes.trim(),
        assignedProfessionalId: assignedProfessionalId || '',
        assignedProfessionalName: selectedProf ? selectedProf.name : 'Geral',
      });
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar paciente:', err);
      if (err instanceof Error) {
        setErrorMessage(err.message || 'Erro ao salvar paciente no banco de dados. Tente novamente.');
      } else {
        setErrorMessage('Erro ao salvar paciente no banco de dados. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patientToEdit ? 'Editar Dados do Paciente' : 'Cadastrar Novo Paciente'}
      subtitle="Insira as informações completas para o prontuário clínico e anamnese"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Foto de Perfil */}
        <div>
          <ImageUploadInput
            label="Foto do(a) Paciente (Opcional)"
            value={photoUrl}
            onChange={setPhotoUrl}
            fallbackInitials={name || 'P'}
            helperText="Adicionar foto facilita a identificação no prontuário e ficha de anamnese."
          />
        </div>

        {/* Section 1: Dados Pessoais */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Dados Pessoais & Identificação
            </h4>
            <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40">
              * Campos com asterisco são obrigatórios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>
                  Nome Completo <span className="text-rose-500 font-bold">*</span>
                </span>
                {formErrors.name && (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {formErrors.name}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (formErrors.name) {
                    setFormErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                placeholder="Ex: Maria Clara Silva"
                className={`w-full mt-1 px-3.5 py-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-slate-100 transition ${
                  formErrors.name
                    ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-600'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-teal-500/20 focus:border-teal-600'
                }`}
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  ⚠️ Preenchimento obrigatório: informe o nome completo do paciente.
                </p>
              )}
            </div>

            <div>
              <CPFInput
                value={cpf}
                required={false}
                onChange={(fmt, valid) => {
                  setCpf(fmt);
                  setIsCpfValid(valid);
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                RG (Documento de Identidade)
              </label>
              <input
                type="text"
                value={rg}
                onChange={e => setRg(e.target.value)}
                placeholder="Ex: 12.345.678-9"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gênero
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>
                  Telefone <span className="text-rose-500 font-bold">*</span>
                </span>
                {formErrors.phone && (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {formErrors.phone}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => {
                  setPhone(formatPhone(e.target.value));
                  if (formErrors.phone) {
                    setFormErrors(prev => ({ ...prev, phone: '' }));
                  }
                }}
                placeholder="(00) 00000-0000"
                className={`w-full mt-1 px-3.5 py-2.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 dark:text-slate-100 transition ${
                  formErrors.phone
                    ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-600'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-teal-500/20 focus:border-teal-600'
                }`}
              />
              {formErrors.phone && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  ⚠️ Preenchimento obrigatório: informe o número de telefone de contato.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                WhatsApp para Notificações
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="paciente@exemplo.com"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Profissão</label>
              <input
                type="text"
                value={profession}
                onChange={e => setProfession(e.target.value)}
                placeholder="Ex: Designer, Advogado(a)"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Profissional Responsável
              </label>
              <select
                value={assignedProfessionalId}
                onChange={e => setAssignedProfessionalId(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Nenhum específico (Acesso Geral)</option>
                {safeProfessionals.map(p => (
                  <option key={p.id} value={p.id} disabled={p.active === false}>
                    {p.name} {p.specialty ? `(${p.specialty})` : ''} {p.active === false ? '❌ [INATIVO]' : '✅ [ATIVO]'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Endereço */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            2. Endereço Completo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={e => setCep(formatCEP(e.target.value))}
                placeholder="00000-000"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rua / Avenida</label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="Ex: Rua das Flores"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Número</label>
              <input
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="Ex: 123"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={e => setComplement(e.target.value)}
                placeholder="Apto 42, Bloco B"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="Ex: Centro"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estado (UF)</label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="SP"
                maxLength={2}
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100 uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ponto de Referência</label>
              <input
                type="text"
                value={referencePoint}
                onChange={e => setReferencePoint(e.target.value)}
                placeholder="Próximo à estação..."
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Observações */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Observações Gerais do Paciente
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Informações adicionais relevantes, queixas iniciais ou preferências..."
            className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white dark:bg-slate-900 dark:text-slate-100 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando no Banco...
              </>
            ) : (
              'Salvar Paciente'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
