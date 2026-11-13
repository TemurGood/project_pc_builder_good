import React, { useState, useEffect } from 'react';
import {
  Terminal, Lock, RefreshCw, ExternalLink, FileText,
  Image as ImageIcon, Send, Package, ShoppingBag, Database, HardDrive,
  ArrowLeft, Plus, Trash2, AlertCircle, CreditCard, Receipt, Users, Calculator
} from 'lucide-react';
import { formatPrice } from '../translations';

export default function AdminPage({ lang = 'ru', onExitAdmin, onProductsChanged }) {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('pc_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'stripe'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [invoicingId, setInvoicingId] = useState(null);

  // Stripe tools state
  const [connectEmail, setConnectEmail] = useState('partner@hyperpc.uz');
  const [connectName, setConnectName] = useState('Tashkent GPU Supplier');
  const [connectResult, setConnectResult] = useState(null);
  const [taxAmountUzs, setTaxAmountUzs] = useState('10000000');
  const [taxResult, setTaxResult] = useState(null);
  const [billingResult, setBillingResult] = useState(null);
  const [stripeActionLoading, setStripeActionLoading] = useState(false);

  // New product form state
  const [newProd, setNewProd] = useState({
    category_id: 'gpu',
    brand: '',
    model: '',
    name_ru: '',
    name_uz: '',
    price_uzs: '',
    description_ru: '',
    description_uz: ''
  });
  const [newProdFile, setNewProdFile] = useState(null);
  const [creatingProd, setCreatingProd] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ordRes, prodRes, catRes, healthRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/health')
      ]);
      const [ordData, prodData, catData, healthData] = await Promise.all([
        ordRes.json(),
        prodRes.json(),
        catRes.json(),
        healthRes.json()
      ]);
      if (Array.isArray(ordData)) setOrders(ordData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(catData)) setCategories(catData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadAdminData();
    }
  }, [authenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin2026' || password === 'admin') {
      sessionStorage.setItem('pc_admin_auth', 'true');
      setAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Неверный пароль администратора (по умолчанию: admin2026)');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResendTelegram = async (orderId) => {
    setResendingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-telegram`, { method: 'POST' });
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                telegram_sent: Boolean(data.success),
                telegram_error: data.telegram?.error || null
              }
            : o
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setResendingId(null);
    }
  };

  const handleGenerateStripeInvoice = async (orderId) => {
    setInvoicingId(orderId);
    try {
      const res = await fetch(`/api/stripe/invoice/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  stripe_invoice_id: data.invoice.invoiceId,
                  stripe_invoice_url: data.invoice.hostedInvoiceUrl,
                  stripe_invoice_pdf: data.invoice.invoicePdf
                }
              : o
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInvoicingId(null);
    }
  };

  const handleCreateBillingSession = async () => {
    setStripeActionLoading(true);
    try {
      const res = await fetch('/api/stripe/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: 'HYPER PC CARE PRO — Подписка на обслуживание и гарантию',
          monthlyUsdCents: 1500
        })
      });
      const data = await res.json();
      setBillingResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStripeActionLoading(false);
    }
  };

  const handleCreateConnectAccount = async (e) => {
    e.preventDefault();
    setStripeActionLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: connectEmail,
          businessName: connectName
        })
      });
      const data = await res.json();
      setConnectResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStripeActionLoading(false);
    }
  };

  const handleCalculateTax = async (e) => {
    e.preventDefault();
    setStripeActionLoading(true);
    try {
      const res = await fetch('/api/stripe/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_uzs: Number(taxAmountUzs) || 10000000 })
      });
      const data = await res.json();
      setTaxResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStripeActionLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProd.brand || !newProd.model || !newProd.price_uzs) return;
    setCreatingProd(true);
    try {
      const fd = new FormData();
      fd.append('category_id', newProd.category_id);
      fd.append('brand', newProd.brand);
      fd.append('model', newProd.model);
      fd.append('name_ru', newProd.name_ru || `${newProd.brand} ${newProd.model}`);
      fd.append('name_uz', newProd.name_uz || newProd.name_ru || `${newProd.brand} ${newProd.model}`);
      fd.append('price_uzs', String(newProd.price_uzs));
      fd.append('description_ru', newProd.description_ru);
      fd.append('description_uz', newProd.description_uz);
      fd.append('specs_json', JSON.stringify({ benchmark_score: 75 }));
      if (newProdFile) {
        fd.append('image_file', newProdFile);
      }

      const res = await fetch('/api/products', { method: 'POST', body: fd });
      if (res.ok) {
        setNewProd({
          category_id: 'gpu',
          brand: '',
          model: '',
          name_ru: '',
          name_uz: '',
          price_uzs: '',
          description_ru: '',
          description_uz: ''
        });
        setNewProdFile(null);
        await loadAdminData();
        if (onProductsChanged) onProductsChanged();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingProd(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    try {
      const res = await fetch(`/api/products/${prodId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
        if (onProductsChanged) onProductsChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="text-center">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
              /admin • HYPER PC MARKET
            </div>
            <h1 className="text-xl font-black text-white">Скрытая панель администратора</h1>
            <p className="text-xs text-slate-400 mt-1">
              Введите ключ доступа администратора (по умолчанию: <code className="text-cyan-300">admin2026</code>)
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль администратора..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20"
            >
              Войти в /admin
            </button>
          </form>

          <button
            onClick={onExitAdmin}
            className="w-full py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Вернуться в магазин
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-wide uppercase font-mono">
                  HYPER PC • ADMIN PANEL (/admin)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Neon Postgres • Neon Object Storage • Telegram Bot • Stripe (Payments, Billing, Connect, Invoicing, Tax)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 text-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              Обновить
            </button>
            <button
              onClick={onExitAdmin}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              В магазин
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Neon, Telegram & Stripe Infrastructure Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Neon Lakebase Postgres</div>
              <div className="text-sm font-bold text-white">
                {health?.neon?.postgres?.connected ? `Подключено (${health.neon.branch})` : 'Проверка...'}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                Товаров: {health?.neon?.postgres?.products_count ?? products.length} • Заказов: {orders.length}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Neon Object Storage</div>
              <div className="text-sm font-bold text-white">
                Bucket: <code className="text-cyan-400">{health?.neon?.objectStorage?.bucket || 'assets'}</code>
              </div>
              <div className="text-[11px] text-cyan-300 font-mono">
                {health?.neon?.objectStorage?.ok ? 'Хранилище чеков активно ✓' : 'Подключение...'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Telegram Bot</div>
              <div className="text-sm font-bold text-white">
                @{health?.telegram?.botName || 'good_pc_builder_bot'}
              </div>
              <div className="text-[11px] text-blue-300 font-mono">
                Chat ID: {health?.telegram?.chatId || '3540653'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Stripe Platform</div>
              <div className="text-sm font-bold text-white truncate max-w-[170px]">
                {health?.stripe?.configured ? health.stripe.accountId : 'Проверка...'}
              </div>
              <div className="text-[10px] text-indigo-300 font-mono">
                Payments • Billing • Connect • Invoice • Tax
              </div>
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Заказы и чеки оплаты ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Товары в каталоге ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('stripe')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'stripe'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Stripe (Payments • Billing • Connect • Invoicing • Tax)
          </button>
        </div>

        {/* TAB 1: ORDERS & RECEIPTS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 font-mono text-sm">
                Пока нет оформленных заказов.
              </div>
            ) : (
              orders.map((order) => {
                let items = [];
                try {
                  items = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : (order.items_json || []);
                } catch (e) {
                  items = [];
                }
                const isPdf = order.receipt_mime_type?.includes('pdf') || order.receipt_filename?.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={order.id}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6"
                  >
                    {/* Left 7 cols: Order details */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                            {order.id}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                            {order.payment_method === 'stripe' ? '💳 Stripe' : '📎 Чек (Neon S3)'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(order.created_at).toLocaleString('ru-RU')}
                          </span>
                        </div>

                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:border-cyan-500"
                        >
                          <option value="pending">⏳ Ожидает проверки</option>
                          <option value="paid">✅ Оплата подтверждена</option>
                          <option value="shipped">🚚 Отправлен</option>
                          <option value="completed">🎉 Завершен</option>
                          <option value="cancelled">❌ Отменен</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="text-slate-500 mb-0.5">Покупатель</div>
                          <div className="font-bold text-white">{order.customer_name}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="text-slate-500 mb-0.5">Телефон</div>
                          <div className="font-mono font-bold text-white">{order.phone}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <div className="text-slate-500 mb-0.5">Итоговая сумма</div>
                          <div className="font-mono font-black text-emerald-400 text-sm">
                            {formatPrice(order.total_uzs, lang)}
                          </div>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                          Состав заказа ({items.length} поз.):
                        </div>
                        {items.map((item, i) => (
                          <div key={i} className="text-xs flex items-center justify-between text-slate-200 border-b border-slate-900 pb-1.5 last:border-none last:pb-0">
                            <span>
                              {i + 1}. <strong>{item.name_ru || item.model}</strong> × {item.quantity || 1}
                            </span>
                            <span className="font-mono text-cyan-400">
                              {formatPrice((item.price_uzs || 0) * (item.quantity || 1), lang)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Actions: Telegram & Stripe Invoice */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleResendTelegram(order.id)}
                            disabled={resendingId === order.id}
                            className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {resendingId === order.id ? 'Отправка...' : 'Отправить в Telegram'}
                          </button>

                          <button
                            onClick={() => handleGenerateStripeInvoice(order.id)}
                            disabled={invoicingId === order.id}
                            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            {invoicingId === order.id ? 'Генерация...' : 'Сформировать Stripe Invoice'}
                          </button>
                        </div>

                        {order.stripe_invoice_url && (
                          <a
                            href={order.stripe_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Stripe Invoice ({order.stripe_invoice_id})
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right 5 cols: Attached Payment Receipt Preview from Neon Object Storage or Stripe links */}
                    <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                            {isPdf ? <FileText className="w-4 h-4 text-red-400" /> : <ImageIcon className="w-4 h-4" />}
                            <span>Чек оплаты / Документы</span>
                          </div>
                          {order.receipt_filename && (
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                              {order.receipt_filename}
                            </span>
                          )}
                        </div>

                        {order.receipt_url ? (
                          isPdf ? (
                            <div className="space-y-3">
                              <iframe
                                src={order.receipt_url}
                                title={`Receipt ${order.id}`}
                                className="w-full h-52 rounded-xl border border-slate-800 bg-slate-900"
                              />
                              <div className="text-[11px] text-slate-400 font-mono">
                                PDF-чек в Neon bucket <code>assets</code> ({order.receipt_key})
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <a href={order.receipt_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                                <img
                                  src={order.receipt_url}
                                  alt={`Чек ${order.id}`}
                                  className="w-full h-52 object-contain hover:scale-105 transition-transform"
                                />
                              </a>
                              <div className="text-[10px] text-slate-500 font-mono truncate">
                                Key: {order.receipt_key}
                              </div>
                            </div>
                          )
                        ) : order.stripe_payment_url ? (
                          <div className="h-48 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 flex flex-col items-center justify-center text-center gap-2">
                            <CreditCard className="w-8 h-8 text-indigo-400" />
                            <div className="text-xs font-bold text-white">Заказ через Stripe Checkout</div>
                            <div className="text-[10px] font-mono text-indigo-300 break-all">
                              Session: {order.stripe_session_id}
                            </div>
                            <a
                              href={order.stripe_payment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                            >
                              Открыть страницу оплаты Stripe
                            </a>
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-xs text-slate-500 font-mono">
                            Чек не прикреплен
                          </div>
                        )}
                      </div>

                      {(order.receipt_url || order.stripe_invoice_pdf) && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
                          {order.receipt_url && (
                            <a
                              href={order.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                              Открыть чек
                            </a>
                          )}
                          {order.stripe_invoice_pdf && (
                            <a
                              href={order.stripe_invoice_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Скачать Invoice PDF
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateProduct}
              className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 h-fit"
            >
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Добавить новый товар в Neon Postgres
              </h3>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Категория</label>
                <select
                  value={newProd.category_id}
                  onChange={(e) => setNewProd({ ...newProd, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ru}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Бренд (ASUS, AMD...)"
                  value={newProd.brand}
                  onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Модель (RTX 4070 Ti)"
                  value={newProd.model}
                  onChange={(e) => setNewProd({ ...newProd, model: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <input
                type="number"
                required
                placeholder="Цена в сумах (UZS)"
                value={newProd.price_uzs}
                onChange={(e) => setNewProd({ ...newProd, price_uzs: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />

              <input
                type="text"
                placeholder="Описание (RU)"
                value={newProd.description_ru}
                onChange={(e) => setNewProd({ ...newProd, description_ru: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Картинка товара (загружается в Neon Object Storage)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewProdFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={creatingProd}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider"
              >
                {creatingProd ? 'Сохранение...' : 'Сохранить товар'}
              </button>
            </form>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image}
                      alt={p.name_ru}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase">
                        {p.brand} • {p.category_id}
                      </div>
                      <div className="text-xs font-bold text-white truncate">{p.name_ru}</div>
                      <div className="text-xs font-mono text-emerald-400 font-bold">
                        {formatPrice(p.price_uzs, lang)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-950"
                    title="Удалить товар"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STRIPE SUITE (Payments, Billing, Connect, Invoicing, Tax) */}
        {activeTab === 'stripe' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Stripe Billing */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm">
                <CreditCard className="w-5 h-5" />
                <h3>Stripe Billing (Подписки)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Регулярная подписка <strong>HYPER PC CARE PRO</strong> ($15/мес): чистка ПК, замена термопасты и расширенная гарантия.
              </p>
              <button
                onClick={handleCreateBillingSession}
                disabled={stripeActionLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Создать подписку Stripe Billing
              </button>
              {billingResult?.checkoutUrl && (
                <a
                  href={billingResult.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-indigo-300 font-mono hover:underline"
                >
                  🔗 Открыть Checkout подписки ({billingResult.sessionId})
                </a>
              )}
            </div>

            {/* 2. Stripe Connect */}
            <form onSubmit={handleCreateConnectAccount} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
                <Users className="w-5 h-5" />
                <h3>Stripe Connect (Поставщики)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Подключение партнёров-поставщиков комплектующих с автоматическим разделением платежей (Split Payments).
              </p>
              <input
                type="email"
                required
                value={connectEmail}
                onChange={(e) => setConnectEmail(e.target.value)}
                placeholder="Email поставщика"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                required
                value={connectName}
                onChange={(e) => setConnectName(e.target.value)}
                placeholder="Название компании"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                disabled={stripeActionLoading}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
              >
                Подключить партнёра (Stripe Connect)
              </button>
              {connectResult && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                  {connectResult.accountId ? (
                    <>
                      <div className="text-emerald-400">Account: {connectResult.accountId}</div>
                      {connectResult.onboardingUrl && (
                        <a href={connectResult.onboardingUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline block">
                          Ссылка онбординга →
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="text-amber-400">{connectResult.error}</div>
                  )}
                </div>
              )}
            </form>

            {/* 3. Stripe Tax */}
            <form onSubmit={handleCalculateTax} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                <Calculator className="w-5 h-5" />
                <h3>Stripe Tax (Налоговый расчёт)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Расчёт налогов и НДС на комплектующие через Stripe Tax API для выбранной суммы заказа.
              </p>
              <input
                type="number"
                required
                value={taxAmountUzs}
                onChange={(e) => setTaxAmountUzs(e.target.value)}
                placeholder="Сумма заказа (UZS)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <button
                type="submit"
                disabled={stripeActionLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
              >
                Рассчитать налог (Stripe Tax)
              </button>
              {taxResult && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                  <div className="text-emerald-400 font-bold">{taxResult.provider}</div>
                  {taxResult.taxAmountUzs !== undefined && (
                    <div>НДС (12%): {formatPrice(taxResult.taxAmountUzs, lang)}</div>
                  )}
                  {taxResult.totalWithTaxUzs !== undefined && (
                    <div>Итого с налогом: {formatPrice(taxResult.totalWithTaxUzs, lang)}</div>
                  )}
                  {taxResult.calculationId && <div>ID: {taxResult.calculationId}</div>}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
