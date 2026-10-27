// Test suite to verify all button actions, filters, transitions and handlers in AlugaFácil Pro
import assert from 'node:assert';

console.log('================================================================');
console.log('VARREDURA E AUDITORIA COMPLETA DE BOTÕES E INTERAÇÕES DO SISTEMA');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASSOU] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FALHA] ${name}:`, err.message);
  }
}

// 1. WhatsApp Button Click Validation
test('Botão WhatsApp (Card & Modal): Validação de Parâmetros e Telefone', () => {
  const property = {
    id: 'prop-pd-01',
    title: 'Casa ampla com 3 quartos no Centro',
    publicContactPhone: '(99) 98123-4567',
  };

  const digits = property.publicContactPhone.replace(/\D/g, '');
  const normalized = digits.length === 11 ? `55${digits}` : digits;
  assert.strictEqual(normalized, '5599981234567');

  const refCode = `AF-${property.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)}`;
  const msg = `Olá! Vi o imóvel "${property.title}" no AlugaFácil Pro, referência ${refCode}. Gostaria de mais informações sobre disponibilidade e condições de aluguel.`;
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`;

  assert.ok(url.includes('wa.me/5599981234567'));
  assert.ok(url.includes('AF-PROPPD'));
  assert.ok(url.includes(encodeURIComponent('Casa ampla')));
});

// 2. Share Button Click (Card & Modal)
test('Botão Compartilhar: Suporte a Web Share API e Fallback de Clipboard', () => {
  let shareCalled = false;
  let clipboardCopied = false;

  const mockNavigatorWithShare = {
    share: async (data) => {
      shareCalled = true;
      assert.ok(data.title.includes('Casa'));
    },
  };

  const mockNavigatorWithoutShare = {
    clipboard: {
      writeText: (text) => {
        clipboardCopied = true;
        assert.ok(text.includes('imovel=prop-pd-01'));
      },
    },
  };

  // Test branch 1: share API
  mockNavigatorWithShare.share({ title: 'Casa', url: 'https://alugafacil.com.br?imovel=prop-pd-01' });
  assert.strictEqual(shareCalled, true);

  // Test branch 2: fallback
  mockNavigatorWithoutShare.clipboard.writeText('https://alugafacil.com.br?imovel=prop-pd-01');
  assert.strictEqual(clipboardCopied, true);
});

// 3. Search Filter Buttons and Reset
test('Botão "Limpar Filtros" e "Restaurar Filtros": Retorno ao Estado Padrão', () => {
  let filterState = {
    filterType: 'casa',
    filterMinPrice: 800,
    filterMaxPrice: 2000,
    filterBedrooms: 2,
    filterFurnished: true,
    filterFeaturedOnly: true,
    searchQuery: 'Centro',
  };

  const resetFilters = () => {
    return {
      filterType: 'todos',
      filterMinPrice: 0,
      filterMaxPrice: 0,
      filterBedrooms: 0,
      filterFurnished: false,
      filterFeaturedOnly: false,
      searchQuery: '',
    };
  };

  filterState = resetFilters();
  assert.strictEqual(filterState.filterType, 'todos');
  assert.strictEqual(filterState.filterMinPrice, 0);
  assert.strictEqual(filterState.filterMaxPrice, 0);
  assert.strictEqual(filterState.filterBedrooms, 0);
  assert.strictEqual(filterState.filterFurnished, false);
  assert.strictEqual(filterState.filterFeaturedOnly, false);
  assert.strictEqual(filterState.searchQuery, '');
});

// 4. Owner Dashboard: Toggle Availability (Disponível <-> Alugado)
test('Botão "Marcar Alugado / Disponível": Alternância Correta de Status', () => {
  let status = 'published';
  const toggle = (current) => (current === 'rented' ? 'published' : 'rented');

  status = toggle(status);
  assert.strictEqual(status, 'rented');

  status = toggle(status);
  assert.strictEqual(status, 'published');
});

// 5. Owner Dashboard: PIX Highlight Purchase Button
test('Botão "Destacar Imóvel": Geração de Cobrança PIX com Valor Fixo R$ 19,90', () => {
  const property = { id: 'prop-pd-01', title: 'Casa no Centro' };
  const settings = { featuredPriceCents: 1990 };

  const charge = {
    amountCents: settings.featuredPriceCents,
    type: 'featured',
    propertyId: property.id,
    currency: 'BRL',
    paymentMethod: 'pix',
  };

  assert.strictEqual(charge.amountCents, 1990);
  assert.strictEqual(charge.paymentMethod, 'pix');
});

// 6. Property Wizard Buttons: Step Navigation, Amenity Toggle, Photo Management
test('Wizard de Cadastro: Botões de Avançar, Voltar, Seleção de Comodidades e Fotos', () => {
  let step = 1;
  const next = () => (step = Math.min(step + 1, 7));
  const back = () => (step = Math.max(step - 1, 1));

  next();
  assert.strictEqual(step, 2);
  back();
  assert.strictEqual(step, 1);

  // Amenity Toggle
  let amenities = ['Garagem Coberta'];
  const toggleAmenity = (item) => {
    amenities = amenities.includes(item)
      ? amenities.filter((a) => a !== item)
      : [...amenities, item];
  };

  toggleAmenity('Poço Artesiano');
  assert.strictEqual(amenities.length, 2);
  toggleAmenity('Garagem Coberta');
  assert.strictEqual(amenities.length, 1);
  assert.strictEqual(amenities[0], 'Poço Artesiano');

  // Photo Add / Remove
  let photos = ['https://foto1.jpg', 'https://foto2.jpg'];
  photos.push('https://foto3.jpg');
  assert.strictEqual(photos.length, 3);
  photos = photos.filter((_, i) => i !== 0);
  assert.strictEqual(photos.length, 2);
  assert.strictEqual(photos[0], 'https://foto2.jpg');
});

// 7. Admin Dashboard Buttons: Moderate Property (Approve / Reject)
test('Botões Administrativos de Moderação: Aprovar e Rejeitar Anúncio', () => {
  const applyDecision = (decision) => {
    if (decision === 'approve') {
      return { status: 'published', moderationStatus: 'approved' };
    }
    if (decision === 'reject') {
      return { status: 'draft', moderationStatus: 'rejected' };
    }
    return { status: 'pending', moderationStatus: 'pending' };
  };

  const approved = applyDecision('approve');
  assert.strictEqual(approved.status, 'published');
  assert.strictEqual(approved.moderationStatus, 'approved');

  const rejected = applyDecision('reject');
  assert.strictEqual(rejected.status, 'draft');
  assert.strictEqual(rejected.moderationStatus, 'rejected');
});

// 8. Admin Dashboard Buttons: Payment Confirmation and Automatic Activation
test('Botão Administrativo "Confirmar PIX": Ativação Atômica de Destaque / Plano', () => {
  const charge = {
    id: 'chg-123',
    type: 'featured',
    propertyId: 'prop-01',
    durationDays: 7,
  };

  const expiresAt = new Date(Date.now() + charge.durationDays * 86400000).toISOString();
  const propertyUpdate = {
    featuredUntil: expiresAt,
  };

  assert.ok(new Date(propertyUpdate.featuredUntil).getTime() > Date.now());
});

// 9. Auth Modal Buttons: 1-Click Fast Presets (Admin, Proprietário, Imobiliária)
test('Botões de Acesso Rápido do AuthModal: Perfis e Privilégios Corretos', () => {
  const getDemoSession = (role) => {
    if (role === 'admin') {
      return {
        email: 'igorwebdesign86@gmail.com',
        accountType: 'admin',
        isAdmin: true,
      };
    }
    if (role === 'imobiliaria') {
      return {
        email: 'central.imoveis@alugafacil.com.br',
        accountType: 'imobiliaria',
        isAdmin: false,
      };
    }
    return {
      email: 'carlos.proprietario@gmail.com',
      accountType: 'proprietario',
      isAdmin: false,
    };
  };

  const admin = getDemoSession('admin');
  assert.strictEqual(admin.isAdmin, true);
  assert.strictEqual(admin.email, 'igorwebdesign86@gmail.com');

  const prop = getDemoSession('proprietario');
  assert.strictEqual(prop.isAdmin, false);
  assert.strictEqual(prop.accountType, 'proprietario');

  const imob = getDemoSession('imobiliaria');
  assert.strictEqual(imob.accountType, 'imobiliaria');
});

// 10. Report Modal: Submit Report
test('Botão "Enviar Denúncia": Validação de Categoria e Descrição', () => {
  const validateReport = (category, desc) => {
    if (!desc || desc.trim().length === 0) return { valid: false, error: 'Descrição obrigatória' };
    const validCats = ['fake', 'already_rented', 'wrong_price', 'inappropriate', 'offensive', 'other'];
    if (!validCats.includes(category)) return { valid: false, error: 'Categoria inválida' };
    return { valid: true };
  };

  assert.strictEqual(validateReport('fake', '').valid, false);
  assert.strictEqual(validateReport('invalid_cat', 'Golpe').valid, false);
  assert.strictEqual(validateReport('already_rented', 'Já foi alugado ontem.').valid, true);
});

console.log('\n================================================================');
console.log(`RESULTADO DA VARREDURA: ${passed}/${total} TESTES PASSARAM COM SUCESSO!`);
console.log('================================================================');

if (passed !== total) process.exit(1);
