import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Catalog from './components/Catalog';
import PCBuilder from './components/PCBuilder';
import FPSCalculator from './components/FPSCalculator';
import CartDrawer from './components/CartDrawer';
import AdminPage from './components/AdminPage';
import { formatPrice } from './translations';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('pc_market_lang') || 'ru');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pc_market_theme') !== 'light');
  const [currentTab, setCurrentTab] = useState('builder');
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname.startsWith('/admin'));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // PC Builder State
  const [parts, setParts] = useState(() => {
    const saved = localStorage.getItem('pc_market_builder');
    return saved ? JSON.parse(saved) : {
      cpu: null,
      motherboard: null,
      cooler: null,
      ram: null,
      gpu: null,
      storage: null,
      psu: null,
      casePart: null
    };
  });

  const [compatibility, setCompatibility] = useState({
    isCompatible: true,
    errors: [],
    warnings: [],
    totalTdp: 80,
    recommendedPsuWattage: 300
  });

  // Cart State
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('pc_market_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Listen to browser navigation for /admin route
  useEffect(() => {
    const onPopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleExitAdmin = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  // Theme synchronization
  useEffect(() => {
    localStorage.setItem('pc_market_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black min-h-screen';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-slate-50 text-slate-900 font-sans antialiased selection:bg-cyan-500 selection:text-black min-h-screen';
    }
  }, [isDarkMode]);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('pc_market_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('pc_market_builder', JSON.stringify(parts));
  }, [parts]);

  useEffect(() => {
    localStorage.setItem('pc_market_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Initial Data Fetch from Neon Lakebase Postgres API
  const loadData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      const prods = await prodRes.json();
      const cats = await catRes.json();
      setProducts(prods);
      setCategories(cats);

      if (Array.isArray(prods) && prods.length > 0) {
        const prodById = Object.fromEntries(prods.map((p) => [p.id, p]));
        setParts((prev) => {
          if (!prev.cpu && !prev.gpu && !prev.motherboard) {
            return {
              cpu: prodById['cpu-7800x3d'] || null,
              motherboard: prodById['mb-b650-tomahawk'] || null,
              cooler: prodById['cooler-deepcool-ak620'] || null,
              ram: prodById['ram-ddr5-32-6000'] || null,
              gpu: prodById['gpu-rtx-4070s'] || null,
              storage: prodById['ssd-kingston-kc3000-1tb'] || null,
              psu: prodById['psu-corsair-rm850x'] || null,
              casePart: prodById['case-lian-li-o11-dynamic-evo'] || null
            };
          }
          // Refresh existing selected parts so updated images/prices from Neon Postgres take effect
          const refreshed = { ...prev };
          for (const key of Object.keys(refreshed)) {
            if (refreshed[key]?.id && prodById[refreshed[key].id]) {
              refreshed[key] = prodById[refreshed[key].id];
            }
          }
          return refreshed;
        });
      }
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validate builder compatibility whenever parts change
  useEffect(() => {
    async function validateBuild() {
      try {
        const res = await fetch('/api/builder/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parts: {
              cpuId: parts.cpu?.id,
              motherboardId: parts.motherboard?.id,
              gpuId: parts.gpu?.id,
              ramId: parts.ram?.id,
              storageId: parts.storage?.id,
              psuId: parts.psu?.id,
              caseId: parts.casePart?.id,
              coolerId: parts.cooler?.id
            },
            lang
          })
        });
        const data = await res.json();
        setCompatibility(data);
      } catch (err) {
        console.error('Validation error:', err);
      }
    }
    validateBuild();
  }, [parts, lang]);

  // Handlers for PC Builder
  const handleSelectPart = (slotKey, product) => {
    setParts(prev => ({ ...prev, [slotKey]: product }));
  };

  const handleRemovePart = (slotKey) => {
    setParts(prev => ({ ...prev, [slotKey]: null }));
  };

  const handleClearBuild = () => {
    setParts({
      cpu: null,
      motherboard: null,
      cooler: null,
      ram: null,
      gpu: null,
      storage: null,
      psu: null,
      casePart: null
    });
  };

  // Add product from Catalog to Builder
  const handleAddToBuilder = (product) => {
    const catMap = {
      cpu: 'cpu',
      motherboard: 'motherboard',
      cooler: 'cooler',
      ram: 'ram',
      gpu: 'gpu',
      storage: 'storage',
      psu: 'psu',
      case: 'casePart'
    };
    const slot = catMap[product.category_id];
    if (slot) {
      setParts(prev => ({ ...prev, [slot]: product }));
      setCurrentTab('builder');
    }
  };

  // Add product to Cart
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  // Order full Custom PC Build
  const handleOrderBuild = () => {
    const buildTotal = Object.values(parts).reduce((sum, item) => sum + (item ? item.price_uzs : 0), 0);
    const customBuildItem = {
      id: 'custom-pc-' + Date.now(),
      name_ru: `Кастомная сборка ПК (${parts.cpu?.model || 'PC'} + ${parts.gpu?.model || 'GPU'})`,
      name_uz: `Maxsus yig'ilgan kompyuter (${parts.cpu?.model || 'PC'} + ${parts.gpu?.model || 'GPU'})`,
      price_uzs: buildTotal,
      quantity: 1,
      image: parts.casePart?.image || '/products/case-lian-li-o11-dynamic-evo.svg',
      isCustomBuild: true,
      buildDetails: parts
    };

    setCartItems(prev => [...prev, customBuildItem]);
    setIsCartOpen(true);
  };

  const handleRemoveCartItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const builderPartsCount = Object.values(parts).filter(Boolean).length;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price_uzs * (item.quantity || 1)), 0);

  // Render Hidden Admin Panel when navigating to "/admin"
  if (isAdminRoute) {
    return (
      <AdminPage
        lang={lang}
        onExitAdmin={handleExitAdmin}
        onProductsChanged={loadData}
      />
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-mono text-cyan-500 text-sm tracking-widest uppercase font-bold">
          HYPER PC MARKET • Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        cartCount={cartItems.length}
        cartTotal={cartTotal}
        builderPartsCount={builderPartsCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'catalog' && (
          <Catalog
            products={products}
            categories={categories}
            onAddToCart={handleAddToCart}
            onAddToBuilder={handleAddToBuilder}
            cartItems={cartItems}
            lang={lang}
          />
        )}

        {currentTab === 'builder' && (
          <PCBuilder
            parts={parts}
            onSelectPart={handleSelectPart}
            onRemovePart={handleRemovePart}
            onClearBuild={handleClearBuild}
            products={products}
            compatibility={compatibility}
            lang={lang}
            isDarkMode={isDarkMode}
            onNavigateToFps={() => setCurrentTab('fps')}
            onOrderBuild={handleOrderBuild}
          />
        )}

        {currentTab === 'fps' && (
          <FPSCalculator
            parts={parts}
            products={products}
            lang={lang}
            onOpenBuilder={() => setCurrentTab('builder')}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        lang={lang}
      />

      {/* Footer (Admin link is hidden — accessed only via /admin route) */}
      <footer className={`border-t py-8 px-4 text-xs transition-colors ${
        isDarkMode ? 'border-slate-800/80 bg-slate-950/90 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>HYPER PC MARKET © 2026 • Ташкент, Узбекистан</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'ru' ? 'uz' : 'ru')}
              className="hover:underline transition-colors"
            >
              Язык: <strong className="text-cyan-500">{lang.toUpperCase()}</strong>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hover:underline transition-colors"
            >
              {isDarkMode ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
