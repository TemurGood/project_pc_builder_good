require('./env');
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Exchange rate for USD equivalent when needed (1 USD ≈ 12,800 UZS)
const UZS_PER_USD = 12800;

/**
 * Convert UZS price to USD cents (minimum 50 cents for Stripe)
 */
function uzsToUsdCents(uzsAmount) {
  const usd = Number(uzsAmount || 0) / UZS_PER_USD;
  return Math.max(50, Math.round(usd * 100));
}

/**
 * 0. Check Stripe Account Status & Balance
 */
async function getStripeStatus() {
  if (!stripe) {
    return { configured: false, error: 'Missing STRIPE_SECRET_KEY' };
  }
  try {
    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(),
      stripe.balance.retrieve()
    ]);
    return {
      configured: true,
      publishableKey: stripePublishableKey,
      accountId: account.id,
      businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || 'test (goods)',
      country: account.country,
      defaultCurrency: account.default_currency,
      chargesEnabled: account.charges_enabled,
      balanceAvailable: balance.available,
      productsEnabled: ['Payments', 'Billing', 'Connect', 'Invoicing', 'Tax']
    };
  } catch (err) {
    return {
      configured: false,
      error: err.message
    };
  }
}

/**
 * 1. STRIPE PAYMENTS + STRIPE TAX:
 * Create a Stripe Checkout Session for a PC Market order (one-time payment for goods)
 */
async function createCheckoutSession({ order, items, originUrl, enableTax = false, connectedAccountId = null }) {
  if (!stripe) throw new Error('Stripe is not configured');

  const lineItems = (items && items.length > 0 ? items : [{
    name_ru: `Заказ ${order.id}`,
    price_uzs: order.total_uzs,
    quantity: 1
  }]).map((item) => {
    const qty = Number(item.quantity || 1);
    const unitUzs = Number(item.price_uzs || order.total_uzs || 0);
    const unitUsdCents = uzsToUsdCents(unitUzs);

    return {
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: unitUsdCents,
        tax_behavior: 'exclusive',
        product_data: {
          name: item.name_ru || item.model || 'PC Component',
          description: `${unitUzs.toLocaleString('ru-RU')} UZS • HYPER PC MARKET (${order.id})`
        }
      }
    };
  });

  const sessionParams = {
    mode: 'payment',
    line_items: lineItems,
    client_reference_id: order.id,
    metadata: {
      order_id: order.id,
      customer_name: order.customer_name || '',
      phone: order.phone || '',
      total_uzs: String(order.total_uzs || 0)
    },
    success_url: `${originUrl}/?stripe_status=success&order_id=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${originUrl}/?stripe_status=cancelled&order_id=${encodeURIComponent(order.id)}`
  };

  if (enableTax) {
    sessionParams.automatic_tax = { enabled: true };
  }

  // Optional Stripe Connect destination charge split (e.g. 10% platform fee)
  if (connectedAccountId) {
    const totalCents = lineItems.reduce((acc, li) => acc + li.price_data.unit_amount * li.quantity, 0);
    sessionParams.payment_intent_data = {
      application_fee_amount: Math.round(totalCents * 0.1),
      transfer_data: {
        destination: connectedAccountId
      }
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  } catch (err) {
    // If automatic_tax is not yet configured in the test dashboard, retry without automatic_tax
    if (enableTax && err.message && err.message.toLowerCase().includes('tax')) {
      delete sessionParams.automatic_tax;
      return await stripe.checkout.sessions.create(sessionParams);
    }
    throw err;
  }
}

/**
 * Verify a Checkout Session and return its payment status
 */
async function retrieveCheckoutSession(sessionId) {
  if (!stripe) throw new Error('Stripe is not configured');
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer']
  });
}

/**
 * 2. STRIPE INVOICING + STRIPE TAX:
 * Create and finalize a hosted Stripe Invoice (with PDF & payment link) for an order
 */
async function createOrderInvoice({ order, items, customerEmail }) {
  if (!stripe) throw new Error('Stripe is not configured');

  // 1. Create a Stripe Customer for this order
  const customer = await stripe.customers.create({
    name: order.customer_name,
    phone: order.phone,
    email: customerEmail || `${order.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@hyperpc.uz`,
    metadata: {
      order_id: order.id,
      telegram: order.telegram_username || ''
    }
  });

  // 2. Create draft Invoice first (in Stripe API v2025+, pass invoice: invoice.id on invoiceItems)
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: 7,
    description: `HYPER PC MARKET — Заказ ${order.id} (${Number(order.total_uzs).toLocaleString('ru-RU')} сум)`,
    metadata: {
      order_id: order.id,
      total_uzs: String(order.total_uzs)
    }
  });

  // 3. Attach each order item to the Invoice
  const orderItems = items && items.length > 0 ? items : [{
    name_ru: `Заказ комплектующих ПК (${order.id})`,
    price_uzs: order.total_uzs,
    quantity: 1
  }];

  for (const item of orderItems) {
    const qty = Number(item.quantity || 1);
    const unitUzs = Number(item.price_uzs || 0);
    const amountCents = uzsToUsdCents(unitUzs) * qty;

    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: amountCents,
      currency: 'usd',
      description: `${item.name_ru || item.model} × ${qty} (${(unitUzs * qty).toLocaleString('ru-RU')} UZS)`
    });
  }

  // 4. Finalize the invoice so `hosted_invoice_url` and `invoice_pdf` are generated immediately
  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
  return {
    invoiceId: finalized.id,
    status: finalized.status,
    hostedInvoiceUrl: finalized.hosted_invoice_url,
    invoicePdf: finalized.invoice_pdf,
    amountDueUsd: (finalized.amount_due / 100).toFixed(2),
    customerId: customer.id
  };
}

/**
 * 3. STRIPE BILLING:
 * Create a recurring Subscription Checkout Session for PC Care / VIP Warranty Plan
 */
async function createBillingSubscriptionSession({ planName = 'HYPER PC CARE PRO (VIP Обслуживание и Гарантия)', monthlyUsdCents = 1500, customerName, originUrl }) {
  if (!stripe) throw new Error('Stripe is not configured');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: monthlyUsdCents,
          recurring: {
            interval: 'month'
          },
          product_data: {
            name: planName,
            description: 'Ежемесячная чистка ПК, замена термопасты, приоритетная диагностика и расширенная гарантия HYPER PC MARKET'
          }
        }
      }
    ],
    metadata: {
      customer_name: customerName || 'VIP Client',
      service: 'billing_subscription'
    },
    success_url: `${originUrl}/?stripe_billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${originUrl}/?stripe_billing=cancelled`
  });

  return session;
}

/**
 * 4. STRIPE CONNECT:
 * Create or list connected partner/seller accounts for marketplace PC part suppliers
 */
async function createConnectedSellerAccount({ email, businessName, originUrl }) {
  if (!stripe) throw new Error('Stripe is not configured');

  const account = await stripe.accounts.create({
    type: 'express',
    email: email || 'seller@hyperpc.uz',
    business_profile: {
      name: businessName || 'PC Partner Supplier',
      product_description: 'PC hardware and components supplier on HYPER PC MARKET'
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    }
  });

  let onboardingUrl = null;
  try {
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${originUrl}/admin`,
      return_url: `${originUrl}/admin?connect_account=${account.id}`,
      type: 'account_onboarding'
    });
    onboardingUrl = link.url;
  } catch (e) {
    // If Connect is not yet activated in the Stripe dashboard, return account info gracefully
  }

  return {
    accountId: account.id,
    email: account.email,
    onboardingUrl
  };
}

/**
 * 5. STRIPE TAX:
 * Calculate tax preview via Stripe Tax Calculations API (with fallback standard VAT 12% calculation)
 */
async function calculateOrderTax({ totalUzs, country = 'UZ', postalCode = '100000', city = 'Tashkent' }) {
  const amountUsdCents = uzsToUsdCents(totalUzs);
  if (stripe && stripe.tax && stripe.tax.calculations) {
    try {
      const calc = await stripe.tax.calculations.create({
        currency: 'usd',
        line_items: [
          {
            amount: amountUsdCents,
            reference: 'pc-hardware-goods'
          }
        ],
        customer_details: {
          address: {
            country: country === 'UZ' ? 'US' : country,
            postal_code: country === 'UZ' ? '94111' : postalCode,
            state: country === 'UZ' ? 'CA' : undefined,
            city
          },
          address_source: 'shipping'
        }
      });
      return {
        provider: 'Stripe Tax API',
        calculationId: calc.id,
        amountTotalCents: calc.amount_total,
        taxAmountExclusiveCents: calc.tax_amount_exclusive,
        taxBreakdown: calc.tax_breakdown
      };
    } catch (err) {
      // Fallback if Stripe Tax is not yet enabled in Dashboard settings
      const vatUzs = Math.round(Number(totalUzs || 0) * 0.12);
      return {
        provider: 'Standard VAT Fallback (Stripe Tax Dashboard setup pending)',
        note: err.message,
        vatRate: '12%',
        taxAmountUzs: vatUzs,
        totalWithTaxUzs: Number(totalUzs || 0) + vatUzs
      };
    }
  }
  const vatUzs = Math.round(Number(totalUzs || 0) * 0.12);
  return {
    provider: 'Standard VAT 12%',
    vatRate: '12%',
    taxAmountUzs: vatUzs,
    totalWithTaxUzs: Number(totalUzs || 0) + vatUzs
  };
}

module.exports = {
  stripe,
  UZS_PER_USD,
  uzsToUsdCents,
  getStripeStatus,
  createCheckoutSession,
  retrieveCheckoutSession,
  createOrderInvoice,
  createBillingSubscriptionSession,
  createConnectedSellerAccount,
  calculateOrderTax
};
