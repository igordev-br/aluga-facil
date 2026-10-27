// Brazilian Real Currency Formatter
export function formatBRL(amountCents: number): string {
  if (typeof amountCents !== 'number' || isNaN(amountCents)) {
    return 'R$ 0,00';
  }
  const reais = amountCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

// Brazilian Date Formatter (DD/MM/AAAA)
export function formatDateBR(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Fortaleza',
    }).format(d);
  } catch {
    return '—';
  }
}

// Brazilian Date + Time Formatter (DD/MM/AAAA às HH:mm)
export function formatDateTimeBR(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Fortaleza',
    }).format(d);
  } catch {
    return '—';
  }
}

// Relative time in Portuguese (ex: "há 2 horas", "ontem", "há 3 dias")
export function formatRelativeTimeBR(dateInput: string | number | Date): string {
  try {
    const d = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    if (diffHour < 24) return `Há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
    if (diffDay === 1) return 'Ontem';
    if (diffDay < 30) return `Há ${diffDay} dias`;
    return formatDateBR(d);
  } catch {
    return '—';
  }
}

// Generate reference code from ID
export function generateReferenceCode(id: string): string {
  if (!id) return 'AF-000';
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `AF-${clean.slice(0, 6)}`;
}

// Phone masking for pt-BR (XX) XXXXX-XXXX
export function formatPhoneBR(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// Status labels and badge helpers
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  kitnet: 'Kitnet',
  comercial: 'Ponto Comercial',
  sala: 'Sala Comercial',
  galpao: 'Galpão',
  terreno: 'Terreno',
  chacara: 'Chácara / Sítio',
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  published: { label: 'Publicado', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  pending: { label: 'Em Análise', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  rented: { label: 'Alugado', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  unavailable: { label: 'Indisponível', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  archived: { label: 'Arquivado', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export const MODERATION_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: 'Aprovado', color: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Aguardando Moderação', color: 'bg-amber-50 text-amber-700' },
  rejected: { label: 'Rejeitado', color: 'bg-rose-50 text-rose-700' },
  correction_requested: { label: 'Correção Solicitada', color: 'bg-purple-50 text-purple-700' },
};
