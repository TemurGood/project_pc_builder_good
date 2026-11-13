import React from 'react';
import { 
  Cpu, Box, Flame, ShoppingBag, Sun, Moon, Sparkles 
} from 'lucide-react';
import { translations, formatPrice } from '../translations';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  lang, 
  setLang, 
  isDarkMode,
  setIsDarkMode,
  cartCount, 
  cartTotal,
  builderPartsCount,
  onOpenCart 
}) {
  const t = translations[lang];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-950/80 border-slate-800/80' 
        : 'bg-white/80 border-slate-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('catalog')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-lg font-black tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                HYPER<span className="text-cyan-500">PC</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/40 text-cyan-500 font-bold">
                UZ
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {t.brand_subtitle}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentTab === 'catalog'
                ? isDarkMode 
                  ? 'bg-slate-800 text-white shadow-inner' 
                  : 'bg-slate-200 text-slate-900 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.nav_catalog}
          </button>

          <button
            onClick={() => setCurrentTab('builder')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 ${
              currentTab === 'builder'
                ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{t.nav_builder}</span>
            {builderPartsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-black font-mono font-bold text-[10px] flex items-center justify-center">
                {builderPartsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('fps')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'fps'
                ? 'bg-purple-500/10 border border-purple-500/40 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-purple-500" />
            <span className="hidden md:inline">{t.nav_fps}</span>
            <span className="md:hidden">FPS</span>
          </button>
        </nav>

        {/* Right: Theme Toggle, Language switch & Cart button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button (Dark / Light) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <div className={`flex items-center border rounded-xl p-1 text-xs font-bold ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setLang('ru')}
              className={`px-2 py-1 rounded-lg transition-all ${
                lang === 'ru' 
                  ? isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLang('uz')}
              className={`px-2 py-1 rounded-lg transition-all ${
                lang === 'uz' 
                  ? isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              UZ
            </button>
          </div>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className={`p-2.5 sm:px-4 sm:py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all relative ${
              isDarkMode 
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-cyan-500" />
            <span className="hidden sm:inline font-mono">
              {cartTotal > 0 ? formatPrice(cartTotal, lang) : t.nav_cart}
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-400 text-black font-mono font-bold text-[10px] flex items-center justify-center shadow-lg">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
