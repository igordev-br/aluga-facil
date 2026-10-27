export type AccountType = 'proprietario' | 'imobiliaria' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phonePrivate?: string;
  publicPhone?: string;
  accountType: AccountType;
  accountStatus: AccountStatus;
  suspensionReason?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  acceptedTermsVersion?: string;
  acceptedPrivacyVersion?: string;
  photoURL?: string;
}

export type PropertyType =
  | 'casa'
  | 'apartamento'
  | 'kitnet'
  | 'comercial'
  | 'sala'
  | 'galpao'
  | 'terreno'
  | 'chacara';

export type PropertyPurpose = 'residencial' | 'comercial';
export type PropertyStatus = 'draft' | 'pending' | 'published' | 'rented' | 'unavailable' | 'archived';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'correction_requested';

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  slug?: string;
  propertyType: PropertyType;
  purpose: PropertyPurpose;
  description: string;
  city: string;
  state: string;
  neighborhood: string;
  publicAddress?: string;
  privateAddress?: string;
  areaM2?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  furnished?: boolean;
  amenities: string[];
  rentAmountCents: number;
  condominiumAmountCents?: number;
  iptuAmountCents?: number;
  additionalFees?: string;
  photoPaths: string[];
  coverPhotoPath?: string;
  publicContactName: string;
  publicContactPhone: string;
  whatsappConsent: boolean;
  status: PropertyStatus;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  featuredUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  availabilityUpdatedAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  billingPeriod: 'mensal' | 'trimestral' | 'anual';
  maxActiveProperties: number;
  enabledFeatures: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'suspended' | 'canceled';

export interface Subscription {
  id: string;
  ownerId: string;
  planId: string;
  planNameSnapshot: string;
  priceCentsSnapshot: number;
  maxPropertiesSnapshot: number;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  renewalMode: 'manual';
  createdAt: string;
  updatedAt: string;
  canceledAt?: string;
}

export type PaymentMethod = 'pix' | 'ted' | 'dinheiro' | 'outro';
export type ChargeStatus = 'pending' | 'confirmed' | 'rejected' | 'canceled' | 'refunded';
export type ChargeType = 'subscription' | 'featured';

export interface Charge {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  subscriptionId?: string;
  featuredRequestId?: string;
  propertyId?: string;
  propertyTitleSnapshot?: string;
  type: ChargeType;
  amountCents: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: ChargeStatus;
  dueAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  externalReference?: string;
  notes?: string;
  receiptUrl?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedRequest {
  id: string;
  ownerId: string;
  propertyId: string;
  propertyTitle?: string;
  durationDays: number;
  priceCentsSnapshot: number;
  status: 'pending_payment' | 'active' | 'expired' | 'canceled';
  paymentChargeId?: string;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyEventType = 'view' | 'whatsapp_click' | 'share' | 'report';

export interface PropertyEvent {
  id?: string;
  propertyId: string;
  ownerId?: string;
  eventType: PropertyEventType;
  sessionHash?: string;
  createdAt: string;
}

export type ReportCategory = 'fake' | 'already_rented' | 'wrong_price' | 'inappropriate' | 'offensive' | 'other';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  reporterId?: string;
  reporterContact?: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  resolution?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
}

export type NotificationType =
  | 'property_approved'
  | 'property_rejected'
  | 'payment_confirmed'
  | 'payment_rejected'
  | 'highlight_active'
  | 'subscription_expiring'
  | 'system_alert';

export interface InAppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformSetting {
  id: string;
  cities: string[];
  categories: string[];
  featuredPriceCents: number;
  featuredDurationDays: number;
  termsVersion: string;
  privacyVersion: string;
  supportPhone: string;
  supportEmail: string;
  pixKey: string;
  pixKeyType: string;
  bankInfo: string;
  updatedAt: string;
  updatedBy?: string;
}
