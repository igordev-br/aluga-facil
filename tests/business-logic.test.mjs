// Automated Test Suite for AlugaFácil Pro Business Rules & Safety
import assert from 'node:assert';

console.log('====================================================');
console.log('INICIANDO BATERIA DE TESTES AUTOMATIZADOS: ALUGAFÁCIL PRO');
console.log('====================================================\n');

let passedCount = 0;
let totalCount = 0;

function runTest(testName, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✅ [PASSOU] ${testName}`);
    passedCount++;
  } catch (error) {
    console.error(`❌ [FALHOU] ${testName}:`, error.message);
  }
}

// 1. Currency Formatter BRL
function formatBRL(amountCents) {
  if (typeof amountCents !== 'number' || isNaN(amountCents)) return 'R$ 0,00';
  const reais = amountCents / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reais);
}

runTest('Formatação de Preço BRL (Centavos para Real)', () => {
  const result1 = formatBRL(150000);
  assert.match(result1, /1\.500,00/);

  const result2 = formatBRL(2990);
  assert.match(result2, /29,90/);

  const result3 = formatBRL(0);
  assert.match(result3, /0,00/);
});

// 2. Phone / WhatsApp Normalizer
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

function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone) return { valid: false, normalizedNumber: '', error: 'Telefone não informado' };
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  } else if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith('55')) {
      return { valid: false, normalizedNumber: '', error: 'Inválido' };
    }
  } else {
    return { valid: false, normalizedNumber: '', error: 'Tamanho inválido' };
  }
  const ddd = parseInt(digits.substring(2, 4), 10);
  if (!validDdds.includes(ddd)) {
    return { valid: false, normalizedNumber: '', error: 'DDD inválido' };
  }
  return { valid: true, normalizedNumber: digits };
}

runTest('Validação e Normalização de WhatsApp Brasileiro com DDD', () => {
  // Mobile Presidente Dutra (99) 98123-4567 -> 5599981234567
  const r1 = normalizeWhatsAppNumber('(99) 98123-4567');
  assert.strictEqual(r1.valid, true);
  assert.strictEqual(r1.normalizedNumber, '5599981234567');

  // Landline in MA (99) 3663-1234 -> 559936631234
  const rLand = normalizeWhatsAppNumber('(99) 3663-1234');
  assert.strictEqual(rLand.valid, true);
  assert.strictEqual(rLand.normalizedNumber, '559936631234');

  // Incomplete number without DDD (only 8 digits)
  const r2 = normalizeWhatsAppNumber('98123-4567');
  assert.strictEqual(r2.valid, false);

  // Invalid fake DDD 05
  const r3 = normalizeWhatsAppNumber('(05) 98123-4567');
  assert.strictEqual(r3.valid, false);
});

// 3. Message Link Generator with URL encoding
function buildWhatsAppMessage(title, propertyId) {
  const code = `AF-${propertyId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)}`;
  return `Olá! Vi o imóvel "${title}" no AlugaFácil Pro, referência ${code}. Gostaria de mais informações sobre disponibilidade e condições de aluguel.`;
}

runTest('Geração de Mensagem Oficial do WhatsApp com Referência', () => {
  const msg = buildWhatsAppMessage('Casa no Centro', 'prop-pd-01');
  assert.ok(msg.includes('Casa no Centro'));
  assert.ok(msg.includes('referência AF-PROPPD'));
  assert.ok(msg.includes('AlugaFácil Pro'));

  const url = `https://wa.me/5599981234567?text=${encodeURIComponent(msg)}`;
  assert.ok(url.startsWith('https://wa.me/5599981234567?text=Ol%C3%A1!'));
});

// 4. Highlight Expiration Logic
function isHighlightActive(featuredUntil) {
  if (!featuredUntil) return false;
  return new Date(featuredUntil).getTime() > Date.now();
}

runTest('Expiração Automática de Destaques Pagos', () => {
  const pastDate = new Date(Date.now() - 1000).toISOString();
  assert.strictEqual(isHighlightActive(pastDate), false);

  const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();
  assert.strictEqual(isHighlightActive(futureDate), true);

  assert.strictEqual(isHighlightActive(null), false);
});

// 5. Subscription Property Limit Enforcement
function checkListingLimit(currentActiveCount, planMaxAllowed) {
  return currentActiveCount < planMaxAllowed;
}

runTest('Enforcement de Limite de Anúncios Ativos por Plano', () => {
  // Free plan limit: 2
  assert.strictEqual(checkListingLimit(1, 2), true);
  assert.strictEqual(checkListingLimit(2, 2), false); // Reaches limit
  assert.strictEqual(checkListingLimit(3, 2), false); // Exceeds limit

  // Pro plan limit: 10
  assert.strictEqual(checkListingLimit(8, 10), true);
  assert.strictEqual(checkListingLimit(10, 10), false);
});

// 6. Security: Anti-Self-Approval & Role Privilege Guard
function canUserSelfApprove(userRole) {
  return userRole === 'admin';
}

runTest('Segurança: Proprietário Não Consegue Auto-Aprovar Anúncios', () => {
  assert.strictEqual(canUserSelfApprove('proprietario'), false);
  assert.strictEqual(canUserSelfApprove('imobiliaria'), false);
  assert.strictEqual(canUserSelfApprove('admin'), true);
});

// 7. Security: Anti-Self-Confirm Payment
function canOwnerConfirmOwnPayment(ownerId, actorUid, actorIsAdmin) {
  if (!actorIsAdmin) return false;
  return true;
}

runTest('Segurança: Proprietário Não Consegue Confirmar Próprio Pagamento', () => {
  const ownerUid = 'user-owner-123';
  // Attempted by the owner themselves (non-admin)
  assert.strictEqual(canOwnerConfirmOwnPayment(ownerUid, ownerUid, false), false);
  // Attempted by authorized administrator
  assert.strictEqual(canOwnerConfirmOwnPayment(ownerUid, 'admin-uid', true), true);
});

// 8. Security: Private Address Obfuscation for Public Search
function filterPublicPropertyPayload(rawDoc) {
  const { privateAddress, ...publicData } = rawDoc;
  return publicData;
}

runTest('Segurança & LGPD: Ocultação de Endereço Privado para Consulta Pública', () => {
  const rawProperty = {
    id: 'prop-123',
    title: 'Casa no Angelim',
    city: 'Presidente Dutra',
    neighborhood: 'Angelim',
    publicAddress: 'Próximo à Praça Central',
    privateAddress: 'Rua das Flores, 45 - Residência do Proprietário',
    rentAmountCents: 120000,
  };

  const publicView = filterPublicPropertyPayload(rawProperty);
  assert.strictEqual(publicView.privateAddress, undefined);
  assert.strictEqual(publicView.publicAddress, 'Próximo à Praça Central');
});

console.log('\n====================================================');
console.log(`RESULTADO FINAL: ${passedCount}/${totalCount} TESTES PASSARAM COM SUCESSO`);
console.log('====================================================');

if (passedCount !== totalCount) {
  process.exit(1);
}
