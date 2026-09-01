import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { validateCPF, formatCPF } from '../../utils/cpf';

interface CPFInputProps {
  value: string;
  onChange: (formattedValue: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export const CPFInput: React.FC<CPFInputProps> = ({
  value,
  onChange,
  label = 'CPF',
  required = true,
  disabled = false,
  id = 'cpf-input',
}) => {
  const formatted = formatCPF(value);
  const isValid = validateCPF(formatted);
  const showFeedback = formatted.length >= 14;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const fmt = formatCPF(rawVal);
    const valid = validateCPF(fmt);
    onChange(fmt, valid);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {showFeedback && (
            <span className={`text-[11px] font-bold flex items-center gap-1 ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> CPF Válido
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" /> CPF Inválido
                </>
              )}
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          value={formatted}
          onChange={handleChange}
          placeholder="000.000.000-00"
          maxLength={14}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 ${
            showFeedback
              ? isValid
                ? 'border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-rose-500 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10'
              : 'border-slate-300 dark:border-slate-700 focus:border-teal-600 focus:ring-teal-600/20 bg-white dark:bg-slate-900'
          } dark:text-slate-100 disabled:opacity-50`}
        />
      </div>
    </div>
  );
};
