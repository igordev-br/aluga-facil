'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShieldAlert,
  Users,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Eye,
  Check,
  X,
  CreditCard,
  Flag,
  Settings,
  History,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Property, Charge, UserProfile, Report, AuditLog } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatBRL, formatDateBR, formatDateTimeBR, generateReferenceCode, STATUS_LABELS } from '@/lib/formatters';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, query, orderBy, limit } from 'firebase/firestore';
import {
  INITIAL_PROPERTIES,
  INITIAL_CHARGES,
  INITIAL_USERS,
  INITIAL_REPORTS,
  INITIAL_AUDIT_LOGS,
} from '@/lib/seedData';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'moderation' | 'payments' | 'users' | 'reports' | 'audit' | 'settings'>('moderation');

  const [properties, setProperties] = useState<Property[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminTimestamp] = useState(() => Date.now());
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Moderation preview & rejection dialog
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [propertyToReject, setPropertyToReject] = useState<Property | null>(null);

  // User suspension dialog
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Payment confirmation dialog
  const [confirmChargeModal, setConfirmChargeModal] = useState<Charge | null>(null);
  const [chargeNotes, setChargeNotes] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const loadAdminData = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    let active = true;
    if (isAdmin) {
      (async () => {
        try {
          const propsCol = collection(db, 'properties');
          const pSnap = await getDocs(propsCol).catch(() => null);
          if (!active) return;
          const pList: Property[] = [];
          if (pSnap && !pSnap.empty) {
            pSnap.forEach((d) => pList.push({ id: d.id, ...(d.data() as Omit<Property, 'id'>) }));
          }
          setProperties(pList.length > 0 ? pList : INITIAL_PROPERTIES);

          const chargesCol = collection(db, 'charges');
          const cSnap = await getDocs(chargesCol).catch(() => null);
          if (!active) return;
          const cList: Charge[] = [];
          if (cSnap && !cSnap.empty) {
            cSnap.forEach((d) => cList.push({ id: d.id, ...(d.data() as Omit<Charge, 'id'>) }));
          }
          setCharges(cList.length > 0 ? cList : INITIAL_CHARGES);

          const usersCol = collection(db, 'users');
          const uSnap = await getDocs(usersCol).catch(() => null);
          if (!active) return;
          const uList: UserProfile[] = [];
          if (uSnap && !uSnap.empty) {
            uSnap.forEach((d) => uList.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
          }
          setUsers(uList.length > 0 ? uList : INITIAL_USERS);

          const reportsCol = collection(db, 'reports');
          const rSnap = await getDocs(reportsCol).catch(() => null);
          if (!active) return;
          const rList: Report[] = [];
          if (rSnap && !rSnap.empty) {
            rSnap.forEach((d) => rList.push({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }));
          }
          setReports(rList.length > 0 ? rList : INITIAL_REPORTS);

          const logsCol = collection(db, 'auditLogs');
          const lSnap = await getDocs(logsCol).catch(() => null);
          if (!active) return;
          const lList: AuditLog[] = [];
          if (lSnap && !lSnap.empty) {
            lSnap.forEach((d) => lList.push({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) }));
          }
          const finalLogs = lList.length > 0 ? lList : INITIAL_AUDIT_LOGS;
          finalLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAuditLogs(finalLogs);
        } catch (err) {
          console.warn('Error loading admin data, using fallback seed:', err);
          if (active) {
            setProperties(INITIAL_PROPERTIES);
            setCharges(INITIAL_CHARGES);
            setUsers(INITIAL_USERS);
            setReports(INITIAL_REPORTS);
            setAuditLogs(INITIAL_AUDIT_LOGS);
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [isAdmin, refreshTrigger]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Administrativo Restrito</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          Esta área é restrita a administradores autorizados do AlugaFácil Pro ({user?.email || 'Visitante'}).
        </p>
      </div>
    );
  }

  // KPIs
  const pendingModeration = properties.filter((p) => p.moderationStatus === 'pending');
  const publishedCount = properties.filter((p) => p.status === 'published' && p.moderationStatus === 'approved').length;
  const pendingCharges = charges.filter((c) => c.status === 'pending');
  const confirmedRevenueCents = charges
    .filter((c) => c.status === 'confirmed')
    .reduce((sum, c) => sum + (c.amountCents || 0), 0);
  const activeHighlightsCount = properties.filter(
    (p) => p.featuredUntil && new Date(p.featuredUntil).getTime() > adminTimestamp
  ).length;

  // Moderation action
  const handleModerate = async (
    propertyId: string,
    decision: 'approve' | 'reject' | 'request_correction' | 'suspend',
    reason?: string
  ) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderate_property',
          actorEmail: user?.email,
          actorUid: user?.uid,
          payload: { propertyId, decision, reason },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na moderação');
      setFeedbackMsg({ type: 'success', text: `Anúncio moderado: ${decision}` });
      setShowRejectModal(false);
      setPropertyToReject(null);
      setRejectReason('');
      loadAdminData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Falha' });
    } finally {
      setActionLoading(false);
    }
  };

  // Payment confirmation action
  const handleConfirmPayment = async () => {
    if (!confirmChargeModal) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_payment',
          actorEmail: user?.email,
          actorUid: user?.uid,
          payload: { chargeId: confirmChargeModal.id, notes: chargeNotes },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao confirmar');
      setFeedbackMsg({ type: 'success', text: 'Pagamento confirmado e benefícios ativados!' });
      setConfirmChargeModal(null);
      setChargeNotes('');
      loadAdminData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Falha' });
    } finally {
      setActionLoading(false);
    }
  };

  // Payment reject action
  const handleRejectPayment = async (chargeId: string, reason?: string) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_payment',
          actorEmail: user?.email,
          actorUid: user?.uid,
          payload: { chargeId, reason: reason || 'Comprovante não identificado' },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setFeedbackMsg({ type: 'success', text: 'Cobrança marcada como rejeitada.' });
      loadAdminData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Falha' });
    } finally {
      setActionLoading(false);
    }
  };

  // Payment refund action
  const handleRefundPayment = async (chargeId: string) => {
    if (!confirm('Deseja realmente marcar esta cobrança como Estornada? Somente utilize esta opção se o valor já foi devolvido ao proprietário.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund_payment',
          actorEmail: user?.email,
          actorUid: user?.uid,
          payload: { chargeId, refundNotes: 'Estorno comprovado pela administração' },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setFeedbackMsg({ type: 'success', text: 'Cobrança atualizada para Estornada.' });
      loadAdminData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Falha' });
    } finally {
      setActionLoading(false);
    }
  };

  // User suspension toggle
  const handleToggleUserSuspension = async () => {
    if (!userToSuspend) return;
    const nextStatus = userToSuspend.accountStatus === 'suspended' ? 'active' : 'suspended';
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_user_status',
          actorEmail: user?.email,
          actorUid: user?.uid,
          payload: {
            targetUid: userToSuspend.uid,
            newAccountStatus: nextStatus,
            reason: suspendReason,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setFeedbackMsg({ type: 'success', text: `Usuário ${nextStatus === 'suspended' ? 'suspenso' : 'reativado'}.` });
      setShowSuspendModal(false);
      setUserToSuspend(null);
      setSuspendReason('');
      loadAdminData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Falha' });
    } finally {
      setActionLoading(false);
    }
  };

  // Seed trigger
  const handleSeedDatabase = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'seed_data',
          actorEmail: user?.email,
          actorUid: user?.uid,
          payload: {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar');
      setFeedbackMsg({ type: 'success', text: 'Banco sincronizado com imóveis reais de Presidente Dutra!' });
      loadAdminData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Falha' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 to-[#17324D] p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300 ring-1 ring-rose-400/40">
              Painel de Controle Central
            </span>
            <span className="text-xs text-slate-300">Administrador Master</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Administração AlugaFácil Pro
          </h1>
          <p className="text-xs text-slate-300">
            Moderação de anúncios, gestão de pagamentos via PIX, controle de usuários e auditoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDatabase}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer"
            title="Sincronizar base de imóveis e planos de Presidente Dutra no Firestore"
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-300" />
            <span>Sincronizar Dados Dutra</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-medium border animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-amber-700 uppercase">Moderação Pendente</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{pendingModeration.length}</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Anúncios para revisar</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Imóveis Ativos</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{publishedCount}</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Disponíveis no portal</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-blue-700 uppercase">PIX Pendentes</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">{pendingCharges.length}</span>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Conferência manual</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-700 uppercase">Receita Confirmada</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-black text-slate-900">{formatBRL(confirmedRevenueCents)}</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Efetivamente recebida</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-purple-700 uppercase">Usuários Cadastrados</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-700">{users.length}</span>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Proprietários e corretores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'moderation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Fila de Moderação ({pendingModeration.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Conferência de PIX ({pendingCharges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Proprietários & Usuários ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flag className="h-4 w-4" />
            <span>Denúncias ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Auditoria ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MODERAÇÃO */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fila de Aprovação de Anúncios</h2>
              <p className="text-xs text-slate-500">
                Todo anúncio submetido por proprietários deve ser conferido antes de ir ao ar.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Total na fila: {pendingModeration.length}
            </span>
          </div>

          {pendingModeration.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
              Nenhum anúncio aguardando moderação no momento. Todos os anúncios foram revisados!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingModeration.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start justify-between gap-4"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <Image
                        src={p.coverPhotoPath || (p.photoPaths && p.photoPaths[0]) || 'https://picsum.photos/seed/thumb/300/200'}
                        alt=""
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
                          {p.propertyType}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {generateReferenceCode(p.id)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                      <p className="text-xs text-slate-500">
                        {p.neighborhood}, {p.city} - {p.state} • Aluguel: <strong className="text-blue-700">{formatBRL(p.rentAmountCents)}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Contato: {p.publicContactName} ({p.publicContactPhone}) • Submetido em {formatDateBR(p.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleModerate(p.id, 'approve')}
                      disabled={actionLoading}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      <Check className="h-4 w-4" />
                      <span>Aprovar</span>
                    </button>

                    <button
                      onClick={() => {
                        setPropertyToReject(p);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading}
                      className="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition"
                    >
                      <X className="h-4 w-4" />
                      <span>Rejeitar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL PAYMENTS / PIX */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Conferência de Pagamentos Manuais (PIX / TED)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ao clicar em <strong>Confirmar</strong>, o sistema ativa a assinatura ou o destaque de 7 dias atomicamente no banco de dados e notifica o proprietário.
            </p>
          </div>

          {charges.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
              Nenhuma cobrança registrada.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Ref Cobrança</th>
                    <th className="p-3">Proprietário</th>
                    <th className="p-3">Tipo / Item</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Comprovante / Ref</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {charges.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {c.id.substring(0, 12)}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{c.ownerName || 'Proprietário'}</p>
                        <p className="text-[10px] text-slate-400">{c.ownerEmail}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-800">
                          {c.type === 'subscription' ? 'Assinatura' : 'Destaque'}
                        </span>
                        {c.propertyTitleSnapshot && (
                          <p className="text-[10px] text-slate-500 line-clamp-1">{c.propertyTitleSnapshot}</p>
                        )}
                      </td>
                      <td className="p-3 font-black text-slate-900">{formatBRL(c.amountCents)}</td>
                      <td className="p-3 text-slate-600">
                        {c.externalReference || 'Aguardando informante'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            c.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : c.status === 'refunded'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status === 'confirmed'
                            ? 'Confirmado'
                            : c.status === 'pending'
                            ? 'Pendente'
                            : c.status === 'refunded'
                            ? 'Estornado'
                            : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmChargeModal(c);
                                  setChargeNotes('');
                                }}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleRejectPayment(c.id)}
                                className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}

                          {c.status === 'confirmed' && (
                            <button
                              onClick={() => handleRefundPayment(c.id)}
                              className="rounded-lg border border-purple-300 bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100"
                            >
                              Registrar Estorno
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Proprietários & Anunciantes Cadastrados</h2>
              <p className="text-xs text-slate-500">
                Gerencie contas, verifique e suspenda acessos fraudulentos conforme os critérios de segurança.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Nome / Anunciante</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Tipo de Conta</th>
                  <th className="p-3">Situação</th>
                  <th className="p-3">Cadastrado em</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{u.displayName}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 capitalize">
                        {u.accountType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          u.accountStatus === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.accountStatus === 'active' ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{formatDateBR(u.createdAt)}</td>
                    <td className="p-3 text-right">
                      {u.accountType !== 'admin' && (
                        <button
                          onClick={() => {
                            setUserToSuspend(u);
                            setSuspendReason('');
                            setShowSuspendModal(true);
                          }}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            u.accountStatus === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.accountStatus === 'active' ? 'Suspender' : 'Reativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DENÚNCIAS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Denúncias Enviadas por Visitantes</h2>
            <p className="text-xs text-slate-500">
              Análise de suspeitas de golpes, valores falsos ou imóveis já alugados.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
              Nenhuma denúncia registrada até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase">
                      Categoria: {r.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDateBR(r.createdAt)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Imóvel: {r.propertyTitle || r.propertyId}</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    &ldquo;{r.description}&rdquo;
                  </p>
                  {r.reporterContact && (
                    <p className="text-[11px] text-slate-500">Contato do Denunciante: {r.reporterContact}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleModerate(r.propertyId, 'suspend', 'Suspenso preventivamente após denúncia')}
                      className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700"
                    >
                      Suspender Imóvel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDITORIA */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Trilha de Auditoria Administrativa</h2>
            <p className="text-xs text-slate-500">
              Registros imutáveis de ações críticas executadas por administradores no sistema.
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
              Nenhum registro de auditoria disponível.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Administrador</th>
                    <th className="p-3">Ação</th>
                    <th className="p-3">Entidade</th>
                    <th className="p-3">ID do Alvo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{formatDateTimeBR(l.createdAt)}</td>
                      <td className="p-3 font-semibold text-slate-800">{l.actorEmail || l.actorUid}</td>
                      <td className="p-3 font-bold text-blue-700">{l.action}</td>
                      <td className="p-3 uppercase text-slate-600">{l.entityType}</td>
                      <td className="p-3 text-slate-500 truncate max-w-[120px]">{l.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal Dialog */}
      {showRejectModal && propertyToReject && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Rejeitar Anúncio com Justificativa</h3>
            <p className="text-xs text-slate-500">
              Informe ao proprietário o motivo da rejeição para que ele possa corrigir o anúncio:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Ex: Fotos com marca d'água de outro portal / Endereço inconsistente / Preço divergente"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleModerate(propertyToReject.id, 'reject', rejectReason)}
                disabled={!rejectReason.trim() || actionLoading}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation of Payment Modal */}
      {confirmChargeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirmar Recebimento de Pagamento</h3>
            <div className="rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p>Valor: <strong className="text-emerald-900 text-sm">{formatBRL(confirmChargeModal.amountCents)}</strong></p>
              <p>Proprietário: {confirmChargeModal.ownerName} ({confirmChargeModal.ownerEmail})</p>
              <p>Item: {confirmChargeModal.type === 'subscription' ? 'Assinatura de Plano' : 'Destaque de Imóvel'}</p>
              {confirmChargeModal.externalReference && (
                <p>Comprovante informado: <strong className="font-mono">{confirmChargeModal.externalReference}</strong></p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Você verificou o saldo no extrato bancário ou PIX oficial do AlugaFácil Pro? A confirmação ativará o plano/destaque na hora.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anotações internas / Código do comprovante (opcional)
              </label>
              <input
                type="text"
                value={chargeNotes}
                onChange={(e) => setChargeNotes(e.target.value)}
                placeholder="Ex: Conferido via app BB às 15:30"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmChargeModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={actionLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
              >
                {actionLoading ? 'Processando...' : 'Validar e Ativar Benefício'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend user modal */}
      {showSuspendModal && userToSuspend && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {userToSuspend.accountStatus === 'active' ? 'Suspender Usuário' : 'Reativar Usuário'}
            </h3>
            <p className="text-xs text-slate-600">
              Usuário: <strong>{userToSuspend.displayName}</strong> ({userToSuspend.email})
            </p>
            {userToSuspend.accountStatus === 'active' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificativa obrigatória da suspensão
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  placeholder="Ex: Violação das regras de anúncio, múltiplos relatos de golpes"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  required
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleUserSuspension}
                disabled={userToSuspend.accountStatus === 'active' && !suspendReason.trim()}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${
                  userToSuspend.accountStatus === 'active' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
