'use client';

import React, { useState } from 'react';
import {
  Home,
  MapPin,
  PlusCircle,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  SlidersHorizontal,
  Bell,
  ChevronDown,
  Sparkles,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { INITIAL_CITIES } from '@/lib/seedData';

interface NavbarProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  activeView: 'home' | 'search' | 'owner' | 'admin' | 'plans';
  setActiveView: (view: 'home' | 'search' | 'owner' | 'admin' | 'plans') => void;
  onOpenAuth: () => void;
  onOpenNewProperty?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedCity,
  onCityChange,
  activeView,
  setActiveView,
  onOpenAuth,
  onOpenNewProperty,
}) => {
  const { user, profile, isAdmin, signOutUser } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-[#17324D] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm group-hover:scale-105 transition">
              <Home className="h-5 w-5 text-white" />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#17324D]">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white">AlugaFácil</span>
                <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-300 ring-1 ring-blue-400/40">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">Presidente Dutra & Região - MA</p>
            </div>
          </button>

          {/* City Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setCityMenuOpen(!cityMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/15 transition focus:outline-hidden"
            >
              <MapPin className="h-3.5 w-3.5 text-blue-300" />
              <span>{selectedCity}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {cityMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/10 z-50 animate-in fade-in zoom-in-95 text-slate-800">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Cidades no Maranhão
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  <button
                    onClick={() => {
                      onCityChange('Todas as Cidades');
                      setCityMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition font-medium ${
                      selectedCity === 'Todas as Cidades'
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Todas as Cidades
                  </button>
                  {INITIAL_CITIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onCityChange(c);
                        setCityMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition font-medium ${
                        selectedCity === c
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation center/right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveView('search')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeView === 'search'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Buscar Imóveis</span>
          </button>

          <button
            onClick={() => setActiveView('plans')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeView === 'plans'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <span>Planos para Proprietários</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Primary Action: Anunciar Imóvel */}
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                setActiveView('owner');
                if (onOpenNewProperty) onOpenNewProperty();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-blue-600 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Anunciar Imóvel</span>
          </button>

          {/* User Account / Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl bg-white/10 pl-2 pr-2.5 py-1 text-xs text-white hover:bg-white/15 transition focus:outline-hidden"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-xs uppercase shadow-xs">
                  {profile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <span className="hidden md:block max-w-[110px] truncate text-left font-medium">
                  {profile?.displayName || 'Minha Conta'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/10 z-50 animate-in fade-in zoom-in-95 text-slate-800">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {profile?.displayName || 'Usuário'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 capitalize">
                        {profile?.accountType || 'Proprietário'}
                      </span>
                      {isAdmin && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                          Administrador
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveView('owner');
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      <span>Painel do Proprietário</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveView('admin');
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                        <span>Painel Administrativo</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        signOutUser();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition cursor-pointer"
            >
              <UserIcon className="h-3.5 w-3.5 text-slate-300" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
