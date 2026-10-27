import { generateReferenceCode } from './formatters';

export interface WhatsAppLinkParams {
  phone: string;
  propertyTitle: string;
  propertyId: string;
}

export function normalizeWhatsAppNumber(rawPhone: string): {
  valid: boolean;
  normalizedNumber: string;
  error?: string;
} {
  if (!rawPhone) {
    return { valid: false, normalizedNumber: '', error: 'Telefone não informado' };
  }

  // Strip non-digits
  let digits = rawPhone.replace(/\D/g, '');

  // If starts with 0 (e.g. 099 98123-4567 or 0800), strip only if total is 11 or 12 digits
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }

  // Now, Brazilian numbers with DDD are:
  // 10 digits (fixed line: DDD + 8 digits)
  // 11 digits (mobile: DDD + 9 digits)
  // 12 digits (with 55 + fixed line)
  // 13 digits (with 55 + mobile)

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  } else if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith('55')) {
      return {
        valid: false,
        normalizedNumber: '',
        error: 'Número de telefone inválido.',
      };
    }
  } else {
    return {
      valid: false,
      normalizedNumber: '',
      error: 'Telefone incompleto. Certifique-se de incluir o DDD com 2 dígitos e o número com 8 ou 9 dígitos.',
    };
  }

  // Validate Brazilian DDD (indexes 2 and 3)
  const ddd = parseInt(digits.substring(2, 4), 10);
  // Valid Brazilian DDD ranges: 11-19 (SP), 21-28 (RJ/ES), 31-38 (MG), 41-49 (PR/SC), 51-55 (RS), 61-69 (DF/GO/TO/MT/MS/RO/AC), 71-79 (BA/SE), 81-89 (PE/AL/PB/RN/CE/PI), 91-99 (PA/AP/AM/RR/MA)
  const validDdds = [
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55,
    61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99,
  ];

  if (!validDdds.includes(ddd)) {
    return {
      valid: false,
      normalizedNumber: '',
      error: `O DDD (${ddd}) informado não é válido no Brasil.`,
    };
  }

  return { valid: true, normalizedNumber: digits };
}

export function buildWhatsAppMessage(title: string, propertyId: string): string {
  const code = generateReferenceCode(propertyId);
  return `Olá! Vi o imóvel "${title}" no AlugaFácil Pro, referência ${code}. Gostaria de mais informações sobre disponibilidade e condições de aluguel.`;
}

export function createWhatsAppUrl(params: WhatsAppLinkParams): {
  url: string;
  error?: string;
} {
  const { valid, normalizedNumber, error } = normalizeWhatsAppNumber(params.phone);
  if (!valid) {
    return { url: '', error };
  }

  const message = buildWhatsAppMessage(params.propertyTitle, params.propertyId);
  const encodedMessage = encodeURIComponent(message);

  return {
    url: `https://wa.me/${normalizedNumber}?text=${encodedMessage}`,
  };
}
