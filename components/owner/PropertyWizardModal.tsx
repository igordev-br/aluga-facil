'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Building,
  MapPin,
  Home,
  DollarSign,
  Camera,
  Phone,
  FileCheck,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Property, PropertyType, PropertyPurpose } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatBRL, PROPERTY_TYPE_LABELS } from '@/lib/formatters';
import { saveProperty } from '@/lib/propertyService';
import { INITIAL_CITIES } from '@/lib/seedData';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

interface PropertyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertySaved: (savedId: string) => void;
  initialProperty?: Property | null;
}

const COMMON_AMENITIES = [
  'Ar-Condicionado',
  'Garagem Coberta',
  'Portão Eletrônico',
  'Poço Artesiano',
  'Quintal Murado',
  'Piscina',
  'Área Gourmet com Churrasqueira',
  'Cozinha Americana',
  'Armários Planejados',
  'Interfone',
  'Cerca Elétrica',
  'Alarme e Câmeras',
  'Permite Animais (Pet Friendly)',
  'Água Inclusa',
  'Wi-Fi Incluso',
];

export const PropertyWizardModal: React.FC<PropertyWizardModalProps> = ({
  isOpen,
  onClose,
  onPropertySaved,
  initialProperty,
}) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Identificação
  const [title, setTitle] = useState(initialProperty?.title || '');
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialProperty?.propertyType || 'casa'
  );
  const [purpose, setPurpose] = useState<PropertyPurpose>(
    initialProperty?.purpose || 'residencial'
  );
  const [description, setDescription] = useState(initialProperty?.description || '');

  // Step 2: Localização
  const [state] = useState('MA');
  const [city, setCity] = useState(initialProperty?.city || 'Presidente Dutra');
  const [neighborhood, setNeighborhood] = useState(initialProperty?.neighborhood || 'Centro');
  const [publicAddress, setPublicAddress] = useState(
    initialProperty?.publicAddress || 'Próximo à área central'
  );
  const [privateAddress, setPrivateAddress] = useState(
    initialProperty?.privateAddress || ''
  );

  // Step 3: Características
  const [areaM2, setAreaM2] = useState<number>(initialProperty?.areaM2 || 80);
  const [bedrooms, setBedrooms] = useState<number>(initialProperty?.bedrooms || 2);
  const [suites, setSuites] = useState<number>(initialProperty?.suites || 1);
  const [bathrooms, setBathrooms] = useState<number>(initialProperty?.bathrooms || 1);
  const [parkingSpaces, setParkingSpaces] = useState<number>(
    initialProperty?.parkingSpaces || 1
  );
  const [furnished, setFurnished] = useState<boolean>(initialProperty?.furnished || false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialProperty?.amenities || ['Garagem Coberta', 'Poço Artesiano']
  );

  // Step 4: Valores
  const [rentReais, setRentReais] = useState<number>(
    initialProperty ? initialProperty.rentAmountCents / 100 : 1200
  );
  const [condoReais, setCondoReais] = useState<number>(
    initialProperty?.condominiumAmountCents
      ? initialProperty.condominiumAmountCents / 100
      : 0
  );
  const [iptuReais, setIptuReais] = useState<number>(
    initialProperty?.iptuAmountCents ? initialProperty.iptuAmountCents / 100 : 0
  );
  const [additionalFees, setAdditionalFees] = useState(
    initialProperty?.additionalFees || ''
  );

  // Step 5: Fotos
  const [photos, setPhotos] = useState<string[]>(
    initialProperty?.photoPaths && initialProperty.photoPaths.length > 0
      ? initialProperty.photoPaths
      : [
          'https://picsum.photos/seed/novo-imovel-1/1000/700',
          'https://picsum.photos/seed/novo-imovel-2/1000/700',
        ]
  );
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [coverIndex, setCoverIndex] = useState(0);

  // Step 6: Contato
  const [publicContactName, setPublicContactName] = useState(
    initialProperty?.publicContactName || profile?.displayName || 'Proprietário'
  );
  const [publicContactPhone, setPublicContactPhone] = useState(
    initialProperty?.publicContactPhone || '(99) 98123-4567'
  );
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  if (!isOpen) return null;

  const toggleAmenity = (item: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      setPhotos([...photos, newPhotoUrl.trim()]);
      setNewPhotoUrl('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
    if (coverIndex >= idx && coverIndex > 0) {
      setCoverIndex(coverIndex - 1);
    }
  };

  const addRandomPlaceholderPhoto = () => {
    const randomSeed = Math.random().toString(36).substring(2, 8);
    setPhotos([...photos, `https://picsum.photos/seed/${randomSeed}/1000/700`]);
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!title.trim() || title.trim().length < 5) {
        setErrorMsg('O título deve conter pelo menos 5 caracteres.');
        return false;
      }
      if (!description.trim() || description.trim().length < 10) {
        setErrorMsg('Forneça uma descrição detalhada de no mínimo 10 caracteres.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!city || !neighborhood) {
        setErrorMsg('Cidade e bairro são obrigatórios.');
        return false;
      }
    } else if (currentStep === 4) {
      if (!rentReais || rentReais <= 0) {
        setErrorMsg('Informe um valor de aluguel válido maior que zero.');
        return false;
      }
    } else if (currentStep === 5) {
      if (photos.length === 0) {
        setErrorMsg('Adicione pelo menos 1 foto do imóvel.');
        return false;
      }
    } else if (currentStep === 6) {
      if (!publicContactName.trim()) {
        setErrorMsg('Informe o nome do contato.');
        return false;
      }
      const { valid, error } = normalizeWhatsAppNumber(publicContactPhone);
      if (!valid) {
        setErrorMsg(error || 'Telefone inválido. Inclua o DDD com 2 dígitos.');
        return false;
      }
      if (!whatsappConsent) {
        setErrorMsg('É necessário autorizar a exibição do WhatsApp para os visitantes.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async (submitForReview: boolean) => {
    if (!user) {
      setErrorMsg('Usuário não autenticado.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const rentAmountCents = Math.round(rentReais * 100);
      const condominiumAmountCents = Math.round((condoReais || 0) * 100);
      const iptuAmountCents = Math.round((iptuReais || 0) * 100);

      const coverPhotoPath =
        photos.length > 0 ? photos[coverIndex] || photos[0] : '';

      const propertyPayload: Omit<Property, 'id'> & { id?: string } = {
        ...(initialProperty?.id ? { id: initialProperty.id } : {}),
        ownerId: user.uid,
        title: title.trim(),
        propertyType,
        purpose,
        description: description.trim(),
        city,
        state,
        neighborhood: neighborhood.trim(),
        publicAddress: publicAddress.trim(),
        privateAddress: privateAddress.trim(),
        areaM2: Number(areaM2) || 0,
        bedrooms: Number(bedrooms) || 0,
        suites: Number(suites) || 0,
        bathrooms: Number(bathrooms) || 0,
        parkingSpaces: Number(parkingSpaces) || 0,
        furnished,
        amenities: selectedAmenities,
        rentAmountCents,
        condominiumAmountCents,
        iptuAmountCents,
        additionalFees: additionalFees.trim(),
        photoPaths: photos,
        coverPhotoPath,
        publicContactName: publicContactName.trim(),
        publicContactPhone: publicContactPhone.trim(),
        whatsappConsent,
        status: submitForReview ? 'pending' : 'draft',
        moderationStatus: submitForReview ? 'pending' : 'pending',
        createdAt: initialProperty?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedId = await saveProperty(propertyPayload);
      onPropertySaved(savedId);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao salvar imóvel.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {initialProperty ? 'Editar Anúncio de Imóvel' : 'Cadastrar Novo Imóvel para Aluguel'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Etapa {step} de 7 — {
                [
                  'Identificação',
                  'Localização',
                  'Características',
                  'Valores e Taxas',
                  'Fotografias',
                  'Contato WhatsApp',
                  'Revisão e Envio',
                ][step - 1]
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-3 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-blue-600' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Step Content */}
        <div className="overflow-y-auto py-4 flex-1 space-y-4">
          {/* STEP 1: IDENTIFICAÇÃO */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Anúncio (destaque os diferenciais) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Casa com 3 Quartos, Garagem e Quintal no Centro"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  maxLength={150}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Imóvel *
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  >
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Finalidade *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPurpose('residencial')}
                      className={`rounded-xl border p-2 text-center text-xs font-semibold transition ${
                        purpose === 'residencial'
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Residencial
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurpose('comercial')}
                      className={`rounded-xl border p-2 text-center text-xs font-semibold transition ${
                        purpose === 'comercial'
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Comercial
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Completa do Imóvel *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Descreva detalhes como acabamento, iluminação, ventilação, proximidade com escolas, comércio ou rodovia..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  maxLength={4000}
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOCALIZAÇÃO */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  >
                    {INITIAL_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c} - MA
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Centro, Angelim, Campo D'Ávila"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Público (Ponto de Referência visível no portal)
                </label>
                <input
                  type="text"
                  value={publicAddress}
                  onChange={(e) => setPublicAddress(e.target.value)}
                  placeholder="Ex: Próximo à Praça São Sebastião / A 200m do Hospital"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Esta informação será pública para visitantes identificarem a região.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo com Número (Privado / Sigiloso)
                </label>
                <input
                  type="text"
                  value={privateAddress}
                  onChange={(e) => setPrivateAddress(e.target.value)}
                  placeholder="Rua, número e complemento (apenas para moderação)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  🔒 Protegido: este campo nunca será exibido aos visitantes do portal.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: CARACTERÍSTICAS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Área Útil (m²)
                  </label>
                  <input
                    type="number"
                    value={areaM2}
                    onChange={(e) => setAreaM2(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quartos
                  </label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Suítes
                  </label>
                  <input
                    type="number"
                    value={suites}
                    onChange={(e) => setSuites(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banheiros
                  </label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vagas de Garagem
                  </label>
                  <input
                    type="number"
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Imóvel Mobiliado?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFurnished(true)}
                      className={`flex-1 rounded-xl border p-2.5 text-xs font-semibold transition ${
                        furnished ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setFurnished(false)}
                      className={`flex-1 rounded-xl border p-2.5 text-xs font-semibold transition ${
                        !furnished ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Comodidades e Diferenciais
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {COMMON_AMENITIES.map((item) => {
                    const isSelected = selectedAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: VALORES */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1">
                  Aluguel Mensal (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    value={rentReais}
                    onChange={(e) => setRentReais(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-xl border border-blue-200 bg-white py-2 pl-9 pr-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-blue-600 mt-1">
                  {formatBRL(Math.round(rentReais * 100))} por mês
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condomínio (R$, se houver)
                  </label>
                  <input
                    type="number"
                    value={condoReais}
                    onChange={(e) => setCondoReais(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IPTU Mensal (R$, se houver)
                  </label>
                  <input
                    type="number"
                    value={iptuReais}
                    onChange={(e) => setIptuReais(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outras taxas ou o que está incluso no valor
                </label>
                <input
                  type="text"
                  value={additionalFees}
                  onChange={(e) => setAdditionalFees(e.target.value)}
                  placeholder="Ex: Água inclusa no condomínio, luz individual"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 5: FOTOS */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adicionar Foto via URL ou gerador
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto-do-imovel.jpg"
                    className="flex-1 rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={addRandomPlaceholderPhoto}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    <span>Foto Demo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition ${
                      coverIndex === idx ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'
                    }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-1.5 left-1.5">
                      {coverIndex === idx ? (
                        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                          Foto Principal
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCoverIndex(idx)}
                          className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white hover:bg-black/90"
                        >
                          Definir Capa
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-rose-600 p-1 text-white hover:bg-rose-700 shadow-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: CONTATO */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Público do Anunciante *
                </label>
                <input
                  type="text"
                  value={publicContactName}
                  onChange={(e) => setPublicContactName(e.target.value)}
                  placeholder="Ex: Carlos Oliveira ou Imobiliária Dutra"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp com DDD *
                </label>
                <input
                  type="text"
                  value={publicContactPhone}
                  onChange={(e) => setPublicContactPhone(e.target.value)}
                  placeholder="(99) 98123-4567"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Certifique-se de que o número possui conta ativa no WhatsApp para receber contatos de interessados.
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200">
                <label className="flex items-start gap-2.5 text-xs text-emerald-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="mt-0.5 rounded border-emerald-400 text-emerald-600"
                  />
                  <span>
                    Autorizo expressamente o portal <strong>AlugaFácil Pro</strong> a disponibilizar o botão de WhatsApp diretamente no meu anúncio com meu número para facilitar a comunicação com os locatários.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 7: REVISÃO & ENVIO */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
                      {PROPERTY_TYPE_LABELS[propertyType]} — {purpose}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{title}</h3>
                    <p className="text-xs text-slate-600">
                      {neighborhood}, {city} - {state}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-blue-700">
                      {formatBRL(Math.round(rentReais * 100))}
                    </span>
                    <span className="text-[10px] text-slate-500 block">/mês</span>
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-slate-600 border-t border-slate-200 pt-2">
                  <span>{areaM2} m²</span>
                  <span>{bedrooms} quartos</span>
                  <span>{bathrooms} banheiros</span>
                  <span>{parkingSpaces} vagas</span>
                  <span>{furnished ? 'Mobiliado' : 'Sem mobília'}</span>
                </div>

                <div className="text-xs text-slate-500 border-t border-slate-200 pt-2">
                  <p>Contato: <strong>{publicContactName}</strong> — {publicContactPhone}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900">
                <p className="font-semibold mb-1">Como funciona a publicação?</p>
                <p className="text-[11px] leading-relaxed">
                  Para garantir a segurança dos visitantes e a qualidade dos anúncios, todo novo anúncio passa por moderação administrativa em até poucas horas antes de ficar público no portal. Você pode salvar como rascunho ou submeter para análise imediatamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
            >
              <span>Avançar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Salvar Rascunho
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave(true)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar para Moderação'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
