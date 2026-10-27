'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Building,
  Home,
  SlidersHorizontal,
  Sparkles,
  CheckCircle,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CreditCard,
  PlusCircle,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyDetailModal } from '@/components/properties/PropertyDetailModal';
import { ReportModal } from '@/components/properties/ReportModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { TermsModal } from '@/components/modals/TermsModal';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { Property, PropertyType } from '@/types';
import { getPublishedProperties, getPlans } from '@/lib/propertyService';
import { INITIAL_CITIES, INITIAL_CATEGORIES } from '@/lib/seedData';
import { formatBRL, PROPERTY_TYPE_LABELS } from '@/lib/formatters';

function MainApp() {
  const { user, isAdmin } = useAuth();

  // Navigation State
  const [activeView, setActiveView] = useState<'home' | 'search' | 'owner' | 'admin' | 'plans'>('home');
  const [selectedCity, setSelectedCity] = useState<string>('Presidente Dutra');

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterMinPrice, setFilterMinPrice] = useState<number>(0);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(0);
  const [filterBedrooms, setFilterBedrooms] = useState<number>(0);
  const [filterFurnished, setFilterFurnished] = useState<boolean>(false);
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  // Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [reportingProperty, setReportingProperty] = useState<Property | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [termsModal, setTermsModal] = useState<'terms' | 'privacy' | null>(null);

  // Load properties
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getPublishedProperties({
        city: selectedCity,
        propertyType: filterType !== 'todos' ? filterType : undefined,
        minPriceCents: filterMinPrice > 0 ? filterMinPrice * 100 : undefined,
        maxPriceCents: filterMaxPrice > 0 ? filterMaxPrice * 100 : undefined,
        bedrooms: filterBedrooms > 0 ? filterBedrooms : undefined,
        furnished: filterFurnished ? true : undefined,
        featuredOnly: filterFeaturedOnly ? true : undefined,
      });

      // Client Search keyword filter (title & neighborhood)
      let filtered = data;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.neighborhood.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }

      // Sort
      if (sortBy === 'price_asc') {
        filtered.sort((a, b) => a.rentAmountCents - b.rentAmountCents);
      } else if (sortBy === 'price_desc') {
        filtered.sort((a, b) => b.rentAmountCents - a.rentAmountCents);
      } else {
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      setProperties(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [
    selectedCity,
    filterType,
    filterMinPrice,
    filterMaxPrice,
    filterBedrooms,
    filterFurnished,
    filterFeaturedOnly,
    sortBy,
  ]);

  const [homeTimestamp] = useState(() => Date.now());

  // Featured listings for home view
  const featuredListings = properties.filter(
    (p) => p.featuredUntil && new Date(p.featuredUntil).getTime() > homeTimestamp
  );

  const resetFilters = () => {
    setFilterType('todos');
    setFilterMinPrice(0);
    setFilterMaxPrice(0);
    setFilterBedrooms(0);
    setFilterFurnished(false);
    setFilterFeaturedOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F5F7] text-[#252B33]">
      <OfflineIndicator />

      {/* Primary Navigation */}
      <Navbar
        selectedCity={selectedCity}
        onCityChange={(city) => {
          setSelectedCity(city);
          if (activeView === 'home' || activeView === 'search') {
            fetchProperties();
          }
        }}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* MAIN VIEW SWITCHER */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && (
          <div className="space-y-12 pb-16">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#17324D] via-[#1D3B5A] to-[#0F2133] py-14 sm:py-20 text-white shadow-lg">
              {/* Decorative background circle */}
              <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-200 ring-1 ring-white/20 backdrop-blur-xs">
                  <MapPin className="h-3.5 w-3.5 text-blue-400" />
                  <span>Portal Imobiliário Oficial de {selectedCity} e Região - MA</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
                  Alugue Imóveis em {selectedCity} Direto com o Proprietário
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Pesquise casas, apartamentos, kitnets e pontos comerciais disponíveis. Sem intermediários ou burocracia: fale na hora pelo WhatsApp.
                </p>

                {/* Main Hero Search Card */}
                <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-black/5 text-slate-800 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Cidade */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cidade
                      </label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      >
                        <option value="Todas as Cidades">Todas as Cidades (MA)</option>
                        {INITIAL_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo de Imóvel */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Tipo de Imóvel
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      >
                        <option value="todos">Todos os Tipos</option>
                        {Object.entries(PROPERTY_TYPE_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Faixa de Preço Máximo */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Preço Até
                      </label>
                      <select
                        value={filterMaxPrice}
                        onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      >
                        <option value={0}>Qualquer valor</option>
                        <option value={800}>Até R$ 800/mês</option>
                        <option value={1200}>Até R$ 1.200/mês</option>
                        <option value={2000}>Até R$ 2.000/mês</option>
                        <option value={3500}>Até R$ 3.500/mês</option>
                        <option value={5000}>Até R$ 5.000/mês</option>
                      </select>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          fetchProperties();
                          setActiveView('search');
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition cursor-pointer"
                      >
                        <Search className="h-4 w-4" />
                        <span>Buscar Imóveis</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Popular badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
                  <span className="font-semibold text-white">Mais buscados em Presidente Dutra:</span>
                  <button
                    onClick={() => {
                      setFilterType('casa');
                      setActiveView('search');
                    }}
                    className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition cursor-pointer"
                  >
                    Casas no Centro
                  </button>
                  <button
                    onClick={() => {
                      setFilterType('kitnet');
                      setActiveView('search');
                    }}
                    className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition cursor-pointer"
                  >
                    Kitnets Mobiliadas
                  </button>
                  <button
                    onClick={() => {
                      setFilterType('comercial');
                      setActiveView('search');
                    }}
                    className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition cursor-pointer"
                  >
                    Pontos Comerciais
                  </button>
                </div>
              </div>
            </section>

            {/* CATEGORIES SHORTCUTS */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Navegue por Categorias em {selectedCity}
                </h2>
                <button
                  onClick={() => setActiveView('search')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Ver todas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {INITIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFilterType(cat.id);
                      setActiveView('search');
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border transition cursor-pointer ${
                      filterType === cat.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Building className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* FEATURED PROPERTIES SECTION */}
            {featuredListings.length > 0 && (
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                      <Sparkles className="h-4 w-4 fill-white" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Imóveis em Destaque em {selectedCity}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Seleção especial de imóveis de alta procura e verificação prioritária
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredListings.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      onSelect={(p) => setSelectedProperty(p)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* RECENTLY ADDED LISTINGS */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Últimos Imóveis Anunciados
                  </h2>
                  <p className="text-xs text-slate-500">
                    Oportunidades recentes para alugar em {selectedCity} e Maranhão
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('search')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Ver Todos os Imóveis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {properties.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                  Nenhum imóvel disponível com os filtros atuais em {selectedCity}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.slice(0, 6).map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      onSelect={(p) => setSelectedProperty(p)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200 shadow-xs space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 uppercase tracking-wide">
                    Simplicidade e Segurança
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Como Funciona o AlugaFácil Pro?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    A plataforma mais ágil para quem quer alugar e para quem quer anunciar no Maranhão.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-sm">
                      1
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Pesquise com Facilidade</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Filtre por cidade, bairro, faixa de preço, quartos e características essenciais como garagem e poço artesiano.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
                      2
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Conecte via WhatsApp</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Clique no botão oficial do WhatsApp no anúncio e fale diretamente com o proprietário já com o código do imóvel preenchido.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white font-bold text-lg shadow-sm">
                      3
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Combine e Mude</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Agende sua visita diretamente com o anunciante com total autonomia e sem pagar taxas abusivas de intermediários.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CALL TO ACTION FOR OWNERS */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-[#17324D] p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl text-center md:text-left">
                  <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white uppercase">
                    Proprietários e Corretores
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Tem um imóvel parado gerando despesas em Presidente Dutra?
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                    Cadastre em poucos minutos no AlugaFácil Pro e comece a receber mensagens de interessados no seu WhatsApp hoje mesmo.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!user) setAuthModalOpen(true);
                    else setActiveView('owner');
                  }}
                  className="rounded-2xl bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-blue-900 shadow-xl hover:bg-blue-50 active:scale-95 transition cursor-pointer shrink-0"
                >
                  Anunciar Meu Imóvel Grátis
                </button>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: FULL SEARCH CATALOG */}
        {activeView === 'search' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Imóveis para Alugar em {selectedCity}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {properties.length} {properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                </p>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>
            </div>

            {/* Filter Drawer / Bar */}
            <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search Text */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Bairro, condomínio, palavras-chave..."
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Tipo de Imóvel */}
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="todos">Todos os Tipos de Imóvel</option>
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preço Máximo */}
                <div>
                  <select
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value={0}>Qualquer Preço</option>
                    <option value={800}>Até R$ 800/mês</option>
                    <option value={1200}>Até R$ 1.200/mês</option>
                    <option value={2000}>Até R$ 2.000/mês</option>
                    <option value={3500}>Até R$ 3.500/mês</option>
                    <option value={5000}>Até R$ 5.000/mês</option>
                  </select>
                </div>

                {/* Quartos Mínimos */}
                <div>
                  <select
                    value={filterBedrooms}
                    onChange={(e) => setFilterBedrooms(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value={0}>Quartos: Qualquer</option>
                    <option value={1}>1 ou mais quartos</option>
                    <option value={2}>2 ou mais quartos</option>
                    <option value={3}>3 ou mais quartos</option>
                    <option value={4}>4 ou mais quartos</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes row */}
              <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={filterFurnished}
                      onChange={(e) => setFilterFurnished(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Apenas Mobiliados</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={filterFeaturedOnly}
                      onChange={(e) => setFilterFeaturedOnly(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Apenas Imóveis em Destaque</span>
                  </label>
                </div>

                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {properties.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center space-y-3">
                <Building className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">
                  Nenhum imóvel encontrado para essa busca
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tente alterar ou limpar os filtros de cidade, preço ou quantidade de quartos.
                </p>
                <button
                  onClick={resetFilters}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  Restaurar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    onSelect={(p) => setSelectedProperty(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: OWNER DASHBOARD */}
        {activeView === 'owner' && <OwnerDashboard />}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {activeView === 'admin' && <AdminDashboard />}

        {/* VIEW 5: PLANS & PRICING */}
        {activeView === 'plans' && (
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 uppercase tracking-wide">
                Planos Comerciais
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
                Planos Transparentes para Quem Quer Alugar
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Sem comissões abusivas por mês. Pague um valor fixo acessível e receba todos os contatos direto no seu WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Gratuito */}
              <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Plano Gratuito</h3>
                  <p className="text-xs text-slate-500">
                    Ideal para proprietários casuais anunciarem até 2 imóveis em Presidente Dutra.
                  </p>
                  <div className="text-3xl font-black text-slate-900">R$ 0,00</div>
                  <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Até 2 anúncios ativos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Contato direto via WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Fotos em alta resolução</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (!user) setAuthModalOpen(true);
                    else setActiveView('owner');
                  }}
                  className="mt-8 w-full rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-800 hover:bg-slate-200 transition"
                >
                  Começar Grátis
                </button>
              </div>

              {/* Proprietário Pro */}
              <div className="rounded-3xl bg-white p-8 border-2 border-blue-600 ring-4 ring-blue-500/10 shadow-xl flex flex-col justify-between relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs">
                  Mais Popular
                </span>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Proprietário Pro</h3>
                  <p className="text-xs text-slate-500">
                    Para donos de casas, kitnets e pontos comerciais que desejam alugar rápido.
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">R$ 29,90</span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Até 10 anúncios simultâneos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Prioridade na fila de moderação</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Métricas de cliques no WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Selo de Anunciante Verificado</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (!user) setAuthModalOpen(true);
                    else setActiveView('owner');
                  }}
                  className="mt-8 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  Assinar via PIX
                </button>
              </div>

              {/* Imobiliária */}
              <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Imobiliária & Corretor</h3>
                  <p className="text-xs text-slate-500">
                    Volume ampliado para carteiras de locação em Presidente Dutra e Maranhão.
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">R$ 99,90</span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Até 50 anúncios simultâneos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>1 Destaque Grátis de 7 dias por mês</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Relatórios analíticos mensais</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Suporte VIP via WhatsApp</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (!user) setAuthModalOpen(true);
                    else setActiveView('owner');
                  }}
                  className="mt-8 w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Contratar Plano Imobiliária
                </button>
              </div>
            </div>

            {/* Destaque Card */}
            <div className="rounded-3xl bg-amber-50/70 p-6 sm:p-8 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl text-center sm:text-left">
                <span className="rounded-md bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                  Turbine seu Anúncio
                </span>
                <h3 className="text-xl font-bold text-amber-950">
                  Destaque Avulso por 7 Dias por apenas R$ 19,90
                </h3>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Coloque seu imóvel no topo da página inicial e da busca pública com badge dourado de destaque. Locação até 3x mais rápida.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!user) setAuthModalOpen(true);
                  else setActiveView('owner');
                }}
                className="rounded-2xl bg-amber-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition shrink-0"
              >
                Destacar Meu Imóvel
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onCityClick={(c) => {
          setSelectedCity(c);
          setActiveView('search');
        }}
        onOpenTerms={() => setTermsModal('terms')}
        onOpenPrivacy={() => setTermsModal('privacy')}
      />

      {/* MODALS */}
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onOpenReport={(p) => setReportingProperty(p)}
      />

      <ReportModal
        property={reportingProperty}
        onClose={() => setReportingProperty(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <TermsModal
        isOpen={!!termsModal}
        onClose={() => setTermsModal(null)}
        type={termsModal || 'terms'}
      />
    </div>
  );
}

export default function HomeRoot() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
