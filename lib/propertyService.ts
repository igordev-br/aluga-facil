import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Property,
  PropertyEvent,
  PropertyEventType,
  Report,
  Charge,
  Subscription,
  Plan,
  PlatformSetting,
  InAppNotification,
  AuditLog,
} from '@/types';
import {
  INITIAL_PROPERTIES,
  INITIAL_PLANS,
  INITIAL_PLATFORM_SETTINGS,
} from './seedData';

// Fetch published properties for public search
export async function getPublishedProperties(filters?: {
  city?: string;
  neighborhood?: string;
  propertyType?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  bedrooms?: number;
  furnished?: boolean;
  featuredOnly?: boolean;
}): Promise<Property[]> {
  try {
    const propsCol = collection(db, 'properties');
    const q = query(
      propsCol,
      where('status', 'in', ['published', 'rented']),
      where('moderationStatus', '==', 'approved')
    );
    const snap = await getDocs(q);

    let list: Property[] = [];
    if (!snap.empty) {
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<Property, 'id'>) });
      });
    } else {
      // Seed fallback if Firestore has not been seeded yet
      list = [...INITIAL_PROPERTIES];
    }

    // Apply client filters safely
    if (filters) {
      if (filters.city && filters.city !== 'Todas as Cidades') {
        list = list.filter(
          (p) => p.city.toLowerCase() === filters.city!.toLowerCase()
        );
      }
      if (filters.neighborhood && filters.neighborhood.trim()) {
        list = list.filter((p) =>
          p.neighborhood.toLowerCase().includes(filters.neighborhood!.toLowerCase())
        );
      }
      if (filters.propertyType && filters.propertyType !== 'todos') {
        list = list.filter((p) => p.propertyType === filters.propertyType);
      }
      if (typeof filters.minPriceCents === 'number' && filters.minPriceCents > 0) {
        list = list.filter((p) => p.rentAmountCents >= filters.minPriceCents!);
      }
      if (typeof filters.maxPriceCents === 'number' && filters.maxPriceCents > 0) {
        list = list.filter((p) => p.rentAmountCents <= filters.maxPriceCents!);
      }
      if (typeof filters.bedrooms === 'number' && filters.bedrooms > 0) {
        list = list.filter((p) => (p.bedrooms || 0) >= filters.bedrooms!);
      }
      if (filters.furnished === true) {
        list = list.filter((p) => p.furnished === true);
      }
      if (filters.featuredOnly === true) {
        const now = new Date().toISOString();
        list = list.filter((p) => p.featuredUntil && p.featuredUntil > now);
      }
    }

    return list;
  } catch (err) {
    console.warn('Could not fetch from Firestore, falling back to cached seed data:', err);
    let list = [...INITIAL_PROPERTIES];
    if (filters?.city && filters.city !== 'Todas as Cidades') {
      list = list.filter((p) => p.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters?.propertyType && filters.propertyType !== 'todos') {
      list = list.filter((p) => p.propertyType === filters.propertyType);
    }
    return list;
  }
}

// Fetch single property by ID
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const docRef = doc(db, 'properties', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Property, 'id'>) };
    }
    // Fallback search in seed
    const found = INITIAL_PROPERTIES.find((p) => p.id === id);
    return found || null;
  } catch (err) {
    console.warn('Fallback fetching property from seed:', err);
    return INITIAL_PROPERTIES.find((p) => p.id === id) || null;
  }
}

// Fetch properties owned by a specific owner
export async function getOwnerProperties(ownerId: string): Promise<Property[]> {
  try {
    const propsCol = collection(db, 'properties');
    const q = query(propsCol, where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    const list: Property[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<Property, 'id'>) });
    });
    return list;
  } catch (err) {
    console.error('Error fetching owner properties:', err);
    return [];
  }
}

// Create or update property
export async function saveProperty(
  propertyData: Omit<Property, 'id'> & { id?: string }
): Promise<string> {
  const isUpdate = !!propertyData.id;
  const targetId = propertyData.id || `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const finalPayload: Property = {
    ...propertyData,
    id: targetId,
    createdAt: propertyData.createdAt || now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'properties', targetId);
    await setDoc(docRef, finalPayload, { merge: true });
    return targetId;
  } catch (err) {
    handleFirestoreError(
      err,
      isUpdate ? OperationType.UPDATE : OperationType.CREATE,
      `properties/${targetId}`
    );
  }
}

// Record an analytics event (view, whatsapp_click, share, report)
export async function recordPropertyEvent(
  propertyId: string,
  eventType: PropertyEventType,
  ownerId?: string
): Promise<void> {
  try {
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const eventRef = doc(db, 'propertyEvents', eventId);
    const eventPayload: PropertyEvent = {
      propertyId,
      eventType,
      ownerId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(eventRef, eventPayload);
  } catch (err) {
    // Non-blocking for UI
    console.warn('Analytics event record skipped:', err);
  }
}

// Submit a listing report
export async function submitReport(
  propertyId: string,
  category: Report['category'],
  description: string,
  propertyTitle?: string,
  reporterContact?: string
): Promise<void> {
  const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const reportData: Report = {
    id: reportId,
    propertyId,
    propertyTitle,
    category,
    description: description.trim(),
    reporterContact: reporterContact?.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    const reportRef = doc(db, 'reports', reportId);
    await setDoc(reportRef, reportData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
  }
}

// Fetch platform plans
export async function getPlans(): Promise<Plan[]> {
  try {
    const plansCol = collection(db, 'plans');
    const snap = await getDocs(plansCol);
    if (!snap.empty) {
      const plans: Plan[] = [];
      snap.forEach((d) => plans.push({ id: d.id, ...(d.data() as Omit<Plan, 'id'>) }));
      return plans;
    }
    return INITIAL_PLANS;
  } catch {
    return INITIAL_PLANS;
  }
}

// Fetch platform settings
export async function getPlatformSettings(): Promise<PlatformSetting> {
  try {
    const settingsRef = doc(db, 'platformSettings', 'global-settings');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<PlatformSetting, 'id'>) };
    }
    return INITIAL_PLATFORM_SETTINGS;
  } catch {
    return INITIAL_PLATFORM_SETTINGS;
  }
}

// Seed initial database records in Firestore if empty
export async function seedInitialDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Seed Platform Settings
    const settingRef = doc(db, 'platformSettings', 'global-settings');
    await setDoc(settingRef, INITIAL_PLATFORM_SETTINGS, { merge: true });

    // 2. Seed Plans
    for (const plan of INITIAL_PLANS) {
      await setDoc(doc(db, 'plans', plan.id), plan, { merge: true });
    }

    // 3. Seed Properties
    for (const prop of INITIAL_PROPERTIES) {
      await setDoc(doc(db, 'properties', prop.id), prop, { merge: true });
    }

    return {
      success: true,
      message: 'Banco de dados sincronizado com imóveis reais, planos e configurações de Presidente Dutra e Maranhão!',
    };
  } catch (err) {
    console.error('Seed error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Falha ao sincronizar dados',
    };
  }
}
