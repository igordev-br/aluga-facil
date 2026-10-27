import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import {
  INITIAL_PLANS,
  INITIAL_PLATFORM_SETTINGS,
  INITIAL_PROPERTIES,
} from '@/lib/seedData';

const ADMIN_EMAIL = 'igorwebdesign86@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload, actorEmail, actorUid } = body;

    // Verify basic actor info
    if (!actorEmail) {
      return NextResponse.json({ error: 'Identificação necessária' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // 1. CONFIRM PAYMENT
    if (action === 'confirm_payment') {
      const { chargeId, notes } = payload;
      if (!chargeId) {
        return NextResponse.json({ error: 'Charge ID não fornecido' }, { status: 400 });
      }

      const chargeRef = doc(db, 'charges', chargeId);
      const chargeSnap = await getDoc(chargeRef);

      if (!chargeSnap.exists()) {
        return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
      }

      const charge = chargeSnap.data();

      // Check idempotency: If already confirmed, don't re-activate
      if (charge.status === 'confirmed') {
        return NextResponse.json({ message: 'Cobrança já foi confirmada anteriormente.' });
      }

      // If subscription charge
      if (charge.type === 'subscription' && charge.subscriptionId) {
        const subRef = doc(db, 'subscriptions', charge.subscriptionId);
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
        await updateDoc(subRef, {
          status: 'active',
          startedAt: now,
          expiresAt,
          updatedAt: now,
        });

        // Notify owner
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          recipientId: charge.ownerId,
          type: 'payment_confirmed',
          title: 'Pagamento Confirmado! Assinatura Ativada',
          message: `Seu pagamento foi confirmado por nossa equipe. O seu plano foi ativado com sucesso até ${new Date(expiresAt).toLocaleDateString('pt-BR')}.`,
          read: false,
          relatedEntityId: charge.subscriptionId,
          relatedEntityType: 'subscription',
          createdAt: now,
        });
      }

      // If featured charge
      if (charge.type === 'featured' && charge.propertyId) {
        const durationDays = charge.durationDays || 7;
        const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();

        const propRef = doc(db, 'properties', charge.propertyId);
        await updateDoc(propRef, {
          featuredUntil: expiresAt,
          updatedAt: now,
        });

        if (charge.featuredRequestId) {
          const featRef = doc(db, 'featuredRequests', charge.featuredRequestId);
          await updateDoc(featRef, {
            status: 'active',
            startsAt: now,
            expiresAt,
            updatedAt: now,
          });
        }

        // Notify owner
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          recipientId: charge.ownerId,
          type: 'highlight_active',
          title: 'Destaque Ativado para seu Imóvel!',
          message: `Seu pagamento foi confirmado! O anúncio "${charge.propertyTitleSnapshot || 'Imóvel'}" está destacado no topo do portal pelos próximos ${durationDays} dias.`,
          read: false,
          relatedEntityId: charge.propertyId,
          relatedEntityType: 'property',
          createdAt: now,
        });
      }

      // Update charge record
      await updateDoc(chargeRef, {
        status: 'confirmed',
        confirmedAt: now,
        confirmedBy: actorUid || actorEmail,
        notes: notes || charge.notes || 'Confirmado via painel administrativo',
        updatedAt: now,
      });

      // Audit log
      const logRef = doc(collection(db, 'auditLogs'));
      await setDoc(logRef, {
        id: logRef.id,
        actorUid: actorUid || 'admin',
        actorEmail,
        action: 'CONFIRM_MANUAL_PAYMENT',
        entityType: 'charge',
        entityId: chargeId,
        metadata: { chargeAmountCents: charge.amountCents, type: charge.type },
        createdAt: now,
      });

      return NextResponse.json({ success: true, message: 'Pagamento confirmado e benefícios ativados com sucesso!' });
    }

    // 2. REJECT PAYMENT
    if (action === 'reject_payment') {
      const { chargeId, reason } = payload;
      const chargeRef = doc(db, 'charges', chargeId);
      const chargeSnap = await getDoc(chargeRef);
      if (!chargeSnap.exists()) {
        return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
      }

      const charge = chargeSnap.data();
      await updateDoc(chargeRef, {
        status: 'rejected',
        notes: reason || 'Pagamento não identificado ou comprovante inválido',
        updatedAt: now,
      });

      // Notify owner
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        recipientId: charge.ownerId,
        type: 'payment_rejected',
        title: 'Pagamento Não Confirmado',
        message: `Não conseguimos validar o pagamento da cobrança. Motivo: ${reason || 'Comprovante não identificado.'}. Entre em contato com o suporte caso haja divergência.`,
        read: false,
        relatedEntityId: chargeId,
        relatedEntityType: 'charge',
        createdAt: now,
      });

      return NextResponse.json({ success: true, message: 'Cobrança marcada como rejeitada.' });
    }

    // 3. REFUND PAYMENT (ESTORNADO)
    if (action === 'refund_payment') {
      const { chargeId, refundNotes } = payload;
      const chargeRef = doc(db, 'charges', chargeId);
      await updateDoc(chargeRef, {
        status: 'refunded',
        notes: refundNotes || 'Valor devidamente estornado ao proprietário',
        updatedAt: now,
      });

      return NextResponse.json({ success: true, message: 'Cobrança atualizada para Estornada.' });
    }

    // 4. MODERATE PROPERTY
    if (action === 'moderate_property') {
      const { propertyId, decision, reason } = payload;
      const propRef = doc(db, 'properties', propertyId);
      const propSnap = await getDoc(propRef);

      if (!propSnap.exists()) {
        return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
      }

      const prop = propSnap.data();

      let newStatus = prop.status;
      let newModerationStatus = prop.moderationStatus;

      if (decision === 'approve') {
        newStatus = 'published';
        newModerationStatus = 'approved';
      } else if (decision === 'reject') {
        newStatus = 'draft';
        newModerationStatus = 'rejected';
      } else if (decision === 'request_correction') {
        newStatus = 'draft';
        newModerationStatus = 'correction_requested';
      } else if (decision === 'suspend') {
        newStatus = 'unavailable';
        newModerationStatus = 'rejected';
      }

      await updateDoc(propRef, {
        status: newStatus,
        moderationStatus: newModerationStatus,
        moderationReason: reason || '',
        moderatedBy: actorEmail,
        moderatedAt: now,
        publishedAt: decision === 'approve' ? now : prop.publishedAt || null,
        updatedAt: now,
      });

      // Notify owner
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        recipientId: prop.ownerId,
        type: decision === 'approve' ? 'property_approved' : 'property_rejected',
        title:
          decision === 'approve'
            ? 'Anúncio Aprovado e Publicado!'
            : 'Moderação de Anúncio',
        message:
          decision === 'approve'
            ? `Seu imóvel "${prop.title}" foi aprovado e já está visível para milhares de visitantes em Presidente Dutra e região!`
            : `Houve uma atualização no status do seu anúncio "${prop.title}". Motivo: ${reason || 'Consulte os detalhes no painel.'}`,
        read: false,
        relatedEntityId: propertyId,
        relatedEntityType: 'property',
        createdAt: now,
      });

      // Audit Log
      const logRef = doc(collection(db, 'auditLogs'));
      await setDoc(logRef, {
        id: logRef.id,
        actorUid: actorUid || 'admin',
        actorEmail,
        action: `MODERATE_PROPERTY_${decision.toUpperCase()}`,
        entityType: 'property',
        entityId: propertyId,
        metadata: { decision, reason },
        createdAt: now,
      });

      return NextResponse.json({ success: true, message: `Imóvel atualizado: ${decision}` });
    }

    // 5. TOGGLE USER ACCOUNT STATUS
    if (action === 'toggle_user_status') {
      const { targetUid, newAccountStatus, reason } = payload;
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, {
        accountStatus: newAccountStatus,
        suspensionReason: reason || '',
        updatedAt: now,
      });

      return NextResponse.json({ success: true, message: `Status do usuário atualizado para ${newAccountStatus}` });
    }

    // 6. SEED DATA
    if (action === 'seed_data') {
      // 1. Settings
      await setDoc(doc(db, 'platformSettings', 'global-settings'), INITIAL_PLATFORM_SETTINGS, { merge: true });
      // 2. Plans
      for (const p of INITIAL_PLANS) {
        await setDoc(doc(db, 'plans', p.id), p, { merge: true });
      }
      // 3. Properties
      for (const prop of INITIAL_PROPERTIES) {
        await setDoc(doc(db, 'properties', prop.id), prop, { merge: true });
      }

      return NextResponse.json({ success: true, message: 'Dados de Presidente Dutra sincronizados com sucesso!' });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
