import React, { useState } from 'react';
import { 
  Cpu, CircuitBoard, Fan, Layers, Tv, HardDrive, Zap, Box, 
  Plus, Check, RefreshCw, Trash2, ArrowRight, ShoppingCart, Gauge, AlertCircle
} from 'lucide-react';
import { translations, formatPrice } from '../translations';
import VisualCasePreview from './VisualCasePreview';

const SLOT_CONFIG = [
  { key: 'cpu', categoryId: 'cpu', icon: Cpu, labelKey: 'slot_cpu' },
  { key: 'motherboard', categoryId: 'motherboard', icon: CircuitBoard, labelKey: 'slot_motherboard' },
  { key: 'cooler', categoryId: 'cooler', icon: Fan, labelKey: 'slot_cooler' },
  { key: 'ram', categoryId: 'ram', icon: Layers, labelKey: 'slot_ram' },
  { key: 'gpu', categoryId: 'gpu', icon: Tv, labelKey: 'slot_gpu' },
  { key: 'storage', categoryId: 'storage', icon: HardDrive, labelKey: 'slot_storage' },
  { key: 'psu', categoryId: 'psu', icon: Zap, labelKey: 'slot_psu' },
  { key: 'casePart', categoryId: 'case', icon: Box, labelKey: 'slot_case' },
];

export default function PCBuilder({ 
  parts, 
  onSelectPart, 
  onRemovePart, 
  onClearBuild, 
  products, 
  compatibility, 
  lang,
  isDarkMode,
  onNavigateToFps,
  onOrderBuild
}) {
  const t = translations[lang];
  const [activeSlot, setActiveSlot] = useState(null); // When opening selection modal

  // Calculate total build cost
  const totalCost = Object.values(parts).reduce((sum, item) => {
    return sum + (item ? item.price_uzs : 0);
  }, 0);

  const selectedPartsCount = Object.values(parts).filter(Boolean).length;

  // Filter products for active slot modal
  const slotProducts = activeSlot 
    ? products.filter(p => p.category_id === activeSlot.categoryId)
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Box className="w-6 h-6" />
            </span>
            {t.builder_title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t.builder_subtitle}</p>
        </div>

        {/* Action Top Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {selectedPartsCount > 0 && (
            <button
              onClick={onClearBuild}
              className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-red-500/10 hover:border-red-500/40 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.clear_build}
            </button>
          )}

          <button
            onClick={() => onNavigateToFps()}
            className="px-4 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg transition-all"
          >
            <Gauge className="w-4 h-4 text-purple-400" />
            {t.check_fps}
          </button>

          <button
            onClick={() => onOrderBuild()}
            disabled={selectedPartsCount === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <ShoppingCart className="w-4 h-4" />
            {t.order_build} ({formatPrice(totalCost, lang)})
          </button>
        </div>
      </div>

      {/* Interactive Visual Case Assembly Component (3D & 2D) */}
      <VisualCasePreview parts={parts} compatibility={compatibility} lang={lang} isDarkMode={isDarkMode} />

      {/* Component Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SLOT_CONFIG.map(slot => {
          const item = parts[slot.key];
          const Icon = slot.icon;
          const label = t[slot.labelKey];

          return (
            <div 
              key={slot.key}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                item 
                  ? 'border-cyan-500/40 bg-slate-900/80 shadow-lg shadow-cyan-950/20' 
                  : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${item ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">{label}</span>
                  </div>
                  {item && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      OK
                    </span>
                  )}
                </div>

                {item ? (
                  <div className="flex gap-3">
                    <img 
                      src={item.image} 
                      alt={item.name_ru} 
                      className="w-16 h-16 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate" title={lang === 'uz' ? item.name_uz : item.name_ru}>
                        {lang === 'uz' ? item.name_uz : item.name_ru}
                      </div>
                      <div className="text-xs font-bold text-cyan-400 font-mono mt-1">
                        {formatPrice(item.price_uzs, lang)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500">
                    <span className="text-xs font-medium">{t.not_selected}</span>
                  </div>
                )}
              </div>

              {/* Slot Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {item ? (
                  <>
                    <button
                      onClick={() => setActiveSlot(slot)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-slate-700 hover:border-cyan-500 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t.replace}
                    </button>
                    <button
                      onClick={() => onRemovePart(slot.key)}
                      className="py-1.5 px-2.5 rounded-lg border border-slate-800 hover:border-red-500/50 bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-all"
                      title={t.remove}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveSlot(slot)}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {t.select_component}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Part Selection Modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <activeSlot.icon className="w-5 h-5 text-cyan-400" />
                  {t.select_component}: {t[activeSlot.labelKey]}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'uz' ? 'Mavjud komponentlar ro\'yxatidan tanlang' : 'Выберите подходящую деталь из каталога'}
                </p>
              </div>
              <button 
                onClick={() => setActiveSlot(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Products List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {slotProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  {lang === 'uz' ? 'Bu toifada mahsulot topilmadi' : 'В данной категории пока нет товаров'}
                </div>
              ) : (
                slotProducts.map(prod => {
                  const isCurrent = parts[activeSlot.key]?.id === prod.id;
                  const specs = JSON.parse(prod.specs_json || '{}');

                  return (
                    <div 
                      key={prod.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent 
                          ? 'border-cyan-500 bg-cyan-950/20' 
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={prod.image} 
                          alt={prod.name_ru} 
                          className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0" 
                        />
                        <div>
                          <div className="text-sm font-bold text-white">
                            {lang === 'uz' ? prod.name_uz : prod.name_ru}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {lang === 'uz' ? prod.description_uz : prod.description_ru}
                          </div>
                          {/* Specs pills */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(specs).slice(0, 4).map(([k, v]) => (
                              <span key={k} className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-slate-300">
                                {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                        <div className="text-base font-extrabold text-cyan-400 font-mono">
                          {formatPrice(prod.price_uzs, lang)}
                        </div>
                        <button
                          onClick={() => {
                            onSelectPart(activeSlot.key, prod);
                            setActiveSlot(null);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-slate-800 text-slate-400 pointer-events-none'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isCurrent ? (lang === 'uz' ? 'Tanlangan' : 'Выбрано') : (lang === 'uz' ? 'O\'rnatish' : 'Выбрать')}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
