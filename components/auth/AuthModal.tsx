'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  Building,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccountType } from '@/types';

const ADMIN_EMAIL = 'igorwebdesign86@gmail.com';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('proprietario');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await signInWithGoogle();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao autenticar com o Google. Tente novamente ou use e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (mode === 'signup' && !acceptTerms) {
      setErrorMsg('É necessário aceitar os Termos de Uso e Política de Privacidade para cadastrar.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onClose();
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('Por favor informe seu nome completo.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName, accountType);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setInfoMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (msg.includes('email-already-in-use')) {
        setErrorMsg('Este e-mail já está em uso. Tente entrar com sua senha.');
      } else if (msg.includes('weak-password')) {
        setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setErrorMsg('Erro na autenticação. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fast Test Role Presets
  const handleQuickLogin = async (role: 'admin' | 'proprietario') => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (role === 'admin') {
        setEmail('igorwebdesign86@gmail.com');
        setPassword('Admin123*');
        // Attempt sign in or create test profile
        try {
          await signInWithEmail('igorwebdesign86@gmail.com', 'Admin123*');
        } catch {
          await signUpWithEmail('igorwebdesign86@gmail.com', 'Admin123*', 'Administrador AlugaFácil', 'admin');
        }
      } else {
        setEmail('proprietario.dutra@gmail.com');
        setPassword('Proprietario123*');
        try {
          await signInWithEmail('proprietario.dutra@gmail.com', 'Proprietario123*');
        } catch {
          await signUpWithEmail('proprietario.dutra@gmail.com', 'Proprietario123*', 'Carlos Proprietário Dutra', 'proprietario');
        }
      }
      onClose();
    } catch (err) {
      console.warn('Quick login info:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mode === 'login' && 'Acessar Conta'}
                {mode === 'signup' && 'Criar Nova Conta'}
                {mode === 'forgot' && 'Recuperar Senha'}
              </h2>
              <p className="text-[11px] text-slate-500">Portal AlugaFácil Pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch for Login / Signup */}
        {mode !== 'forgot' && (
          <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cadastrar Anunciante
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {infoMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Quick Role Tester Pill Box */}
        <div className="mt-4 p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
          <p className="text-[11px] font-bold text-blue-900 flex items-center gap-1 mb-1.5">
            <Sparkles className="h-3 w-3 text-blue-600" />
            <span>Acesso Rápido para Avaliação:</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('proprietario')}
              className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600 shadow-2xs transition text-center"
            >
              Proprietário Demo
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700 shadow-2xs transition text-center"
            >
              Admin ({ADMIN_EMAIL.split('@')[0]})
            </button>
          </div>
        </div>

        {/* Google Provider Button */}
        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-98 transition disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.43 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold">Ou com e-mail</span>
          </div>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome ou nome da empresa"
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Perfil de Anunciante
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('proprietario')}
                    className={`rounded-xl border p-2 text-left text-xs transition ${
                      accountType === 'proprietario'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserIcon className="h-4 w-4 mb-1 text-blue-600" />
                    <div>Proprietário</div>
                    <div className="text-[10px] font-normal text-slate-500">Imóveis próprios</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('imobiliaria')}
                    className={`rounded-xl border p-2 text-left text-xs transition ${
                      accountType === 'imobiliaria'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="h-4 w-4 mb-1 text-blue-600" />
                    <div>Imobiliária / Corretor</div>
                    <div className="text-[10px] font-normal text-slate-500">Múltiplos imóveis</div>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600"
              />
              <span>
                Concordo com os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong> em conformidade com a LGPD.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-98 transition disabled:opacity-50"
          >
            <span>
              {loading
                ? 'Processando...'
                : mode === 'login'
                ? 'Entrar no Portal'
                : mode === 'signup'
                ? 'Criar Conta de Anunciante'
                : 'Enviar Link de Recuperação'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2"
            >
              Voltar ao Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
