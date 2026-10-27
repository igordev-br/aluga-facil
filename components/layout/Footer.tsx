'use client';

import React from 'react';
import { Home, Phone, Mail, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { INITIAL_CITIES } from '@/lib/seedData';

interface FooterProps {
  onCityClick?: (city: string) => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onCityClick,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  return (
    <footer className="border-t border-slate-200 bg-[#17324D] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                <Home className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">AlugaFácil Pro</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O portal imobiliário definitivo para aluguel de imóveis em Presidente Dutra e cidades do Maranhão. Conexão direta entre proprietário e inquilino via WhatsApp, sem intermediários.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Anúncios moderados e verificados</span>
            </div>
          </div>

          {/* Cities Col */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cidades Atendidas (MA)</h3>
            <ul className="space-y-1.5 text-xs">
              {INITIAL_CITIES.slice(0, 8).map((city) => (
                <li key={city}>
                  <button
                    onClick={() => onCityClick && onCityClick(city)}
                    className="hover:text-white transition flex items-center gap-1.5 text-slate-400 cursor-pointer"
                  >
                    <MapPin className="h-3 w-3 text-blue-400" />
                    <span>{city}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories & Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Imóveis para Aluguel</h3>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Casas para Alugar em Presidente Dutra</li>
              <li>Apartamentos Residenciais</li>
              <li>Kitnets Mobiliadas e Econômicas</li>
              <li>Pontos Comerciais e Salões</li>
              <li>Salas para Escritórios e Consultórios</li>
              <li>Galpões Industriais e Depósitos</li>
              <li>Chácaras e Sítios</li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Atendimento & Suporte</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>WhatsApp: (99) 98450-3210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                <span>contato@alugafacilpro.com.br</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-2">
                Horário de atendimento comercial: Segunda a Sexta, das 08h às 18h.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex flex-wrap gap-3 text-[11px]">
              <button
                onClick={onOpenTerms}
                className="hover:text-white transition text-slate-400 underline cursor-pointer"
              >
                Termos de Uso
              </button>
              <button
                onClick={onOpenPrivacy}
                className="hover:text-white transition text-slate-400 underline cursor-pointer"
              >
                Política de Privacidade
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} AlugaFácil Pro — Presidente Dutra, Maranhão. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1 text-slate-400">
            Desenvolvido com excelência técnica para o Maranhão
          </p>
        </div>
      </div>
    </footer>
  );
};
