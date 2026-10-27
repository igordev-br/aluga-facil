'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PlusCircle,
  Building,
  Eye,
  MessageCircle,
  Sparkles,
  CreditCard,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileEdit,
  Trash2,
  Lock,
  ArrowUpRight,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  X,
} from 'lucide-react';
import { Property, Plan, Subscription, Charge, InAppNotification } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatBRL, formatDateBR, generateReferenceCode, STATUS_LABELS, MODERATION_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/formatters';
import { generateUniqueId, calculateExpiryIso } from '@/lib/utils';
import { getOwnerProperties, getPlans, getPlatformSettings, saveProperty } from '@/lib/propertyService';
import { PropertyWizardModal } from './PropertyWizardModal';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';

export const OwnerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'properties' | 'plans' | 'charges' | 'notifications'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimestamp] = useState(() => Date.now());

  // Wizard modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // PIX Modal for Payment
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixDetails, setPixDetails] = useState<{
    title: string;
    amountCents: number;
    type: 'subscription' | 'featured';
    targetId: string;
    chargeId: string;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Rejection details modal
  const [rejectionModal, setRejectionModal] = useState<Property | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      // Properties
      const userProps = await getOwnerProperties(user.uid);
      setProperties(userProps);

      // Plans
      const p = await getPlans();
      setPlans(p);

      // Charges
      try {
        const chargesCol = collection(db, 'charges');
        const qC = query(chargesCol, where('ownerId', '==', user.uid));
        const cSnap = await getDocs(qC);
        const cList: Charge[] = [];
        cSnap.forEach((d) => cList.push({ id: d.id, ...(d.data() as Omit<Charge, 'id'>) }));
        setCharges(cList);
      } catch (err) {
        console.warn('Could not load user charges:', err);
      }

      // Notifications
      try {
        const notifCol = collection(db, 'notifications');
        const qN = query(notifCol, where('recipientId', '==', user.uid));
        const nSnap = await getDocs(qN);
        const nList: InAppNotification[] = [];
        nSnap.forEach((d) => nList.push({ id: d.id, ...(d.data() as Omit<InAppNotification, 'id'>) }));
        setNotifications(nList);
      } catch (err) {
        console.warn('Could not load user notifications:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl py-16 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 mt-1">Por favor realize o login para gerenciar seus imóveis.</p>
      </div>
    );
  }

  // Calculate metrics
  const totalProperties = properties.length;
  const publishedProperties = properties.filter((p) => p.status === 'published' && p.moderationStatus === 'approved').length;
  const pendingProperties = properties.filter((p) => p.status === 'pending' || p.moderationStatus === 'pending').length;
  const rejectedProperties = properties.filter((p) => p.moderationStatus === 'rejected' || p.moderationStatus === 'correction_requested').length;
  const rentedProperties = properties.filter((p) => p.status === 'rented').length;

  // Active highlights
  const activeHighlights = properties.filter(
    (p) => p.featuredUntil && new Date(p.featuredUntil).getTime() > currentTimestamp
  );

  // Maximum allowed active properties based on plan (default free: 2)
  const maxAllowedProperties = profile?.accountType === 'imobiliaria' ? 50 : 2;

  const handleOpenNew = () => {
    setEditingProperty(null);
    setWizardOpen(true);
  };

  const handleEdit = (p: Property) => {
    setEditingProperty(p);
    setWizardOpen(true);
  };

  const handleToggleRented = async (p: Property) => {
    const nextStatus = p.status === 'rented' ? 'published' : 'rented';
    try {
      await saveProperty({
        ...p,
        status: nextStatus,
        availabilityUpdatedAt: new Date().toISOString(),
      });
      loadData();
    } catch (err) {
      alert('Falha ao atualizar status do imóvel.');
    }
  };

  // Trigger Highlight purchase via PIX
  const handleRequestHighlight = async (p: Property) => {
    const settings = await getPlatformSettings();
    const chargeId = generateUniqueId('chg-feat');
    const featReqId = generateUniqueId('req-feat');
    const now = new Date().toISOString();

    const chargePayload: Charge = {
      id: chargeId,
      ownerId: user.uid,
      ownerEmail: user.email || '',
      ownerName: profile?.displayName || 'Proprietário',
      type: 'featured',
      featuredRequestId: featReqId,
      propertyId: p.id,
      propertyTitleSnapshot: p.title,
      amountCents: settings.featuredPriceCents || 1990,
      currency: 'BRL',
      paymentMethod: 'pix',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'charges', chargeId), chargePayload);
      setPixDetails({
        title: `Destaque 7 Dias: ${p.title}`,
        amountCents: settings.featuredPriceCents || 1990,
        type: 'featured',
        targetId: p.id,
        chargeId,
      });
      setPixModalOpen(true);
      setPaymentSuccess(false);
      setPaymentReference('');
    } catch (err) {
      alert('Falha ao gerar cobrança de destaque.');
    }
  };

  // Trigger Plan Subscription purchase via PIX
  const handleRequestPlan = async (plan: Plan) => {
    const chargeId = generateUniqueId('chg-sub');
    const subId = generateUniqueId('sub');
    const now = new Date().toISOString();
    const expiresAt = calculateExpiryIso(30);

    const subPayload: Subscription = {
      id: subId,
      ownerId: user.uid,
      planId: plan.id,
      planNameSnapshot: plan.name,
      priceCentsSnapshot: plan.priceCents,
      maxPropertiesSnapshot: plan.maxActiveProperties,
      status: 'suspended',
      startedAt: now,
      expiresAt,
      renewalMode: 'manual',
      createdAt: now,
      updatedAt: now,
    };

    const chargePayload: Charge = {
      id: chargeId,
      ownerId: user.uid,
      ownerEmail: user.email || '',
      ownerName: profile?.displayName || 'Proprietário',
      type: 'subscription',
      subscriptionId: subId,
      amountCents: plan.priceCents,
      currency: 'BRL',
      paymentMethod: 'pix',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'subscriptions', subId), subPayload);
      await setDoc(doc(db, 'charges', chargeId), chargePayload);
      setPixDetails({
        title: `Assinatura: ${plan.name}`,
        amountCents: plan.priceCents,
        type: 'subscription',
        targetId: subId,
        chargeId,
      });
      setPixModalOpen(true);
      setPaymentSuccess(false);
      setPaymentReference('');
    } catch (err) {
      alert('Falha ao gerar pedido de plano.');
    }
  };

  const handleConfirmProofSent = async () => {
    if (!pixDetails) return;
    try {
      setPaymentSubmitting(true);
      const chargeRef = doc(db, 'charges', pixDetails.chargeId);
      await updateDoc(chargeRef, {
        externalReference: paymentReference.trim() || 'Comprovante informado pelo proprietário',
        updatedAt: new Date().toISOString(),
      });
      setPaymentSuccess(true);
      loadData();
    } catch (err) {
      alert('Falha ao registrar informação.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        readAt: new Date().toISOString(),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner / Owner Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#17324D] to-[#1E4369] p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-400/40">
              Painel do Proprietário
            </span>
            <span className="text-xs text-slate-300">
              {profile?.accountType === 'imobiliaria' ? 'Conta Imobiliária' : 'Conta Proprietário'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Olá, {profile?.displayName || 'Anunciante'}!
          </h1>
          <p className="text-xs text-slate-300">
            Gerencie seus imóveis em Presidente Dutra e receba contatos diretos no seu WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Cadastrar Novo Imóvel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Imóveis Cadastrados</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalProperties}</span>
            <span className="text-xs font-medium text-slate-400">
              Limite: {maxAllowedProperties}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${Math.min((totalProperties / maxAllowedProperties) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">Publicados no Portal</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{publishedProperties}</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Visíveis na busca pública</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase">Em Moderação</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{pendingProperties}</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Aguardando aprovação</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-blue-700 uppercase">Destaques Ativos</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">{activeHighlights.length}</span>
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Exposição máxima</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'properties'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Meus Imóveis ({properties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Planos e Destaques</span>
          </button>

          <button
            onClick={() => setActiveTab('charges')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'charges'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Histórico Financeiro ({charges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENT: PROPERTIES */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          {properties.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Nenhum imóvel cadastrado ainda</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Comece agora a anunciar seus imóveis para alugar em Presidente Dutra e região.
              </p>
              <button
                onClick={handleOpenNew}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Cadastrar Primeiro Imóvel</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((p) => {
                const isHighlight =
                  p.featuredUntil && new Date(p.featuredUntil).getTime() > currentTimestamp;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row gap-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-16/10 sm:aspect-square sm:w-36 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <Image
                        src={p.coverPhotoPath || (p.photoPaths && p.photoPaths[0]) || 'https://picsum.photos/seed/thumb/400/300'}
                        alt=""
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isHighlight && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                          <Sparkles className="h-2.5 w-2.5 fill-white" />
                          <span>Destaque</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${
                              STATUS_LABELS[p.status]?.color || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {STATUS_LABELS[p.status]?.label || p.status}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                              MODERATION_LABELS[p.moderationStatus]?.color || 'text-slate-600'
                            }`}
                          >
                            {MODERATION_LABELS[p.moderationStatus]?.label || p.moderationStatus}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                          {p.title}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {p.neighborhood}, {p.city} - {p.state}
                        </p>

                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-sm font-extrabold text-blue-700">
                            {formatBRL(p.rentAmountCents)}
                          </span>
                          <span className="text-[10px] text-slate-500">/mês</span>
                        </div>
                      </div>

                      {/* Rejection Alert if rejected */}
                      {p.moderationStatus === 'rejected' && (
                        <div className="mt-2 rounded-lg bg-rose-50 p-2 text-[11px] text-rose-800 border border-rose-200">
                          <p className="font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Motivo da Rejeição:</span>
                          </p>
                          <p className="line-clamp-2 mt-0.5">{p.moderationReason || 'Dados divergentes.'}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleToggleRented(p)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            p.status === 'rented'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {p.status === 'rented' ? 'Marcar Disponível' : 'Marcar Alugado'}
                        </button>

                        {!isHighlight && p.moderationStatus === 'approved' && (
                          <button
                            onClick={() => handleRequestHighlight(p)}
                            className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-600 transition shadow-xs"
                          >
                            <Sparkles className="h-3 w-3 fill-white" />
                            <span>Destacar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PLANS & MONETIZATION */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-blue-50/70 p-6 border border-blue-100">
            <h2 className="text-base font-bold text-blue-950">Potencialize seus Anúncios Imobiliários</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Nossos planos foram criados para atender desde proprietários individuais até imobiliárias e corretores atuantes em Presidente Dutra e em todo o Maranhão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((pl) => {
              const isCurrent =
                (pl.id === 'plano-gratuito' && profile?.accountType !== 'imobiliaria') ||
                (pl.id === 'plano-imobiliaria' && profile?.accountType === 'imobiliaria');

              return (
                <div
                  key={pl.id}
                  className={`flex flex-col justify-between rounded-3xl p-6 bg-white border transition-all ${
                    pl.id === 'plano-proprietario-pro'
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                      : 'border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-slate-900">{pl.name}</h3>
                      {pl.id === 'plano-proprietario-pro' && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          Recomendado
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 min-h-[32px]">{pl.description}</p>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">
                        {pl.priceCents === 0 ? 'Grátis' : formatBRL(pl.priceCents)}
                      </span>
                      {pl.priceCents > 0 && (
                        <span className="text-xs text-slate-500">/{pl.billingPeriod}</span>
                      )}
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {pl.enabledFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isCurrent ? (
                      <div className="w-full rounded-xl bg-slate-100 py-2.5 text-center text-xs font-bold text-slate-600">
                        Plano Atual
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRequestPlan(pl)}
                        className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                      >
                        Contratar via PIX
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHARGES */}
      {activeTab === 'charges' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Cobranças & Pagamentos Manuais</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe a conferência dos seus pagamentos via PIX ou transferência. Após a validação pela administração, seus benefícios são liberados imediatamente.
            </p>
          </div>

          {charges.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
              Nenhuma cobrança registrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Ref</th>
                    <th className="p-3">Descrição / Tipo</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Meio</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {charges.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {c.id.substring(0, 10)}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {c.type === 'subscription' ? 'Assinatura de Plano' : 'Destaque de Imóvel'}
                        {c.propertyTitleSnapshot && ` — ${c.propertyTitleSnapshot}`}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{formatBRL(c.amountCents)}</td>
                      <td className="p-3 uppercase text-slate-600 font-semibold">
                        {c.paymentMethod}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            c.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : c.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status === 'confirmed'
                            ? 'Confirmado'
                            : c.status === 'pending'
                            ? 'Aguardando Conferência'
                            : c.status === 'rejected'
                            ? 'Rejeitado'
                            : c.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{formatDateBR(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Notificações do Sistema</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Atualizações sobre aprovação de anúncios, confirmação de pagamentos e alertas importantes.
            </p>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
              Você não possui novas notificações no momento.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  className={`rounded-2xl p-4 border transition cursor-pointer flex items-start gap-3 ${
                    n.read
                      ? 'bg-white border-slate-200'
                      : 'bg-blue-50/60 border-blue-200 shadow-xs'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                      n.type.includes('approved') || n.type.includes('confirmed')
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[10px] text-slate-400">{formatDateBR(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PIX Payment Modal */}
      {pixModalOpen && pixDetails && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pagamento via PIX</h3>
                  <p className="text-[11px] text-slate-500">{pixDetails.title}</p>
                </div>
              </div>
              <button
                onClick={() => setPixModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Comprovante Enviado para Conferência!</h4>
                <p className="text-xs text-slate-500">
                  Nosso administrador irá verificar o recebimento e os benefícios serão liberados em sua conta.
                </p>
                <button
                  onClick={() => setPixModalOpen(false)}
                  className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-center">
                  <span className="text-xs text-emerald-800 font-medium">Valor a Pagar:</span>
                  <div className="text-2xl font-black text-emerald-900">
                    {formatBRL(pixDetails.amountCents)}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Chave PIX (Telefone):</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('99984503210');
                        setPixCopied(true);
                        setTimeout(() => setPixCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 font-bold text-blue-600 hover:underline"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{pixCopied ? 'Copiado!' : 'Copiar Chave'}</span>
                    </button>
                  </div>
                  <p className="font-mono font-bold text-slate-800 text-sm">(99) 98450-3210</p>
                  <p className="text-[11px] text-slate-500">Titular: AlugaFácil Pro LTDA | Banco do Brasil</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de autenticação ou comprovante do PIX
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ex: E12345678... ou Nome de quem transferiu"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Informe a referência para agilizar a conferência manual pela administração.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPixModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleConfirmProofSent}
                    disabled={paymentSubmitting}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {paymentSubmitting ? 'Gravando...' : 'Informar Pagamento Realizado'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Creation / Edit Wizard Modal */}
      <PropertyWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialProperty={editingProperty}
        onPropertySaved={() => loadData()}
      />
    </div>
  );
};
