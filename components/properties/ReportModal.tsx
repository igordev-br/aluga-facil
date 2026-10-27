'use client';

import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { Property, ReportCategory } from '@/types';
import { submitReport } from '@/lib/propertyService';

interface ReportModalProps {
  property: Property | null;
  onClose: () => void;
}

const REPORT_CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: 'already_rented', label: 'Imóvel já foi alugado ou indisponível' },
  { id: 'wrong_price', label: 'Valor incorreto ou enganoso' },
  { id: 'fake', label: 'Anúncio falso ou tentativa de golpe' },
  { id: 'inappropriate', label: 'Fotos ou informações inadequadas' },
  { id: 'offensive', label: 'Conteúdo ofensivo ou discriminatório' },
  { id: 'other', label: 'Outro problema' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ property, onClose }) => {
  const [category, setCategory] = useState<ReportCategory>('already_rented');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!property) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Por favor, descreva o motivo da denúncia.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await submitReport(
        property.id,
        category,
        description,
        property.title,
        contact
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao enviar denúncia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Flag className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Denunciar Anúncio</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Denúncia Registrada</h4>
            <p className="text-xs text-slate-500">
              Nossa equipe de moderação irá avaliar o anúncio prontamente. Obrigado por manter a plataforma segura!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Você está denunciando o imóvel: <strong className="text-slate-800">{property.title}</strong>
            </p>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Qual o motivo da denúncia?
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
              >
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detalhes adicionais (obrigatório)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explique o que identificou de incorreto..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                maxLength={2000}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Seu contato ou WhatsApp (opcional)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="(99) 90000-0000"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Denúncia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
