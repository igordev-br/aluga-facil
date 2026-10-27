'use client';

import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              {type === 'terms' ? <FileText className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {type === 'terms' ? 'Termos de Uso do AlugaFácil Pro' : 'Política de Privacidade (LGPD)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 text-xs text-slate-600 space-y-3 leading-relaxed">
          {type === 'terms' ? (
            <>
              <p>
                <strong>1. Objeto da Plataforma:</strong> O <strong>AlugaFácil Pro</strong> é um portal intermediador de divulgação imobiliária com foco em Presidente Dutra e municípios do Estado do Maranhão. A plataforma viabiliza o encontro direto entre locadores e locatários via WhatsApp.
              </p>
              <p>
                <strong>2. Responsabilidade sobre os Anúncios:</strong> O proprietário ou corretor anunciante é o único e exclusivo responsável pela veracidade dos dados, valores, descrições e fotografias cadastradas. Anúncios fraudulentos, com preços enganosos ou imóveis indisponíveis serão sumariamente rejeitados ou suspensos.
              </p>
              <p>
                <strong>3. Não Intermediação Financeira de Aluguéis:</strong> O portal não recebe caução, não realiza cobrança de aluguéis e não se responsabiliza pelas tratativas contratuais ou financeiras entre as partes.
              </p>
              <p>
                <strong>4. Planos e Destaques:</strong> As assinaturas e destaques pagos seguem o modelo de conferência manual. O benefício é ativado imediatamente após a validação do comprovante pela equipe administrativa.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Coleta e Uso de Dados:</strong> Em estrito cumprimento à Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), coletamos apenas os dados essenciais para identificação do anunciante (nome, e-mail e telefone comercial de contato).
              </p>
              <p>
                <strong>2. Proteção de Dados Privados:</strong> Endereços residenciais completos e números de identificação privada não são divulgados publicamente na consulta de busca. Apenas pontos de referência e bairros autorizados são exibidos aos visitantes.
              </p>
              <p>
                <strong>3. Divulgação de WhatsApp:</strong> O telefone de contato divulgado no botão de WhatsApp é fornecido voluntariamente pelo anunciante com consentimento expresso para recepção de mensagens de potenciais inquilinos.
              </p>
              <p>
                <strong>4. Exclusão de Dados:</strong> O usuário pode a qualquer momento solicitar a exclusão de seus dados pessoais através de nossos canais de suporte oficial.
              </p>
            </>
          )}
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
