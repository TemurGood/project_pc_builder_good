import React, { useState, useRef } from 'react';
import { 
  X, Trash2, ShoppingBag, Send, CheckCircle2, 
  Smartphone, User, AtSign, Upload, FileText, Image as ImageIcon,
  CreditCard, ExternalLink, AlertCircle, ShieldCheck, Sparkles, Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { translations, formatPrice } from '../translations';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemoveItem, 
  onClearCart, 
  lang 
}) {
  const t = translations[lang];
  const [paymentMode, setPaymentMode] = useState('receipt'); // 'receipt' | 'stripe'
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [telegram, setTelegram] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [includeStripeInvoice, setIncludeStripeInvoice] = useState(true);
  const [enableStripeTax, setEnableStripeTax] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const totalSum = cartItems.reduce((sum, item) => sum + (item.price_uzs * (item.quantity || 1)), 0);
  const estimatedUsd = Math.max(1, Math.round(totalSum / 12800));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setErrorMsg('');
    if (!file) {
      setReceiptFile(null);
      setReceiptPreview(null);
      return;
    }

    const isAllowed = /^(image\/(jpeg|jpg|png|webp|gif)|application\/pdf)$/i.test(file.type);
    if (!isAllowed) {
      setErrorMsg(lang === 'uz' 
        ? 'Faqat rasm (JPG, PNG, WEBP) yoki PDF fayl yuklash mumkin!' 
        : 'Разрешены только картинки (JPG, PNG, WEBP) или PDF файлы!');
      return;
    }

    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName || !phone) return;

    // Mode 1: Stripe Online Payment + Invoicing + Tax
    if (paymentMode === 'stripe') {
      setSubmitting(true);
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: customerName,
            phone,
            telegram_username: telegram,
            total_uzs: totalSum,
            items: cartItems,
            enable_tax: enableStripeTax,
            create_invoice: includeStripeInvoice
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Ошибка создания платежа Stripe');
        } else {
          setCompletedOrder({
            ...data.order,
            stripeCheckoutUrl: data.checkoutUrl,
            stripeInvoice: data.invoice
          });
          onClearCart();
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err) {
        setErrorMsg(err.message || 'Ошибка соединения со Stripe');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Mode 2: Local Card Transfer + Receipt File Upload (Image / PDF -> Neon Object Storage + Telegram)
    if (!receiptFile) {
      setErrorMsg(t.receipt_required_err);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('customer_name', customerName);
      formData.append('phone', phone);
      formData.append('telegram_username', telegram);
      formData.append('total_uzs', String(totalSum));
      formData.append('items', JSON.stringify(cartItems));
      formData.append('receipt', receiptFile);

      const res = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Ошибка при оформлении заказа');
      } else {
        setCompletedOrder(data.order);
        setReceiptFile(null);
        setReceiptPreview(null);
        onClearCart();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка соединения с сервером');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{t.cart_title}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {cartItems.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {completedOrder ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">{t.order_success}</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">
              {t.print_receipt}
            </p>

            {/* Receipt Summary Box */}
            <div className="mt-6 w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left font-mono space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{t.order_id}:</span>
                <span className="text-cyan-400 font-bold">{completedOrder.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t.full_name}:</span>
                <span className="text-white">{completedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t.phone_number}:</span>
                <span className="text-white">{completedOrder.phone}</span>
              </div>
              {completedOrder.receipt_filename && (
                <div className="flex justify-between text-slate-400">
                  <span>Чек оплаты:</span>
                  <span className="text-emerald-300 truncate max-w-[180px]">{completedOrder.receipt_filename}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Telegram Бот (@good_pc_builder_bot):</span>
                <span className={completedOrder.telegram_sent ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {completedOrder.telegram_sent 
                    ? (lang === 'uz' ? 'Yuborildi ✓' : 'Доставлено ✓') 
                    : (lang === 'uz' ? 'Adminga saqlandi' : 'Сохранен в /admin')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                <span>Итого:</span>
                <span className="text-emerald-400">{formatPrice(completedOrder.total_uzs, lang)}</span>
              </div>
            </div>

            {/* Stripe Checkout & Invoice Links if Stripe payment mode */}
            {completedOrder.stripeCheckoutUrl && (
              <a
                href={completedOrder.stripeCheckoutUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Перейти к оплате на странице Stripe Checkout
              </a>
            )}

            {completedOrder.stripeInvoice?.hostedInvoiceUrl && (
              <a
                href={completedOrder.stripeInvoice.hostedInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                Открыть официальный счёт Stripe Invoice (PDF)
              </a>
            )}

            {completedOrder.receipt_url && (
              <a
                href={completedOrder.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t.open_receipt}
              </a>
            )}

            <button
              onClick={() => {
                setCompletedOrder(null);
                onClose();
              }}
              className="mt-3 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider"
            >
              {lang === 'uz' ? 'Yopish' : 'Закрыть'}
            </button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center text-slate-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t.cart_empty}</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={item.image || '/products/cpu-7800x3d.svg'} 
                        alt={item.name_ru} 
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {lang === 'uz' ? item.name_uz : item.name_ru}
                        </div>
                        <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                          {formatPrice(item.price_uzs, lang)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Form */}
            {cartItems.length > 0 && (
              <form onSubmit={handleSubmitOrder} className="p-5 border-t border-slate-800 bg-slate-950/95 space-y-3 max-h-[72vh] overflow-y-auto">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.total_cost}:</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-cyan-400 font-mono block">
                      {formatPrice(totalSum, lang)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ≈ ${estimatedUsd.toLocaleString('en-US')} USD (Stripe эквивалент)
                    </span>
                  </div>
                </div>

                {/* Payment Method Switcher: Receipt Upload vs Stripe */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('receipt')}
                    className={`py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMode === 'receipt'
                        ? 'bg-cyan-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Чек (Картинка / PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('stripe')}
                    className={`py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMode === 'stripe'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Stripe (Card / Invoice)
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t.full_name}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="relative">
                    <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="Telegram @username"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {paymentMode === 'receipt' ? (
                  <>
                    {/* Payment Card Box */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/50 to-blue-950/40 border border-cyan-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-semibold">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.payment_card_label}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-black text-white tracking-wider pt-0.5">
                        <span>8600 4904 7788 1234</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                          HYPER PC UZ
                        </span>
                      </div>
                    </div>

                    {/* Receipt File Upload (Image or PDF) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        {t.receipt_upload_label}
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-3 transition-all text-center ${
                          receiptFile
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/70'
                        }`}
                      >
                        {receiptFile ? (
                          <div className="flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {receiptPreview ? (
                                <img
                                  src={receiptPreview}
                                  alt="Receipt preview"
                                  className="w-11 h-11 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                                  <FileText className="w-6 h-6" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-emerald-400">
                                  {t.receipt_selected}
                                </div>
                                <div className="text-xs text-white font-mono truncate">
                                  {receiptFile.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {(receiptFile.size / 1024).toFixed(1)} KB • {receiptFile.type.includes('pdf') ? 'PDF' : 'Image'}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 font-bold shrink-0">
                              {lang === 'uz' ? 'Almashtirish' : 'Заменить'}
                            </span>
                          </div>
                        ) : (
                          <div className="py-2 flex flex-col items-center justify-center gap-1.5">
                            <div className="flex items-center gap-2 text-cyan-400">
                              <Upload className="w-4 h-4" />
                              <ImageIcon className="w-4 h-4" />
                              <FileText className="w-4 h-4" />
                            </div>
                            <p className="text-xs text-slate-300 font-medium">
                              {t.receipt_upload_hint}
                            </p>
                            <span className="text-[10px] font-mono text-slate-500">
                              JPG, PNG, WEBP, PDF → Neon Storage + Telegram Bot
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        Stripe Payments + Invoicing + Tax
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20">
                        TEST MODE
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeStripeInvoice}
                        onChange={(e) => setIncludeStripeInvoice(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      <span>Сформировать PDF-счёт Stripe Invoice</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableStripeTax}
                        onChange={(e) => setEnableStripeTax(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      <span>Включить автоматический расчёт налога Stripe Tax</span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 ${
                    paymentMode === 'stripe'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/25'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {submitting
                    ? (lang === 'uz' ? 'Yuborilmoqda...' : 'Обработка...')
                    : paymentMode === 'stripe'
                      ? 'Оформить через Stripe Checkout + Invoice'
                      : t.confirm_order}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
