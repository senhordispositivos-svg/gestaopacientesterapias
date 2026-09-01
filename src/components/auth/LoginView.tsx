import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cookieStorage } from '../../utils/cookies';
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  HeartHandshake,
  UserPlus,
  LogIn,
  Building2,
  Phone,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Cookie,
  KeyRound,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, register } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberCredentials, setRememberCredentials] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved credentials from browser cookies if previously saved
  useEffect(() => {
    try {
      const isRemembered = cookieStorage.get('remember_credentials') === 'true';
      if (isRemembered) {
        const savedEmail = cookieStorage.get('saved_user_email');
        const savedPassword = cookieStorage.get('saved_user_password');
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberCredentials(true);
      }
    } catch (e) {
      console.warn('Erro ao ler cookies do navegador:', e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setInfoNotice(null);

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!password) {
      setError('Por favor, digite a sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);

        // Manage credentials in browser cookies
        if (rememberCredentials) {
          cookieStorage.set('saved_user_email', email.trim(), 30);
          cookieStorage.set('saved_user_password', password, 30);
          cookieStorage.set('remember_credentials', 'true', 30);
        } else {
          cookieStorage.remove('saved_user_email');
          cookieStorage.remove('saved_user_password');
          cookieStorage.remove('remember_credentials');
        }
      } else {
        if (!name.trim()) {
          throw new Error('Informe o seu nome completo.');
        }
        if (!clinicName.trim()) {
          throw new Error('Informe o nome da sua clínica ou consultório.');
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          clinicName: clinicName.trim(),
          phone: phone.trim(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar. Verifique os dados informados.');
    } finally {
      setIsLoading(false);
    }
  };

  // Safe Super User button click - does NOT autofill sensitive credentials
  const handleSuperUserClick = () => {
    setMode('login');
    setError(null);
    setInfoNotice(
      'Acesso Restrito ao Super Usuário: Digite manualmente seu e-mail e senha cadastrados.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <HeartHandshake className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              SISTEMA DE GERENCIAMENTO DE CLIENTE PARA FISIOTERAPIA E MASSOTERAPIA
            </h1>
            <p className="text-[11px] text-teal-400 font-medium">
              Prontuário Eletrônico, Anamnese, Assinatura Digital & Gestão Multi-Clínicas
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-slate-300">
          <span>Criado por:</span>
          <span className="font-semibold text-teal-300">Osaias Brito</span>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          
          {/* Top Panel Status */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">
                {mode === 'login' ? 'Acesso ao Painel' : 'Criar Nova Clínica / Conta'}
              </span>
            </div>

            {/* Super User Badge / Button (No auto-fill for security) */}
            <button
              type="button"
              onClick={handleSuperUserClick}
              title="Acesso de Super Administrador (Requer digitação manual de credenciais)"
              className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold hover:underline cursor-pointer bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/30 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Usuário</span>
            </button>
          </div>

          {/* Toggle Login / Register Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setInfoNotice(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setInfoNotice(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Security Notice */}
          {infoNotice && (
            <div className="mb-5 p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <KeyRound className="w-4 h-4 shrink-0 text-teal-400" />
              <span>{infoNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Seu Nome Completo:
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dr. Carlos Silva"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                {/* Clinic Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome da Sua Clínica ou Espaço:
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Clínica Equilíbrio & Bem-Estar"
                      value={clinicName}
                      onChange={e => setClinicName(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    WhatsApp / Telefone:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Usuário / E-mail de Acesso:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu-email@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha de Acesso:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Remember Credentials via Cookies Checkbox */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberCredentials}
                    onChange={e => setRememberCredentials(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500/30 focus:ring-2 accent-teal-500 cursor-pointer"
                  />
                  <span className="group-hover:text-white transition flex items-center gap-1.5">
                    <Cookie className="w-3.5 h-3.5 text-teal-400/80" />
                    Lembrar dados (Cookies do Navegador)
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Entrar no Sistema' : 'Cadastrar e Acessar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick hint */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              {mode === 'login' ? (
                <span>
                  Não tem uma conta ainda?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setInfoNotice(null);
                    }}
                    className="text-teal-400 hover:underline font-semibold"
                  >
                    Criar nova clínica
                  </button>
                </span>
              ) : (
                <span>
                  Já possui cadastro?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setInfoNotice(null);
                    }}
                    className="text-teal-400 hover:underline font-semibold"
                  >
                    Fazer login
                  </button>
                </span>
              )}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 z-10 gap-2">
        <span>SISTEMA DE GERENCIAMENTO DE CLIENTE PARA FISIOTERAPIA E MASSOTERAPIA</span>
        <span>Desenvolvido por <strong className="text-slate-300 font-semibold">Osaias Brito</strong></span>
      </footer>
    </div>
  );
};
