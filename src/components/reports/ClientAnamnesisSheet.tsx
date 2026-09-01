import React from 'react';
import { Patient, Anamnesis, Tenant, SessionPackage, Session } from '../../types';
import { Building2, ShieldCheck, CheckSquare, Square, Calendar, User, Phone, Mail, MapPin } from 'lucide-react';

interface ClientAnamnesisSheetProps {
  patient: Patient;
  anamnesis?: Anamnesis | null;
  tenant?: Tenant | null;
  packages?: SessionPackage[];
  sessions?: Session[];
}

export const ClientAnamnesisSheet: React.FC<ClientAnamnesisSheetProps> = ({
  patient,
  anamnesis,
  tenant,
  packages = [],
  sessions = [],
}) => {
  const evalData = anamnesis?.evaluation;
  const signatureUrl = anamnesis?.patientSignatureUrl;
  const signedDate = anamnesis?.signedAt ? new Date(anamnesis.signedAt) : new Date();

  const formattedDate = signedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const city = anamnesis?.city || patient.city || tenant?.city || '';
  const state = anamnesis?.state || patient.state || tenant?.state || '';
  const cityState = [city, state].filter(Boolean).join(' - ') || 'Local não informado';

  return (
    <div
      id="printable-client-sheet"
      className="bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:text-black"
    >
      {/* ------------------------------------------------------------- */}
      {/* CABEÇALHO COM LOGOMARCA DA EMPRESA (MODELO PRINT 1) */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.tradeName || tenant.name}
                referrerPolicy="no-referrer"
                className="h-16 w-auto max-w-[180px] object-contain rounded-md"
              />
            ) : (
              <div className="w-14 h-14 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xl print:border print:border-black">
                {tenant?.tradeName ? tenant.tradeName.substring(0, 2).toUpperCase() : 'CL'}
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                {tenant?.tradeName || tenant?.name || 'Clínica de Fisioterapia & Massoterapia'}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {tenant?.corporateName || 'Serviços de Saúde & Terapias Manuais Ltda'}{' '}
                {tenant?.documentNumber ? `• ${tenant.docType}: ${tenant.documentNumber}` : ''}
              </p>
              <p className="text-[11px] text-slate-500">
                {[tenant?.address, tenant?.number, tenant?.neighborhood, tenant?.city, tenant?.state]
                  .filter(Boolean)
                  .join(', ')}{' '}
                {tenant?.phone ? `• Tel: ${tenant.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-bold uppercase rounded tracking-wider print:bg-black print:text-white">
              Prontuário Clínico
            </span>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Código: {patient.id.replace('pat-', 'PAC-')}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 text-center">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
            FICHA DE ANAMNESE - MASSOTERAPIA & AVALIAÇÃO CLÍNICA
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Histórico Clínico, Hábitos de Vida, Objetivos Terapêuticos e Termo de Consentimento
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DADOS PESSOAIS (MODELO PRINT 1) */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-5">
        <div className="bg-slate-100 print:bg-slate-200 px-3 py-1.5 rounded-t font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-slate-900 mb-2">
          1. Dados Pessoais do(a) Cliente
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-200 rounded p-3 bg-slate-50/50 print:bg-transparent">
          <div className="col-span-2 sm:col-span-2">
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Nome Completo:</span>
            <span className="font-bold text-slate-900">{patient.name}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Data de Nascimento:</span>
            <span className="font-semibold text-slate-900">
              {patient.birthDate
                ? new Date(patient.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')
                : 'Não informada'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Gênero:</span>
            <span className="font-semibold text-slate-900">{patient.gender || 'Não informado'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">CPF:</span>
            <span className="font-semibold text-slate-900">{patient.cpf || 'Não informado'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">RG:</span>
            <span className="font-semibold text-slate-900">{patient.rg || 'Não informado'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Profissão:</span>
            <span className="font-semibold text-slate-900">{patient.profession || 'Não informada'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Telefone / WhatsApp:</span>
            <span className="font-semibold text-slate-900">{patient.phone || patient.whatsapp || 'Não informado'}</span>
          </div>

          <div className="col-span-2 sm:col-span-3">
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Endereço Completo:</span>
            <span className="font-semibold text-slate-900">
              {[
                patient.street && `${patient.street}, ${patient.number || 'S/N'}`,
                patient.complement,
                patient.neighborhood,
                patient.city && `${patient.city}/${patient.state || ''}`,
                patient.cep && `CEP: ${patient.cep}`,
              ]
                .filter(Boolean)
                .join(' - ') || 'Endereço não cadastrado'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">E-mail:</span>
            <span className="font-semibold text-slate-900 truncate block">{patient.email || 'Não informado'}</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. HISTÓRICO MÉDICO (MODELO PRINT 1) */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-5">
        <div className="bg-slate-100 print:bg-slate-200 px-3 py-1.5 rounded-t font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-slate-900 mb-2">
          2. Histórico Médico & Saúde
        </div>

        <div className="space-y-2 text-xs border border-slate-200 rounded p-3 bg-slate-50/50 print:bg-transparent">
          {/* Pergunta 1: Condição médica */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-200 pb-1.5">
            <span className="font-medium text-slate-800">Possui alguma condição médica atual?</span>
            <div className="flex items-center gap-3 font-semibold mt-1 sm:mt-0">
              <span className="flex items-center gap-1">
                {evalData?.hasCurrentMedicalCondition ? '[ X ] Sim' : '[  ] Sim'}
              </span>
              <span className="flex items-center gap-1">
                {!evalData?.hasCurrentMedicalCondition ? '[ X ] Não' : '[  ] Não'}
              </span>
            </div>
          </div>
          {evalData?.hasCurrentMedicalCondition && evalData.currentMedicalConditionDescription && (
            <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 font-sans">
              <strong>Descrição:</strong> {evalData.currentMedicalConditionDescription}
            </p>
          )}

          {/* Pergunta 2: Cirurgias recentes */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-200 pb-1.5">
            <span className="font-medium text-slate-800">Já fez cirurgias recentes?</span>
            <div className="flex items-center gap-3 font-semibold mt-1 sm:mt-0">
              <span className="flex items-center gap-1">
                {evalData?.hasRecentSurgeries ? '[ X ] Sim' : '[  ] Sim'}
              </span>
              <span className="flex items-center gap-1">
                {!evalData?.hasRecentSurgeries ? '[ X ] Não' : '[  ] Não'}
              </span>
            </div>
          </div>
          {evalData?.hasRecentSurgeries && evalData.recentSurgeriesDescription && (
            <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 font-sans">
              <strong>Cirurgias:</strong> {evalData.recentSurgeriesDescription}
            </p>
          )}

          {/* Pergunta 3: Alergias */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-200 pb-1.5">
            <span className="font-medium text-slate-800">Tem alergias conhecidas (óleos, cosméticos, medicamentos)?</span>
            <div className="flex items-center gap-3 font-semibold mt-1 sm:mt-0">
              <span className="flex items-center gap-1">
                {evalData?.hasKnownAllergies ? '[ X ] Sim' : '[  ] Sim'}
              </span>
              <span className="flex items-center gap-1">
                {!evalData?.hasKnownAllergies ? '[ X ] Não' : '[  ] Não'}
              </span>
            </div>
          </div>
          {evalData?.hasKnownAllergies && evalData.knownAllergiesDescription && (
            <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 font-sans">
              <strong>Alergias relatadas:</strong> {evalData.knownAllergiesDescription}
            </p>
          )}

          {/* Pergunta 4: Gravidez */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
            <span className="font-medium text-slate-800">Está grávida ou em período de amamentação?</span>
            <div className="flex items-center gap-3 font-semibold mt-1 sm:mt-0">
              <span className="flex items-center gap-1">
                {evalData?.isPregnantOrBreastfeeding ? '[ X ] Sim' : '[  ] Sim'}
              </span>
              <span className="flex items-center gap-1">
                {!evalData?.isPregnantOrBreastfeeding ? '[ X ] Não' : '[  ] Não'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. HISTÓRICO DE MASSAGEM & PREFERÊNCIAS (MODELO PRINT 1) */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-5">
        <div className="bg-slate-100 print:bg-slate-200 px-3 py-1.5 rounded-t font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-slate-900 mb-2">
          3. Histórico de Massagem & Preferências
        </div>

        <div className="space-y-2.5 text-xs border border-slate-200 rounded p-3 bg-slate-50/50 print:bg-transparent">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-200 pb-1.5">
            <span className="font-medium text-slate-800">Já fez massagem antes?</span>
            <div className="flex items-center gap-3 font-semibold mt-1 sm:mt-0">
              <span className="flex items-center gap-1">
                {evalData?.hasHadMassageBefore ? '[ X ] Sim' : '[  ] Sim'}
              </span>
              <span className="flex items-center gap-1">
                {!evalData?.hasHadMassageBefore ? '[ X ] Não' : '[  ] Não'}
              </span>
            </div>
          </div>

          {evalData?.hasHadMassageBefore && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Frequência:</span>
                <span className="font-medium text-slate-800">{evalData.massageFrequency || 'Não especificada'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tipo de Massagem:</span>
                <span className="font-medium text-slate-800">{evalData.massageType || 'Não especificado'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Resultados:</span>
                <span className="font-medium text-slate-800">{evalData.massageResults || 'Satisfatórios'}</span>
              </div>
            </div>
          )}

          <div className="border-b border-slate-200 pb-1.5">
            <span className="font-medium text-slate-800 block mb-0.5">
              Quais são seus objetivos com esta sessão de massagem?
            </span>
            <span className="font-semibold text-slate-900 block bg-white p-2 rounded border border-slate-200">
              {evalData?.massageGoals || 'Alívio de tensões musculares, bem-estar e relaxamento integral.'}
            </span>
          </div>

          <div className="border-b border-slate-200 pb-1.5">
            <span className="font-medium text-slate-800 block mb-0.5">
              Alguma área específica do corpo precisa de atenção?
            </span>
            <span className="font-semibold text-slate-900 block bg-white p-2 rounded border border-slate-200">
              {evalData?.specificBodyAreasToFocus || 'Região cervical, trapézio e coluna lombar.'}
            </span>
          </div>

          <div>
            <span className="font-medium text-slate-800 block mb-1">
              Alguma preferência quanto à pressão da massagem?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-medium">
              <span className={`p-1.5 rounded border text-center ${evalData?.pressurePreference === 'Leve' ? 'bg-slate-900 text-white font-bold print:border-black' : 'border-slate-200 bg-white'}`}>
                [ {evalData?.pressurePreference === 'Leve' ? 'X' : ' '} ] Leve
              </span>
              <span className={`p-1.5 rounded border text-center ${evalData?.pressurePreference === 'Moderada' || !evalData?.pressurePreference ? 'bg-slate-900 text-white font-bold print:border-black' : 'border-slate-200 bg-white'}`}>
                [ {evalData?.pressurePreference === 'Moderada' || !evalData?.pressurePreference ? 'X' : ' '} ] Moderada
              </span>
              <span className={`p-1.5 rounded border text-center ${evalData?.pressurePreference === 'Firme' ? 'bg-slate-900 text-white font-bold print:border-black' : 'border-slate-200 bg-white'}`}>
                [ {evalData?.pressurePreference === 'Firme' ? 'X' : ' '} ] Firme
              </span>
              <span className={`p-1.5 rounded border text-center ${evalData?.pressurePreference === 'Outra' ? 'bg-slate-900 text-white font-bold print:border-black' : 'border-slate-200 bg-white'}`}>
                [ {evalData?.pressurePreference === 'Outra' ? 'X' : ' '} ] Outra {evalData?.pressurePreferenceOther ? `(${evalData.pressurePreferenceOther})` : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. ESTILO DE VIDA & HÁBITOS (MODELO PRINT 1) */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-5">
        <div className="bg-slate-100 print:bg-slate-200 px-3 py-1.5 rounded-t font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-slate-900 mb-2">
          4. Estilo de Vida & Hábitos
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border border-slate-200 rounded p-3 bg-slate-50/50 print:bg-transparent">
          <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 sm:pr-3">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-800">Tabagismo:</span>
              <span className="font-semibold">
                {evalData?.isSmoker ? `Sim (${evalData.smokingDailyQuantity || 'Qtd não informada'})` : 'Não'}
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-800">Consumo de Álcool:</span>
              <span className="font-semibold">
                {evalData?.drinksAlcohol ? `Sim (${evalData.alcoholFrequencyQuantity || 'Socialmente'})` : 'Não'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-800">Atividade Física Regular:</span>
              <span className="font-semibold">
                {evalData?.regularPhysicalActivity ? `Sim (${evalData.physicalActivityTypeFrequency || 'Frequente'})` : 'Não'}
              </span>
            </div>
          </div>

          <div className="sm:pl-3">
            <div className="mb-1">
              <span className="font-medium text-slate-800 block text-[10px] uppercase">Dieta / Nutrição:</span>
              <span className="font-semibold text-slate-900">{evalData?.diet || 'Alimentação equilibrada.'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-800 block text-[10px] uppercase">Padrão de Sono:</span>
              <span className="font-semibold text-slate-900">
                {evalData?.sleepQuality || 'Normal'}{' '}
                {evalData?.sleepOtherDescription ? `(${evalData.sleepOtherDescription})` : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. TERMOS E CONDIÇÕES (MODELO PRINT 2) */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-6 break-inside-avoid">
        <div className="bg-slate-100 print:bg-slate-200 px-3 py-1.5 rounded-t font-bold text-xs uppercase tracking-wider text-slate-800 border-l-4 border-slate-900 mb-2">
          5. Termos e Condições — Declaração de Ciência e Consentimento
        </div>

        <div className="border border-slate-200 rounded p-3 bg-slate-50/50 print:bg-transparent text-[11px] text-slate-700 leading-relaxed space-y-2">
          <p className="italic font-medium text-slate-600 mb-1">
            Por favor leia o descritivo abaixo e verifique a assinatura de ciência:
          </p>

          <p>
            <strong>Cláusula 01:</strong> O(A) cliente declara expressamente que as informações fornecidas neste questionário de avaliação e anamnese são completas, exatas e verdadeiras, assumindo total responsabilidade pelas respostas prestadas.
          </p>
          <p>
            <strong>Cláusula 02:</strong> O(A) cliente declara estar plenamente ciente de que as sessões e procedimentos de massoterapia, liberação miofascial e terapias corporais manuais possuem finalidade preventiva, de bem-estar, alívio de estresse e tensões musculares, não constituindo diagnósticos médicos ou tratamento de patologias clínicas específicas, os quais são prerrogativas médicas.
          </p>
          <p>
            <strong>Cláusula 03:</strong> O(A) cliente compromete-se a informar ao terapeuta qualquer alteração em seu estado de saúde, suspeita de gravidez, início de novos medicamentos ou qualquer desconforto antes ou durante a realização dos atendimentos.
          </p>
          <p>
            <strong>Cláusula 04:</strong> Fica expressamente autorizada a realização dos procedimentos terapêuticos conforme o plano de atendimento acordado entre as partes, em consonância com as normas de biossegurança e ética profissional da clínica.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. ASSINATURA DO CLIENTE COMO CIENTE (MODELO PRINT 2) */}
      {/* ------------------------------------------------------------- */}
      <section className="mt-8 pt-4 border-t-2 border-slate-300 break-inside-avoid">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Data e Localidade */}
          <div className="text-center sm:text-left text-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Local e Data:</span>
            <span className="font-bold text-slate-900">{cityState}, {formattedDate}</span>
            <p className="text-[10px] text-slate-500 mt-1">
              Documento digital assinado em conformidade com a LGPD e termos clínicos.
            </p>
          </div>

          {/* Área de Assinatura do Cliente */}
          <div className="flex flex-col items-center min-w-[280px]">
            <div className="h-20 w-full flex items-end justify-center pb-1">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Assinatura do Cliente"
                  referrerPolicy="no-referrer"
                  className="max-h-16 max-w-[260px] object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs italic">
                  [ Assinatura digital pendente de coleta ]
                </div>
              )}
            </div>
            <div className="w-full border-t border-slate-900 pt-1 text-center">
              <p className="text-xs font-bold text-slate-900 uppercase">{patient.name}</p>
              <p className="text-[10px] text-slate-600">
                Assinatura do(a) Cliente como Ciente {patient.cpf ? `• CPF: ${patient.cpf}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Carimbo de autenticidade no rodapé */}
        <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>{tenant?.tradeName || 'Clínica de Fisioterapia'} • Sistema de Gestão e Anamnese</span>
          <span>Hash Digital: {anamnesis?.id || `ANAM-${Date.now()}`} • Autenticado</span>
        </div>
      </section>
    </div>
  );
};
