'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize2,
  Sparkles,
  MessageCircle,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { Property } from '@/types';
import { formatBRL, PROPERTY_TYPE_LABELS } from '@/lib/formatters';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import { recordPropertyEvent } from '@/lib/propertyService';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  onShare?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  onShare,
}) => {
  const [isFeatured] = useState(() => {
    return Boolean(
      property.featuredUntil &&
        new Date(property.featuredUntil).getTime() > Date.now()
    );
  });
  const isRented = property.status === 'rented';

  const coverImage =
    property.coverPhotoPath ||
    (property.photoPaths && property.photoPaths.length > 0
      ? property.photoPaths[0]
      : 'https://picsum.photos/seed/default-house/800/600');

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Record event
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

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(property);
    } else if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Confira este imóvel para alugar no AlugaFácil Pro: ${property.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <article
      onClick={() => onSelect(property)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border transition-all duration-300 hover:shadow-xl cursor-pointer ${
        isFeatured
          ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
          : 'border-slate-200 shadow-xs hover:border-blue-400'
      }`}
    >
      {/* Image Area */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <Image
          src={coverImage}
          alt={property.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Gradient Overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Badges Top Left */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          <span className="rounded-lg bg-[#17324D]/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-xs">
            {PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType}
          </span>

          {isFeatured && (
            <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
              <Sparkles className="h-3 w-3 fill-white" />
              <span>Destaque</span>
            </span>
          )}

          {isRented && (
            <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
              Alugado
            </span>
          )}
        </div>

        {/* Share Button Top Right */}
        <button
          onClick={handleShareClick}
          aria-label="Compartilhar anúncio"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-xs transition hover:bg-white hover:text-blue-600 active:scale-95 z-10"
        >
          <Share2 className="h-4 w-4" />
        </button>

        {/* Location Bottom Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-white text-xs font-medium drop-shadow-sm truncate">
          <MapPin className="h-3.5 w-3.5 text-amber-300 shrink-0" />
          <span className="truncate">
            {property.neighborhood}, {property.city} - {property.state}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug min-h-[2.5rem]">
          {property.title}
        </h3>

        {/* Pricing */}
        <div className="mt-2.5 flex items-baseline justify-between border-b border-slate-100 pb-2.5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-blue-700 tracking-tight">
                {formatBRL(property.rentAmountCents)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/mês</span>
            </div>
            {property.condominiumAmountCents && property.condominiumAmountCents > 0 ? (
              <p className="text-[11px] text-slate-500">
                + Cond. {formatBRL(property.condominiumAmountCents)}
              </p>
            ) : null}
          </div>

          {property.furnished && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Mobiliado
            </span>
          )}
        </div>

        {/* Key Specs Row */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          {property.areaM2 ? (
            <div className="flex items-center gap-1" title="Área útil">
              <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{property.areaM2} m²</span>
            </div>
          ) : null}

          {typeof property.bedrooms === 'number' && property.bedrooms > 0 ? (
            <div className="flex items-center gap-1" title="Quartos">
              <Bed className="h-3.5 w-3.5 text-slate-400" />
              <span>{property.bedrooms} qts</span>
            </div>
          ) : null}

          {typeof property.bathrooms === 'number' && property.bathrooms > 0 ? (
            <div className="flex items-center gap-1" title="Banheiros">
              <Bath className="h-3.5 w-3.5 text-slate-400" />
              <span>{property.bathrooms} ban</span>
            </div>
          ) : null}

          {typeof property.parkingSpaces === 'number' && property.parkingSpaces > 0 ? (
            <div className="flex items-center gap-1" title="Vagas de garagem">
              <Car className="h-3.5 w-3.5 text-slate-400" />
              <span>{property.parkingSpaces} vag</span>
            </div>
          ) : null}
        </div>

        {/* WhatsApp Fast CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[130px]">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{property.publicContactName}</span>
          </div>

          <button
            onClick={handleWhatsAppClick}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5 fill-white" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </article>
  );
};
