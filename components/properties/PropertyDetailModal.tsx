'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize2,
  Calendar,
  Sparkles,
  MessageCircle,
  Share2,
  Flag,
  ShieldCheck,
  Check,
  Building,
  User,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Property } from '@/types';
import {
  formatBRL,
  formatDateBR,
  generateReferenceCode,
  PROPERTY_TYPE_LABELS,
} from '@/lib/formatters';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import { recordPropertyEvent } from '@/lib/propertyService';

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  onOpenReport: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  onClose,
  onOpenReport,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFeatured] = useState(() => {
    return Boolean(
      property?.featuredUntil &&
        new Date(property.featuredUntil).getTime() > Date.now()
    );
  });

  useEffect(() => {
    if (property) {
      recordPropertyEvent(property.id, 'view', property.ownerId);
    }
  }, [property]);

  if (!property) return null;

  const photos =
    property.photoPaths && property.photoPaths.length > 0
      ? property.photoPaths
      : [property.coverPhotoPath || 'https://picsum.photos/seed/default/900/600'];

  const referenceCode = generateReferenceCode(property.id);

  const totalMonthlyCents =
    property.rentAmountCents +
    (property.condominiumAmountCents || 0) +
    (property.iptuAmountCents || 0);

  const handleWhatsApp = () => {
    recordPropertyEvent(property.id, 'whatsapp_click', property.ownerId);
    const { url, error } = createWhatsAppUrl({
      phone: property.publicContactPhone,
      propertyTitle: property.title,
      propertyId: property.id,
    });
    if (error) {
      alert(error);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    recordPropertyEvent(property.id, 'share', property.ownerId);
    const shareUrl = window.location.origin + `?imovel=${property.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: property.title,
          text: `Confira este imóvel para alugar no AlugaFácil Pro: ${property.title} - ${formatBRL(property.rentAmountCents)}/mês`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 md:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
              {referenceCode}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType}
            </span>
            {isFeatured && (
              <span className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                <Sparkles className="h-3 w-3 fill-white" />
                <span>Destaque</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              title="Compartilhar"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Gallery View */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md">
              <Image
                src={photos[activePhotoIdx]}
                alt={`${property.title} - Foto ${activePhotoIdx + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
                priority
                referrerPolicy="no-referrer"
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-xs transition"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-xs transition"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
                    {activePhotoIdx + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail row */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activePhotoIdx === idx ? 'border-blue-600 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={p} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Info Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  {property.neighborhood}, {property.city} - {property.state}
                </span>
                {property.publicAddress && (
                  <span className="text-slate-400">({property.publicAddress})</span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-100 shrink-0 min-w-[220px]">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                Valor do Aluguel
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-blue-900">
                  {formatBRL(property.rentAmountCents)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/mês</span>
              </div>

              {((property.condominiumAmountCents && property.condominiumAmountCents > 0) ||
                (property.iptuAmountCents && property.iptuAmountCents > 0)) && (
                <div className="mt-2 pt-2 border-t border-blue-200/60 text-[11px] text-slate-600 space-y-0.5">
                  {property.condominiumAmountCents ? (
                    <div className="flex justify-between">
                      <span>Condomínio:</span>
                      <span className="font-semibold">{formatBRL(property.condominiumAmountCents)}</span>
                    </div>
                  ) : null}
                  {property.iptuAmountCents ? (
                    <div className="flex justify-between">
                      <span>IPTU mensal:</span>
                      <span className="font-semibold">{formatBRL(property.iptuAmountCents)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-bold text-blue-900 pt-1 border-t border-blue-200/40">
                    <span>Total estimado:</span>
                    <span>{formatBRL(totalMonthlyCents)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {property.areaM2 ? (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-blue-600">
                  <Maximize2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Área Útil</p>
                  <p className="text-sm font-bold text-slate-900">{property.areaM2} m²</p>
                </div>
              </div>
            ) : null}

            {typeof property.bedrooms === 'number' && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-blue-600">
                  <Bed className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Quartos</p>
                  <p className="text-sm font-bold text-slate-900">
                    {property.bedrooms} {property.suites ? `(${property.suites} suíte)` : ''}
                  </p>
                </div>
              </div>
            )}

            {typeof property.bathrooms === 'number' && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-blue-600">
                  <Bath className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Banheiros</p>
                  <p className="text-sm font-bold text-slate-900">{property.bathrooms}</p>
                </div>
              </div>
            )}

            {typeof property.parkingSpaces === 'number' && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-blue-600">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Vagas de Garagem</p>
                  <p className="text-sm font-bold text-slate-900">{property.parkingSpaces}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Descrição do Imóvel
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-100">
              {property.description}
            </p>
          </div>

          {/* Amenities & Comodidades */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Comodidades & Características
              </h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50/70 border border-blue-100/80 px-3 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <Check className="h-3.5 w-3.5 text-blue-600" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Advertiser Card & WhatsApp Section */}
          <div className="rounded-3xl bg-gradient-to-br from-[#17324D] to-[#0F2133] p-5 sm:p-6 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-md">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white">{property.publicContactName}</h3>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-300">Anunciante verificado no AlugaFácil Pro</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#16803D] px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition cursor-pointer"
              >
                <MessageCircle className="h-5 w-5 fill-white" />
                <span>Conversar no WhatsApp</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center sm:text-left border-t border-slate-700/60 pt-3">
              Ao clicar, você será direcionado para o WhatsApp oficial com a mensagem pré-formatada com o código do anúncio ({referenceCode}).
            </p>
          </div>

          {/* Footer Metadata & Report */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Anunciado em {formatDateBR(property.publishedAt || property.createdAt)}</span>
            </div>

            <button
              onClick={() => onOpenReport(property)}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition cursor-pointer"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Denunciar anúncio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
