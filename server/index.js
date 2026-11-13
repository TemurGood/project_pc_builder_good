require('./env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { query, initDbSchema } = require('./db');
const { seedDatabase } = require('./seed');
const {
  BUCKET_NAME,
  uploadToNeonStorage,
  getPresignedObjectUrl,
  downloadFromNeonStorage,
  checkStorageHealth
} = require('./storage');
const { sendOrderToTelegram, getTelegramConfig } = require('./telegram');
const {
  getStripeStatus,
  createCheckoutSession,
  retrieveCheckoutSession,
  createOrderInvoice,
  createBillingSubscriptionSession,
  createConnectedSellerAccount,
  calculateOrderTax
} = require('./stripeService');
const { checkCompatibility } = require('./compatibility');
const { calculateAllGamesFps, calculateFpsForGame } = require('./fpsCalculator');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Ensure schema is initialized once per serverless instance when running on Vercel
let schemaReadyPromise = null;
app.use('/api', async (req, res, next) => {
  try {
    if (!schemaReadyPromise) {
      schemaReadyPromise = initDbSchema().catch((err) => {
        console.warn('Schema init warning:', err.message);
      });
    }
    await schemaReadyPromise;
    next();
  } catch (err) {
    next();
  }
});

// Multer memory storage for uploading payment receipts (images & PDF) and product images to Neon Object Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/(jpeg|jpg|png|webp|gif|svg\+xml)|application\/pdf)$/i;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPG, PNG, WEBP) или PDF файлы чеков оплаты'));
    }
  }
});

function normalizeProduct(row) {
  if (!row) return null;
  return {
    ...row,
    price_uzs: Number(row.price_uzs),
    old_price_uzs: row.old_price_uzs ? Number(row.old_price_uzs) : null,
    in_stock: Number(row.in_stock),
    is_popular: Number(row.is_popular)
  };
}

function normalizeOrder(row) {
  if (!row) return null;
  return {
    ...row,
    total_uzs: Number(row.total_uzs)
  };
}

// Serve client static build if present
const clientDistPath = path.join(__dirname, '../client/dist');
const clientPublicPath = path.join(__dirname, '../client/public');
app.use(express.static(clientDistPath));
app.use(express.static(clientPublicPath));

// 0. Health & Neon Services Status Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await query('SELECT current_database() AS db, version() AS version');
    const counts = await query(`
      SELECT
        (SELECT COUNT(*) FROM categories)::int AS categories_count,
        (SELECT COUNT(*) FROM products)::int AS products_count,
        (SELECT COUNT(*) FROM games)::int AS games_count,
        (SELECT COUNT(*) FROM orders)::int AS orders_count
    `);
    const storageHealth = await checkStorageHealth();
    const tgConfig = getTelegramConfig();
    const stripeStatus = await getStripeStatus();

    res.json({
      ok: true,
      neon: {
        branch: process.env.NEON_BRANCH || 'production',
        branchId: process.env.NEON_BRANCH_ID || null,
        postgres: {
          connected: true,
          database: dbCheck.rows[0]?.db,
          ...counts.rows[0]
        },
        objectStorage: storageHealth
      },
      telegram: {
        configured: Boolean(tgConfig.botToken && tgConfig.chatId),
        botName: tgConfig.botName,
        chatId: tgConfig.chatId
      },
      stripe: stripeStatus
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 1. Categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name_ru, name_uz, icon, sort_order FROM categories ORDER BY sort_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Products Catalog
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let sql = `
      SELECT id, category_id, name_ru, name_uz, brand, model,
             price_uzs, old_price_uzs, image, in_stock, specs_json,
             description_ru, description_uz, is_popular
      FROM products
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      sql += ` AND (name_ru ILIKE $${idx} OR name_uz ILIKE $${idx} OR brand ILIKE $${idx} OR model ILIKE $${idx})`;
    }

    if (sort === 'price_asc') {
      sql += ' ORDER BY price_uzs ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY price_uzs DESC';
    } else if (sort === 'popular') {
      sql += ' ORDER BY is_popular DESC, price_uzs DESC';
    } else {
      sql += ' ORDER BY id ASC';
    }

    const result = await query(sql, params);
    res.json(result.rows.map(normalizeProduct));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Single Product
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, category_id, name_ru, name_uz, brand, model,
              price_uzs, old_price_uzs, image, in_stock, specs_json,
              description_ru, description_uz, is_popular
       FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(normalizeProduct(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add / Update Product from Admin Panel (supports image upload to Neon Object Storage)
app.post('/api/products', upload.single('image_file'), async (req, res) => {
  try {
    const {
      id,
      category_id,
      name_ru,
      name_uz,
      brand,
      model,
      price_uzs,
      old_price_uzs,
      image,
      in_stock,
      specs_json,
      description_ru,
      description_uz,
      is_popular
    } = req.body;

    const prodId = id || `${category_id}-${Date.now().toString(36)}`;
    let imageUrl = image || `/products/${prodId}.svg`;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.png';
      const storageKey = `products/${prodId}${ext}`;
      await uploadToNeonStorage(storageKey, req.file.buffer, req.file.mimetype);
      imageUrl = `/api/storage/${encodeURIComponent(storageKey)}`;
    }

    await query(
      `INSERT INTO products (
        id, category_id, name_ru, name_uz, brand, model, price_uzs, old_price_uzs,
        image, in_stock, specs_json, description_ru, description_uz, is_popular
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name_ru = EXCLUDED.name_ru,
        name_uz = EXCLUDED.name_uz,
        brand = EXCLUDED.brand,
        model = EXCLUDED.model,
        price_uzs = EXCLUDED.price_uzs,
        old_price_uzs = EXCLUDED.old_price_uzs,
        image = EXCLUDED.image,
        in_stock = EXCLUDED.in_stock,
        specs_json = EXCLUDED.specs_json,
        description_ru = EXCLUDED.description_ru,
        description_uz = EXCLUDED.description_uz,
        is_popular = EXCLUDED.is_popular`,
      [
        prodId,
        category_id || 'cpu',
        name_ru || model,
        name_uz || name_ru || model,
        brand || 'Brand',
        model || name_ru,
        Number(price_uzs) || 0,
        old_price_uzs ? Number(old_price_uzs) : null,
        imageUrl,
        Number(in_stock ?? 10),
        typeof specs_json === 'string' ? specs_json : JSON.stringify(specs_json || {}),
        description_ru || '',
        description_uz || '',
        Number(is_popular ?? 0)
      ]
    );

    const created = await query('SELECT * FROM products WHERE id = $1', [prodId]);
    res.status(201).json(normalizeProduct(created.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Heavy Games Benchmark Database
app.get('/api/games', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, genre_ru, genre_uz, year, cover_image,
              base_fps_1080p_high, gpu_weight, cpu_weight, ram_rec_gb,
              description_ru, description_uz
       FROM games ORDER BY year DESC, title ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add custom game
app.post('/api/games', async (req, res) => {
  try {
    const {
      id, title, genre_ru, genre_uz, year, cover_image,
      base_fps_1080p_high, gpu_weight, cpu_weight, ram_rec_gb,
      description_ru, description_uz
    } = req.body;

    const gameId = id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await query(
      `INSERT INTO games (
        id, title, genre_ru, genre_uz, year, cover_image,
        base_fps_1080p_high, gpu_weight, cpu_weight, ram_rec_gb,
        description_ru, description_uz
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        genre_ru = EXCLUDED.genre_ru,
        genre_uz = EXCLUDED.genre_uz,
        year = EXCLUDED.year,
        cover_image = EXCLUDED.cover_image,
        base_fps_1080p_high = EXCLUDED.base_fps_1080p_high,
        gpu_weight = EXCLUDED.gpu_weight,
        cpu_weight = EXCLUDED.cpu_weight,
        ram_rec_gb = EXCLUDED.ram_rec_gb,
        description_ru = EXCLUDED.description_ru,
        description_uz = EXCLUDED.description_uz`,
      [
        gameId,
        title,
        genre_ru || title,
        genre_uz || title,
        Number(year) || new Date().getFullYear(),
        cover_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        Number(base_fps_1080p_high) || 60,
        Number(gpu_weight) || 0.75,
        Number(cpu_weight) || 0.25,
        Number(ram_rec_gb) || 16,
        description_ru || '',
        description_uz || ''
      ]
    );

    const created = await query('SELECT * FROM games WHERE id = $1', [gameId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Compatibility Verification Endpoint
app.post('/api/builder/validate', async (req, res) => {
  try {
    const { parts, lang = 'ru' } = req.body;
    if (!parts) return res.status(400).json({ error: 'Missing parts object' });

    const ids = Object.values(parts).filter(Boolean);
    let productMap = {};
    if (ids.length > 0) {
      const result = await query('SELECT * FROM products WHERE id = ANY($1::text[])', [ids]);
      for (const row of result.rows) {
        productMap[row.id] = normalizeProduct(row);
      }
    }

    const components = {
      cpu: parts.cpuId ? productMap[parts.cpuId] || null : null,
      motherboard: parts.motherboardId ? productMap[parts.motherboardId] || null : null,
      gpu: parts.gpuId ? productMap[parts.gpuId] || null : null,
      ram: parts.ramId ? productMap[parts.ramId] || null : null,
      storage: parts.storageId ? productMap[parts.storageId] || null : null,
      psu: parts.psuId ? productMap[parts.psuId] || null : null,
      casePart: parts.caseId ? productMap[parts.caseId] || null : null,
      cooler: parts.coolerId ? productMap[parts.coolerId] || null : null
    };

    const report = checkCompatibility(components, lang);
    res.json({
      ...report,
      components
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. FPS Calculation Endpoint
app.post('/api/fps/calculate', async (req, res) => {
  try {
    const { cpuId, gpuId, ramId, resolution = '1080p', gameId } = req.body;
    const ids = [cpuId, gpuId, ramId].filter(Boolean);
    let productMap = {};
    if (ids.length > 0) {
      const prodRes = await query('SELECT * FROM products WHERE id = ANY($1::text[])', [ids]);
      for (const row of prodRes.rows) {
        productMap[row.id] = normalizeProduct(row);
      }
    }

    const cpu = cpuId ? productMap[cpuId] || null : null;
    const gpu = gpuId ? productMap[gpuId] || null : null;
    const ram = ramId ? productMap[ramId] || null : null;

    if (gameId) {
      const gRes = await query('SELECT * FROM games WHERE id = $1', [gameId]);
      if (gRes.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
      const fpsResult = calculateFpsForGame(gRes.rows[0], cpu, gpu, ram, resolution);
      return res.json(fpsResult);
    }

    const gamesRes = await query('SELECT * FROM games ORDER BY year DESC, title ASC');
    const results = calculateAllGamesFps(gamesRes.rows, cpu, gpu, ram, resolution);
    res.json({
      resolution,
      gamesCount: results.length,
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Orders Endpoint (with Receipt Upload to Neon Object Storage + Telegram Bot Dispatch)
app.post('/api/orders', upload.single('receipt'), async (req, res) => {
  try {
    const { customer_name, phone, telegram_username, total_uzs } = req.body;
    let items = req.body.items;
    let build_specs = req.body.build_specs;

    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    if (typeof build_specs === 'string') {
      try { build_specs = JSON.parse(build_specs); } catch (e) { build_specs = null; }
    }

    if (!customer_name || !phone || !total_uzs) {
      return res.status(400).json({ error: 'Customer name, phone and total are required' });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Пожалуйста, прикрепите чек оплаты (картинку JPG/PNG/WEBP или PDF файл)'
      });
    }

    const orderId =
      'ORD-' +
      Date.now().toString(36).toUpperCase() +
      '-' +
      Math.floor(Math.random() * 899 + 100);

    // 1. Upload receipt file to Neon Object Storage (`assets` bucket)
    const safeFilename = (req.file.originalname || 'receipt')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-80);
    const receiptKey = `receipts/${orderId}/${Date.now()}-${safeFilename}`;

    await uploadToNeonStorage(receiptKey, req.file.buffer, req.file.mimetype);

    // Generate a presigned URL from Neon Object Storage
    let presignedUrl = null;
    try {
      presignedUrl = await getPresignedObjectUrl(receiptKey, 86400); // 24h link for Telegram & Admin
    } catch (e) {
      console.warn('Could not presign URL:', e.message);
    }

    // 2. Insert order row (with receipt_key) into Neon Lakebase Postgres
    const insertRes = await query(
      `INSERT INTO orders (
        id, customer_name, phone, telegram_username, total_uzs,
        items_json, build_specs_json, receipt_key, receipt_filename, receipt_mime_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *`,
      [
        orderId,
        customer_name,
        phone,
        telegram_username || '',
        Number(total_uzs),
        JSON.stringify(items || []),
        JSON.stringify(build_specs || null),
        receiptKey,
        req.file.originalname,
        req.file.mimetype
      ]
    );

    const order = normalizeOrder(insertRes.rows[0]);

    // 3. Send receipt & order details to Telegram Bot (good_pc_builder_bot -> chat 3540653)
    const tgResult = await sendOrderToTelegram({
      order,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      receiptUrl: presignedUrl
    });

    await query(
      `UPDATE orders SET telegram_sent = $1, telegram_error = $2 WHERE id = $3`,
      [Boolean(tgResult.ok), tgResult.error || null, orderId]
    );

    order.telegram_sent = Boolean(tgResult.ok);
    order.telegram_error = tgResult.error || null;
    order.receipt_url = `/api/orders/${orderId}/receipt`;
    order.receipt_presigned_url = presignedUrl;

    res.status(201).json({
      success: true,
      message_ru: 'Заказ оформлен! Чек сохранен в Neon Storage и отправлен в Telegram.',
      message_uz: 'Buyurtma qabul qilindi! To\'lov cheki saqlandi va Telegramga yuborildi.',
      telegram: tgResult,
      order
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (for /admin panel) with presigned Neon Object Storage receipt URLs
app.get('/api/orders', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = await Promise.all(
      result.rows.map(async (row) => {
        const ord = normalizeOrder(row);
        ord.receipt_url = ord.receipt_key ? `/api/orders/${ord.id}/receipt` : null;
        if (ord.receipt_key) {
          try {
            ord.receipt_presigned_url = await getPresignedObjectUrl(ord.receipt_key, 3600);
          } catch (e) {
            ord.receipt_presigned_url = null;
          }
        }
        return ord;
      })
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve/stream order receipt file directly from Neon Object Storage
app.get('/api/orders/:id/receipt', async (req, res) => {
  try {
    const result = await query(
      'SELECT receipt_key, receipt_filename, receipt_mime_type FROM orders WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0 || !result.rows[0].receipt_key) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const { receipt_key, receipt_filename, receipt_mime_type } = result.rows[0];
    const fileObj = await downloadFromNeonStorage(receipt_key);

    res.setHeader('Content-Type', receipt_mime_type || fileObj.contentType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(receipt_filename || 'receipt')}"`
    );
    res.send(fileObj.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve any custom stored asset from Neon Object Storage
app.get('/api/storage/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const fileObj = await downloadFromNeonStorage(key);
    res.setHeader('Content-Type', fileObj.contentType);
    res.send(fileObj.buffer);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Update Order Status in /admin
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(normalizeOrder(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Re-send order receipt to Telegram from /admin
app.post('/api/orders/:id/resend-telegram', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = normalizeOrder(result.rows[0]);
    let fileBuffer = null;
    let presignedUrl = null;

    if (order.receipt_key) {
      const downloaded = await downloadFromNeonStorage(order.receipt_key);
      fileBuffer = downloaded.buffer;
      presignedUrl = await getPresignedObjectUrl(order.receipt_key, 86400);
    }

    const tgResult = await sendOrderToTelegram({
      order,
      fileBuffer,
      fileName: order.receipt_filename,
      mimeType: order.receipt_mime_type,
      receiptUrl: presignedUrl
    });

    await query(
      'UPDATE orders SET telegram_sent = $1, telegram_error = $2 WHERE id = $3',
      [Boolean(tgResult.ok), tgResult.error || null, order.id]
    );

    res.json({
      success: Boolean(tgResult.ok),
      telegram: tgResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback for Single Page Application (including /admin route)
// ============================================================================
// 8. STRIPE ENDPOINTS (Payments, Billing, Connect, Invoicing, Tax)
// ============================================================================

app.get('/api/stripe/status', async (req, res) => {
  try {
    const status = await getStripeStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Payments + Tax: Create Checkout Session for Cart / Custom PC Order
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      telegram_username,
      total_uzs,
      items = [],
      build_specs = null,
      enable_tax = false,
      create_invoice = false
    } = req.body;

    if (!customer_name || !phone || !total_uzs) {
      return res.status(400).json({ error: 'Customer name, phone and total_uzs are required' });
    }

    const orderId =
      'ORD-' +
      Date.now().toString(36).toUpperCase() +
      '-' +
      Math.floor(Math.random() * 899 + 100);

    const originUrl = `${req.protocol}://${req.get('host')}`;

    const insertRes = await query(
      `INSERT INTO orders (
        id, customer_name, phone, telegram_username, total_uzs,
        items_json, build_specs_json, payment_method, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'stripe', 'pending')
      RETURNING *`,
      [
        orderId,
        customer_name,
        phone,
        telegram_username || '',
        Number(total_uzs),
        JSON.stringify(items || []),
        JSON.stringify(build_specs || null)
      ]
    );

    const order = normalizeOrder(insertRes.rows[0]);

    // 1. Create Stripe Checkout Session (Payments + Tax)
    const session = await createCheckoutSession({
      order,
      items,
      originUrl,
      enableTax: Boolean(enable_tax)
    });

    // 2. Optionally also generate a Stripe Hosted Invoice (Invoicing)
    let invoiceData = null;
    if (create_invoice) {
      try {
        invoiceData = await createOrderInvoice({ order, items });
      } catch (invErr) {
        console.warn('Optional invoice generation warning:', invErr.message);
      }
    }

    await query(
      `UPDATE orders
       SET stripe_session_id = $1,
           stripe_payment_url = $2,
           stripe_invoice_id = COALESCE($3, stripe_invoice_id),
           stripe_invoice_url = COALESCE($4, stripe_invoice_url),
           stripe_invoice_pdf = COALESCE($5, stripe_invoice_pdf)
       WHERE id = $6`,
      [
        session.id,
        session.url,
        invoiceData?.invoiceId || null,
        invoiceData?.hostedInvoiceUrl || null,
        invoiceData?.invoicePdf || null,
        orderId
      ]
    );

    order.stripe_session_id = session.id;
    order.stripe_payment_url = session.url;
    if (invoiceData) {
      order.stripe_invoice_id = invoiceData.invoiceId;
      order.stripe_invoice_url = invoiceData.hostedInvoiceUrl;
      order.stripe_invoice_pdf = invoiceData.invoicePdf;
    }

    // Notify Telegram Bot about the Stripe order
    const tgResult = await sendOrderToTelegram({
      order: {
        ...order,
        receipt_filename: `Stripe Checkout (${session.id})`
      }
    });

    await query(
      'UPDATE orders SET telegram_sent = $1, telegram_error = $2 WHERE id = $3',
      [Boolean(tgResult.ok), tgResult.error || null, orderId]
    );

    res.status(201).json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      invoice: invoiceData,
      order
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify Stripe Checkout Session after redirect
app.get('/api/stripe/verify-session/:sessionId', async (req, res) => {
  try {
    const session = await retrieveCheckoutSession(req.params.sessionId);
    const orderId = session.client_reference_id || session.metadata?.order_id;
    if (orderId && session.payment_status === 'paid') {
      await query('UPDATE orders SET status = $1 WHERE id = $2', ['paid', orderId]);
    }
    res.json({
      id: session.id,
      paymentStatus: session.payment_status,
      amountTotalUsd: ((session.amount_total || 0) / 100).toFixed(2),
      orderId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Invoicing: Generate a finalized Stripe Hosted Invoice & PDF for any Order
app.post('/api/stripe/invoice/:orderId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = normalizeOrder(result.rows[0]);
    let items = [];
    try {
      items = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : (order.items_json || []);
    } catch (e) {
      items = [];
    }

    const invoice = await createOrderInvoice({
      order,
      items,
      customerEmail: req.body?.email
    });

    await query(
      `UPDATE orders
       SET stripe_invoice_id = $1, stripe_invoice_url = $2, stripe_invoice_pdf = $3
       WHERE id = $4`,
      [invoice.invoiceId, invoice.hostedInvoiceUrl, invoice.invoicePdf, order.id]
    );

    res.json({
      success: true,
      invoice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Billing: Create a recurring VIP PC Care Subscription Checkout Session
app.post('/api/stripe/billing/subscribe', async (req, res) => {
  try {
    const originUrl = `${req.protocol}://${req.get('host')}`;
    const session = await createBillingSubscriptionSession({
      planName: req.body?.planName || 'HYPER PC CARE PRO — Подписка на сервисное обслуживание и гарантию',
      monthlyUsdCents: Number(req.body?.monthlyUsdCents) || 1500,
      customerName: req.body?.customerName || 'VIP Client',
      originUrl
    });
    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Connect: Create a Connected Partner Account & Onboarding Link
app.post('/api/stripe/connect/onboard', async (req, res) => {
  try {
    const originUrl = `${req.protocol}://${req.get('host')}`;
    const result = await createConnectedSellerAccount({
      email: req.body?.email,
      businessName: req.body?.businessName,
      originUrl
    });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stripe Tax: Calculate tax for an order amount
app.post('/api/stripe/tax/calculate', async (req, res) => {
  try {
    const result = await calculateOrderTax({
      totalUzs: req.body?.total_uzs || 5000000,
      country: req.body?.country || 'UZ',
      postalCode: req.body?.postalCode || '100000',
      city: req.body?.city || 'Tashkent'
    });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback for Single Page Application (including /admin route)
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

async function startServer() {
  try {
    await initDbSchema();
    schemaReadyPromise = Promise.resolve();
    const countRes = await query('SELECT COUNT(*)::int AS cnt FROM products');
    if ((countRes.rows[0]?.cnt || 0) === 0) {
      console.log('Database is empty, running initial seed...');
      await seedDatabase();
    }
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT} (Neon Postgres + Neon Object Storage '${BUCKET_NAME}')`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
