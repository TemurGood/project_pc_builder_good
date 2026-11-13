import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, ShoppingCart, Cpu, Tv, Layers, 
  CircuitBoard, HardDrive, Fan, Zap, Box, Check, Sparkles, ArrowRight 
} from 'lucide-react';
import { translations, formatPrice } from '../translations';

const CATEGORY_ICONS = {
  cpu: Cpu,
  motherboard: CircuitBoard,
  gpu: Tv,
  ram: Layers,
  storage: HardDrive,
  cooler: Fan,
  psu: Zap,
  case: Box
};

export default function Catalog({ 
  products, 
  categories, 
  onAddToCart, 
  onAddToBuilder, 
  cartItems, 
  lang 
}) {
  const t = translations[lang];
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Filter & Sort
  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name_ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_uz.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price_uzs - b.price_uzs;
    if (sortBy === 'price_desc') return b.price_uzs - a.price_uzs;
    return (b.is_popular || 0) - (a.is_popular || 0);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Hero Banner with Modern Cyberpunk aesthetic */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'uz' ? 'Yangi avlod kompyuter qismlari' : 'Комплектующие нового поколения'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {lang === 'uz' ? 'Orzungizdagi kuchli kompyuterni yig\'ing' : 'Соберите компьютер мечты по честным ценам'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-xl leading-relaxed">
            {lang === 'uz' 
              ? 'Toshkent va butun O\'zbekiston bo\'yicha eng sara protsessorlar, videokartalar, xotira va korpuslar. Barcha tovarlar kafolat bilan ta\'minlanadi.'
              : 'Процессоры Ryzen и Intel Core, видеокарты RTX 40 серии, скоростная память DDR5. Официальная гарантия и доставка по Узбекистану.'
            }
          </p>
        </div>
      </div>

      {/* Categories Horizontal Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            selectedCategory === ''
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t.all_categories}
        </button>

        {categories.map(cat => {
          const Icon = CATEGORY_ICONS[cat.id] || Box;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {lang === 'uz' ? cat.name_uz : cat.name_ru}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="popular">{t.sort_popular}</option>
            <option value="price_asc">{t.sort_price_asc}</option>
            <option value="price_desc">{t.sort_price_desc}</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-base font-medium">{lang === 'uz' ? 'Mahsulotlar topilmadi' : 'По вашему запросу ничего не найдено'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const isCarted = cartItems.some(i => i.id === product.id);
            const specs = JSON.parse(product.specs_json || '{}');

            return (
              <div 
                key={product.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between group hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden flex items-center justify-center p-4">
                    <img 
                      src={product.image} 
                      alt={product.name_ru}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg" 
                    />
                    {product.old_price_uzs && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] uppercase tracking-wider">
                        Sale
                      </span>
                    )}
                    {product.is_popular === 1 && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] uppercase">
                        HIT
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      {product.brand} • {product.category_id.toUpperCase()}
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {lang === 'uz' ? product.name_uz : product.name_ru}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {lang === 'uz' ? product.description_uz : product.description_ru}
                    </p>

                    {/* Key Specs tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {Object.entries(specs).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[9px] font-mono text-slate-300">
                          {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer: Price & Actions */}
                <div className="p-5 pt-0">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-black text-white font-mono">
                      {formatPrice(product.price_uzs, lang)}
                    </span>
                    {product.old_price_uzs && (
                      <span className="text-xs text-slate-500 line-through font-mono">
                        {formatPrice(product.old_price_uzs, lang)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onAddToCart(product)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isCarted 
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isCarted ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      {isCarted ? t.added_to_cart : t.add_to_cart}
                    </button>

                    <button
                      onClick={() => onAddToBuilder(product)}
                      className="py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/10"
                    >
                      <Box className="w-3.5 h-3.5" />
                      {t.add_to_builder}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
