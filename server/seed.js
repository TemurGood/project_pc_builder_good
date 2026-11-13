const { query, initDbSchema, pool } = require('./db');

const categories = [
  { id: 'cpu', name_ru: 'Процессоры', name_uz: 'Protsessorlar', icon: 'Cpu', sort_order: 1 },
  { id: 'motherboard', name_ru: 'Материнские платы', name_uz: 'Ona platalar', icon: 'CircuitBoard', sort_order: 2 },
  { id: 'gpu', name_ru: 'Видеокарты', name_uz: 'Videokartalar', icon: 'Tv', sort_order: 3 },
  { id: 'ram', name_ru: 'Оперативная память', name_uz: 'Tezkor xotira (RAM)', icon: 'Layers', sort_order: 4 },
  { id: 'storage', name_ru: 'Накопители (SSD/HDD)', name_uz: 'Xotira disklari (SSD/HDD)', icon: 'HardDrive', sort_order: 5 },
  { id: 'cooler', name_ru: 'Кулеры и СЖО', name_uz: 'Sovutish tizimlari', icon: 'Fan', sort_order: 6 },
  { id: 'psu', name_ru: 'Блоки питания', name_uz: 'Quvvat bloklari', icon: 'Zap', sort_order: 7 },
  { id: 'case', name_ru: 'Корпуса', name_uz: 'Kompyuter korpuslari', icon: 'Box', sort_order: 8 }
];

const products = [
  // CPUs
  {
    id: 'cpu-7800x3d',
    category_id: 'cpu',
    name_ru: 'AMD Ryzen 7 7800X3D',
    name_uz: 'AMD Ryzen 7 7800X3D',
    brand: 'AMD',
    model: 'Ryzen 7 7800X3D',
    price_uzs: 5400000,
    old_price_uzs: 5800000,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
    in_stock: 14,
    specs_json: JSON.stringify({
      socket: 'AM5',
      cores: 8,
      threads: 16,
      base_clock_ghz: 4.2,
      boost_clock_ghz: 5.0,
      tdp: 120,
      ram_type: 'DDR5',
      benchmark_score: 100 // Top gaming tier
    }),
    description_ru: 'Лучший игровой процессор в мире с технологией 3D V-Cache (96 МБ кэша L3), непревзойденный FPS.',
    description_uz: 'Dunyoning eng yaxshi o\'yin protsessori 3D V-Cache texnologiyasi bilan, tengsiz FPS ko\'rsatkichlari.',
    is_popular: 1
  },
  {
    id: 'cpu-7600x',
    category_id: 'cpu',
    name_ru: 'AMD Ryzen 5 7600X',
    name_uz: 'AMD Ryzen 5 7600X',
    brand: 'AMD',
    model: 'Ryzen 5 7600X',
    price_uzs: 2850000,
    old_price_uzs: 3100000,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
    in_stock: 22,
    specs_json: JSON.stringify({
      socket: 'AM5',
      cores: 6,
      threads: 12,
      base_clock_ghz: 4.7,
      boost_clock_ghz: 5.3,
      tdp: 105,
      ram_type: 'DDR5',
      benchmark_score: 78
    }),
    description_ru: 'Отличный сбалансированный процессор для сокета AM5, быстрые 6 ядер Zen 4.',
    description_uz: 'AM5 soketi uchun ajoyib muvozanatli protsessor, tezkor 6 ta Zen 4 yadrolari.',
    is_popular: 1
  },
  {
    id: 'cpu-14700k',
    category_id: 'cpu',
    name_ru: 'Intel Core i7-14700K',
    name_uz: 'Intel Core i7-14700K',
    brand: 'Intel',
    model: 'Core i7-14700K',
    price_uzs: 5650000,
    old_price_uzs: 6100000,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
    in_stock: 9,
    specs_json: JSON.stringify({
      socket: 'LGA1700',
      cores: 20,
      threads: 28,
      base_clock_ghz: 3.4,
      boost_clock_ghz: 5.6,
      tdp: 253,
      ram_type: 'DDR5',
      benchmark_score: 96
    }),
    description_ru: 'Мощный 20-ядерный процессор для хардкорных игр, стриминга и тяжелого рендера.',
    description_uz: 'O\'yinlar, striming va og\'ir montaj ishlari uchun kuchli 20 yadroli protsessor.',
    is_popular: 1
  },
  {
    id: 'cpu-13400f',
    category_id: 'cpu',
    name_ru: 'Intel Core i5-13400F',
    name_uz: 'Intel Core i5-13400F',
    brand: 'Intel',
    model: 'Core i5-13400F',
    price_uzs: 2300000,
    old_price_uzs: 2500000,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
    in_stock: 30,
    specs_json: JSON.stringify({
      socket: 'LGA1700',
      cores: 10,
      threads: 16,
      base_clock_ghz: 2.5,
      boost_clock_ghz: 4.6,
      tdp: 65,
      ram_type: 'DDR4',
      benchmark_score: 65
    }),
    description_ru: 'Народный хит для среднебюджетных игровых сборок, 10 ядер.',
    description_uz: 'O\'rta byudjetli o\'yin kompyuterlari uchun mashhur 10 yadroli protsessor.',
    is_popular: 1
  },
  {
    id: 'cpu-5600x',
    category_id: 'cpu',
    name_ru: 'AMD Ryzen 5 5600X',
    name_uz: 'AMD Ryzen 5 5600X',
    brand: 'AMD',
    model: 'Ryzen 5 5600X',
    price_uzs: 1650000,
    old_price_uzs: 1850000,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
    in_stock: 18,
    specs_json: JSON.stringify({
      socket: 'AM4',
      cores: 6,
      threads: 12,
      base_clock_ghz: 3.7,
      boost_clock_ghz: 4.6,
      tdp: 65,
      ram_type: 'DDR4',
      benchmark_score: 56
    }),
    description_ru: 'Доступный и холодный 6-ядерный процессор для платформы AM4.',
    description_uz: 'AM4 platformasi uchun hamyonbop va sovuq ishlovchi 6 yadroli protsessor.',
    is_popular: 0
  },

  // Motherboards
  {
    id: 'mb-b650-tomahawk',
    category_id: 'motherboard',
    name_ru: 'MSI MAG B650 TOMAHAWK WIFI',
    name_uz: 'MSI MAG B650 TOMAHAWK WIFI',
    brand: 'MSI',
    model: 'MAG B650 TOMAHAWK WIFI',
    price_uzs: 2950000,
    old_price_uzs: 3200000,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    in_stock: 12,
    specs_json: JSON.stringify({
      socket: 'AM5',
      chipset: 'B650',
      form_factor: 'ATX',
      ram_type: 'DDR5',
      ram_slots: 4,
      max_ram_gb: 192,
      m2_slots: 3,
      sata_ports: 6
    }),
    description_ru: 'Надежная материнская плата AM5 с усиленной системой питания VRM и Wi-Fi 6E.',
    description_uz: 'AM5 uchun ishonchli ona plata, mustahkam VRM quvvat tizimi va Wi-Fi 6E bilan.',
    is_popular: 1
  },
  {
    id: 'mb-b650m-ds3h',
    category_id: 'motherboard',
    name_ru: 'GIGABYTE B650M DS3H',
    name_uz: 'GIGABYTE B650M DS3H',
    brand: 'GIGABYTE',
    model: 'B650M DS3H',
    price_uzs: 1850000,
    old_price_uzs: 2050000,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    in_stock: 19,
    specs_json: JSON.stringify({
      socket: 'AM5',
      chipset: 'B650',
      form_factor: 'Micro-ATX',
      ram_type: 'DDR5',
      ram_slots: 4,
      max_ram_gb: 128,
      m2_slots: 2,
      sata_ports: 4
    }),
    description_ru: 'Компактная Micro-ATX плата на сокете AM5 по демократичной цене.',
    description_uz: 'AM5 soketidagi hamyonbop va ixcham Micro-ATX ona plata.',
    is_popular: 1
  },
  {
    id: 'mb-z790-aorus-elite',
    category_id: 'motherboard',
    name_ru: 'GIGABYTE Z790 AORUS ELITE AX',
    name_uz: 'GIGABYTE Z790 AORUS ELITE AX',
    brand: 'GIGABYTE',
    model: 'Z790 AORUS ELITE AX',
    price_uzs: 3750000,
    old_price_uzs: 4100000,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    in_stock: 8,
    specs_json: JSON.stringify({
      socket: 'LGA1700',
      chipset: 'Z790',
      form_factor: 'ATX',
      ram_type: 'DDR5',
      ram_slots: 4,
      max_ram_gb: 192,
      m2_slots: 4,
      sata_ports: 6
    }),
    description_ru: 'Флагманская плата для процессоров Intel 13-14 поколений, разгон и максимум разъёмов.',
    description_uz: 'Intel 13-14 avlod protsessorlari uchun flagman ona plata, yuqori quvvat va ko\'p portlar.',
    is_popular: 1
  },
  {
    id: 'mb-b760m-ddr4',
    category_id: 'motherboard',
    name_ru: 'ASUS PRIME B760M-K D4',
    name_uz: 'ASUS PRIME B760M-K D4',
    brand: 'ASUS',
    model: 'PRIME B760M-K D4',
    price_uzs: 1450000,
    old_price_uzs: 1600000,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    in_stock: 25,
    specs_json: JSON.stringify({
      socket: 'LGA1700',
      chipset: 'B760',
      form_factor: 'Micro-ATX',
      ram_type: 'DDR4',
      ram_slots: 2,
      max_ram_gb: 64,
      m2_slots: 2,
      sata_ports: 4
    }),
    description_ru: 'Бюджетная надежная плата с поддержкой оперативной памяти DDR4.',
    description_uz: 'DDR4 tezkor xotirasini qo\'llab-quvvatlaydigan ishonchli byudjetli ona plata.',
    is_popular: 0
  },
  {
    id: 'mb-b550-gaming-plus',
    category_id: 'motherboard',
    name_ru: 'MSI MPG B550 GAMING PLUS',
    name_uz: 'MSI MPG B550 GAMING PLUS',
    brand: 'MSI',
    model: 'MPG B550 GAMING PLUS',
    price_uzs: 1750000,
    old_price_uzs: 1950000,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    in_stock: 14,
    specs_json: JSON.stringify({
      socket: 'AM4',
      chipset: 'B550',
      form_factor: 'ATX',
      ram_type: 'DDR4',
      ram_slots: 4,
      max_ram_gb: 128,
      m2_slots: 2,
      sata_ports: 6
    }),
    description_ru: 'Классическая плата для сокета AM4 с подсветкой Mystic Light.',
    description_uz: 'AM4 soketi uchun klassik sifatli o\'yin platasi.',
    is_popular: 0
  },

  // GPUs
  {
    id: 'gpu-rtx-4090',
    category_id: 'gpu',
    name_ru: 'ASUS ROG Strix GeForce RTX 4090 OC 24GB',
    name_uz: 'ASUS ROG Strix GeForce RTX 4090 OC 24GB',
    brand: 'ASUS',
    model: 'RTX 4090 24GB',
    price_uzs: 26500000,
    old_price_uzs: 28000000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 4,
    specs_json: JSON.stringify({
      vram_gb: 24,
      length_mm: 357,
      tdp: 450,
      recommended_psu: 1000,
      benchmark_score: 100 // Ultimate baseline
    }),
    description_ru: 'Абсолютный флагман для максимальных настроек в 4K с трассировкой лучей и DLSS 3.5.',
    description_uz: '4K o\'lchamda nurlarni kuzatish va DLSS 3.5 bilan mutlaq yetakchi videokarta.',
    is_popular: 1
  },
  {
    id: 'gpu-rtx-4080s',
    category_id: 'gpu',
    name_ru: 'Palit GeForce RTX 4080 SUPER GamingPro 16GB',
    name_uz: 'Palit GeForce RTX 4080 SUPER GamingPro 16GB',
    brand: 'Palit',
    model: 'RTX 4080 SUPER 16GB',
    price_uzs: 14200000,
    old_price_uzs: 15300000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 7,
    specs_json: JSON.stringify({
      vram_gb: 16,
      length_mm: 329,
      tdp: 320,
      recommended_psu: 850,
      benchmark_score: 86
    }),
    description_ru: 'Топовая видеокарта для бескомпромиссного 1440p и 4K гейминга.',
    description_uz: '1440p va 4K formatda eng yuqori darajada o\'yin o\'ynash uchun yuqori darajadagi videokarta.',
    is_popular: 1
  },
  {
    id: 'gpu-rtx-4070s',
    category_id: 'gpu',
    name_ru: 'Gigabyte GeForce RTX 4070 SUPER WINDFORCE OC 12GB',
    name_uz: 'Gigabyte GeForce RTX 4070 SUPER WINDFORCE OC 12GB',
    brand: 'Gigabyte',
    model: 'RTX 4070 SUPER 12GB',
    price_uzs: 8700000,
    old_price_uzs: 9300000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 15,
    specs_json: JSON.stringify({
      vram_gb: 12,
      length_mm: 261,
      tdp: 220,
      recommended_psu: 650,
      benchmark_score: 68
    }),
    description_ru: 'Идеальный выбор для 2K (1440p) разрешения с ультра настройками.',
    description_uz: '2K (1440p) o\'lchamda ultra sozlamalar uchun eng maqbul tanlov.',
    is_popular: 1
  },
  {
    id: 'gpu-rtx-4060',
    category_id: 'gpu',
    name_ru: 'MSI GeForce RTX 4060 VENTUS 2X Black 8GB',
    name_uz: 'MSI GeForce RTX 4060 VENTUS 2X Black 8GB',
    brand: 'MSI',
    model: 'RTX 4060 8GB',
    price_uzs: 4350000,
    old_price_uzs: 4700000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 24,
    specs_json: JSON.stringify({
      vram_gb: 8,
      length_mm: 199,
      tdp: 115,
      recommended_psu: 550,
      benchmark_score: 42
    }),
    description_ru: 'Холодная и энергоэффективная видеокарта для комфортного 1080p гейминга с генерацией кадров.',
    description_uz: 'Kadrlar generatsiyasi bilan 1080p o\'yinlar uchun juda tejamkor videokarta.',
    is_popular: 1
  },
  {
    id: 'gpu-rx-7800xt',
    category_id: 'gpu',
    name_ru: 'Sapphire PULSE AMD Radeon RX 7800 XT 16GB',
    name_uz: 'Sapphire PULSE AMD Radeon RX 7800 XT 16GB',
    brand: 'Sapphire',
    model: 'RX 7800 XT 16GB',
    price_uzs: 7200000,
    old_price_uzs: 7800000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 10,
    specs_json: JSON.stringify({
      vram_gb: 16,
      length_mm: 280,
      tdp: 263,
      recommended_psu: 700,
      benchmark_score: 66
    }),
    description_ru: '16 ГБ видеопамяти и мощный чип RDNA 3 по очень выгодной цене.',
    description_uz: '16 GB videoxotira va qulay narxdagi kuchli RDNA 3 grafik chipi.',
    is_popular: 0
  },

  // RAM
  {
    id: 'ram-ddr5-32-6000',
    category_id: 'ram',
    name_ru: 'Kingston FURY Beast Black RGB DDR5 32GB (2x16GB) 6000MHz',
    name_uz: 'Kingston FURY Beast Black RGB DDR5 32GB (2x16GB) 6000MHz',
    brand: 'Kingston',
    model: 'FURY Beast DDR5 32GB 6000MHz',
    price_uzs: 1750000,
    old_price_uzs: 1950000,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
    in_stock: 28,
    specs_json: JSON.stringify({
      ram_type: 'DDR5',
      capacity_gb: 32,
      speed_mhz: 6000,
      modules_count: 2,
      latency: 'CL30'
    }),
    description_ru: 'Оптимальная быстрая оперативная память DDR5 с низкими таймингами CL30 и RGB подсветкой.',
    description_uz: 'Past CL30 tayminglariga ega optimal tezkor DDR5 xotira va RGB chiroqlar.',
    is_popular: 1
  },
  {
    id: 'ram-ddr5-64-6000',
    category_id: 'ram',
    name_ru: 'Corsair Vengeance RGB DDR5 64GB (2x32GB) 6000MHz',
    name_uz: 'Corsair Vengeance RGB DDR5 64GB (2x32GB) 6000MHz',
    brand: 'Corsair',
    model: 'Vengeance DDR5 64GB 6000MHz',
    price_uzs: 3200000,
    old_price_uzs: 3500000,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
    in_stock: 11,
    specs_json: JSON.stringify({
      ram_type: 'DDR5',
      capacity_gb: 64,
      speed_mhz: 6000,
      modules_count: 2,
      latency: 'CL32'
    }),
    description_ru: '64 ГБ оперативной памяти для тяжелых игр, 3D рендера и стриминга.',
    description_uz: 'Og\'ir o\'yinlar va professional 3D ishlar uchun 64 GB tezkor xotira.',
    is_popular: 0
  },
  {
    id: 'ram-ddr4-16-3200',
    category_id: 'ram',
    name_ru: 'G.Skill Aegis DDR4 16GB (2x8GB) 3200MHz',
    name_uz: 'G.Skill Aegis DDR4 16GB (2x8GB) 3200MHz',
    brand: 'G.Skill',
    model: 'Aegis DDR4 16GB 3200MHz',
    price_uzs: 580000,
    old_price_uzs: 660000,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
    in_stock: 35,
    specs_json: JSON.stringify({
      ram_type: 'DDR4',
      capacity_gb: 16,
      speed_mhz: 3200,
      modules_count: 2,
      latency: 'CL16'
    }),
    description_ru: 'Надежный комплект DDR4 для доступных игровых систем.',
    description_uz: 'Hamyonbop o\'yin tizimlari uchun ishonchli DDR4 to\'plami.',
    is_popular: 1
  },
  {
    id: 'ram-ddr4-32-3600',
    category_id: 'ram',
    name_ru: 'Kingston FURY Renegade DDR4 32GB (2x16GB) 3600MHz',
    name_uz: 'Kingston FURY Renegade DDR4 32GB (2x16GB) 3600MHz',
    brand: 'Kingston',
    model: 'FURY Renegade DDR4 32GB 3600MHz',
    price_uzs: 1100000,
    old_price_uzs: 1250000,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
    in_stock: 20,
    specs_json: JSON.stringify({
      ram_type: 'DDR4',
      capacity_gb: 32,
      speed_mhz: 3600,
      modules_count: 2,
      latency: 'CL16'
    }),
    description_ru: 'Скоростной комплект DDR4 с частотой 3600 МГц.',
    description_uz: '3600 MGts chastotali tezkor DDR4 to\'plami.',
    is_popular: 0
  },

  // Storage
  {
    id: 'ssd-samsung-990pro-2tb',
    category_id: 'storage',
    name_ru: 'Samsung 990 PRO NVMe M.2 SSD 2TB',
    name_uz: 'Samsung 990 PRO NVMe M.2 SSD 2TB',
    brand: 'Samsung',
    model: '990 PRO 2TB',
    price_uzs: 2450000,
    old_price_uzs: 2750000,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    in_stock: 17,
    specs_json: JSON.stringify({
      storage_type: 'NVMe M.2 PCIe 4.0',
      capacity_gb: 2000,
      read_speed_mb: 7450,
      write_speed_mb: 6900
    }),
    description_ru: 'Сверхбыстрый твердотельный накопитель для мгновенной загрузки игр и работы с файлами.',
    description_uz: 'O\'yinlarni bir zumda yuklash uchun eng tezkor SSD xotira.',
    is_popular: 1
  },
  {
    id: 'ssd-kingston-kc3000-1tb',
    category_id: 'storage',
    name_ru: 'Kingston KC3000 NVMe M.2 SSD 1TB',
    name_uz: 'Kingston KC3000 NVMe M.2 SSD 1TB',
    brand: 'Kingston',
    model: 'KC3000 1TB',
    price_uzs: 1250000,
    old_price_uzs: 1400000,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    in_stock: 25,
    specs_json: JSON.stringify({
      storage_type: 'NVMe M.2 PCIe 4.0',
      capacity_gb: 1000,
      read_speed_mb: 7000,
      write_speed_mb: 6000
    }),
    description_ru: 'Отличный PCIe 4.0 накопитель с графеновым радиатором охлаждения.',
    description_uz: 'Grafen sovutgichli ajoyib PCIe 4.0 yuqori tezlikdagi SSD disk.',
    is_popular: 1
  },
  {
    id: 'ssd-crucial-p3-1tb',
    category_id: 'storage',
    name_ru: 'Crucial P3 Plus M.2 NVMe SSD 1TB',
    name_uz: 'Crucial P3 Plus M.2 NVMe SSD 1TB',
    brand: 'Crucial',
    model: 'P3 Plus 1TB',
    price_uzs: 900000,
    old_price_uzs: 1050000,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    in_stock: 30,
    specs_json: JSON.stringify({
      storage_type: 'NVMe M.2 PCIe 4.0',
      capacity_gb: 1000,
      read_speed_mb: 5000,
      write_speed_mb: 3600
    }),
    description_ru: 'Народный быстрый накопитель M.2 по доступной цене.',
    description_uz: 'Hamyonbop narxdagi ommabop tezkor M.2 diski.',
    is_popular: 0
  },

  // Coolers
  {
    id: 'cooler-deepcool-ak620',
    category_id: 'cooler',
    name_ru: 'DeepCool AK620 Digital Black',
    name_uz: 'DeepCool AK620 Digital Black',
    brand: 'DeepCool',
    model: 'AK620 Digital',
    price_uzs: 980000,
    old_price_uzs: 1100000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 16,
    specs_json: JSON.stringify({
      cooler_type: 'Air Dual Tower',
      height_mm: 162,
      tdp_rating: 260,
      supported_sockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'],
      has_display: true
    }),
    description_ru: 'Двухбашенный суперкулер с цифровым дисплеем температуры и загрузки процессора.',
    description_uz: 'Protsessor harorati va yuklamasini ko\'rsatuvchi raqamli displeyli kuchli havo sovutgichi.',
    is_popular: 1
  },
  {
    id: 'cooler-arctic-liquid-iii-360',
    category_id: 'cooler',
    name_ru: 'ARCTIC Liquid Freezer III 360 A-RGB',
    name_uz: 'ARCTIC Liquid Freezer III 360 A-RGB',
    brand: 'ARCTIC',
    model: 'Liquid Freezer III 360',
    price_uzs: 1750000,
    old_price_uzs: 1950000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 9,
    specs_json: JSON.stringify({
      cooler_type: 'AIO 360mm',
      height_mm: 65,
      tdp_rating: 350,
      supported_sockets: ['AM5', 'AM4', 'LGA1700'],
      has_display: false
    }),
    description_ru: 'Топовая система жидкостного охлаждения с толстым 38-мм радиатором и вентилятором для зоны VRM.',
    description_uz: 'VRM zonasini ham qo\'shimcha sovutuvchi eng zo\'r 360mm suyuqlik sovutish tizimi.',
    is_popular: 1
  },
  {
    id: 'cooler-deepcool-ag400',
    category_id: 'cooler',
    name_ru: 'DeepCool AG400 ARGB',
    name_uz: 'DeepCool AG400 ARGB',
    brand: 'DeepCool',
    model: 'AG400 ARGB',
    price_uzs: 360000,
    old_price_uzs: 420000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    in_stock: 35,
    specs_json: JSON.stringify({
      cooler_type: 'Air Single Tower',
      height_mm: 150,
      tdp_rating: 180,
      supported_sockets: ['AM5', 'AM4', 'LGA1700'],
      has_display: false
    }),
    description_ru: 'Компактный 4-трубочный кулер для 65-120W процессоров с ARGB вентилятором.',
    description_uz: '65-120 Vt quvvatli protsessorlar uchun ARGB chiroqli ixcham 4 naychali kuler.',
    is_popular: 0
  },

  // PSUs
  {
    id: 'psu-corsair-rm850x',
    category_id: 'psu',
    name_ru: 'Corsair RM850x 850W 80 PLUS Gold Fully Modular',
    name_uz: 'Corsair RM850x 850W 80 PLUS Gold Fully Modular',
    brand: 'Corsair',
    model: 'RM850x 850W Gold',
    price_uzs: 2100000,
    old_price_uzs: 2350000,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
    in_stock: 15,
    specs_json: JSON.stringify({
      wattage: 850,
      efficiency: '80 PLUS Gold',
      modular: 'Full Modular',
      pcie_5_ready: true
    }),
    description_ru: 'Золотой стандарт надежности: японские конденсаторы 105°C, тихий полупассивный вентилятор.',
    description_uz: 'Ishonchlilikning oltin standarti: 105°C yapon kondensatorlari va jim sovutish.',
    is_popular: 1
  },
  {
    id: 'psu-deepcool-pl750d',
    category_id: 'psu',
    name_ru: 'DeepCool PL750D 750W 80 PLUS Bronze (PCIe 5.0)',
    name_uz: 'DeepCool PL750D 750W 80 PLUS Bronze (PCIe 5.0)',
    brand: 'DeepCool',
    model: 'PL750D 750W Bronze',
    price_uzs: 920000,
    old_price_uzs: 1050000,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
    in_stock: 22,
    specs_json: JSON.stringify({
      wattage: 750,
      efficiency: '80 PLUS Bronze',
      modular: 'Non-Modular',
      pcie_5_ready: true
    }),
    description_ru: 'Современный блок питания с кабелем 12V-2x6 для новых видеокарт RTX 40 серии.',
    description_uz: 'RTX 40 seriyali yangi videokartalar uchun 12V-2x6 kabelli zamonaviy quvvat bloki.',
    is_popular: 1
  },
  {
    id: 'psu-bequiet-1000w',
    category_id: 'psu',
    name_ru: 'be quiet! Straight Power 12 1000W 80 PLUS Platinum',
    name_uz: 'be quiet! Straight Power 12 1000W 80 PLUS Platinum',
    brand: 'be quiet!',
    model: 'Straight Power 12 1000W',
    price_uzs: 3300000,
    old_price_uzs: 3600000,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
    in_stock: 6,
    specs_json: JSON.stringify({
      wattage: 1000,
      efficiency: '80 PLUS Platinum',
      modular: 'Full Modular',
      pcie_5_ready: true
    }),
    description_ru: 'Платиновый сверхтихий блок питания для бескомпромиссных сборок с RTX 4090.',
    description_uz: 'RTX 4090 bilan quvvatli yig\'malar uchun platina sertifikatli o\'ta jim quvvat bloki.',
    is_popular: 0
  },

  // Cases
  {
    id: 'case-lian-li-o11-dynamic-evo',
    category_id: 'case',
    name_ru: 'Lian Li O11 Dynamic EVO Black',
    name_uz: 'Lian Li O11 Dynamic EVO Black',
    brand: 'Lian Li',
    model: 'O11 Dynamic EVO',
    price_uzs: 2350000,
    old_price_uzs: 2600000,
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80',
    in_stock: 8,
    specs_json: JSON.stringify({
      form_factor_support: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      max_gpu_length_mm: 426,
      max_cooler_height_mm: 167,
      color: 'Black',
      glass_panels: 2
    }),
    description_ru: 'Культовый премиальный корпус-аквариум с панорамным обзором комплектующих и поддержкой СЖО до 360 мм.',
    description_uz: 'Komponentlarni to\'liq ko\'rsatib turuvchi zamonaviy akvarium shaklidagi qora korpus.',
    is_popular: 1
  },
  {
    id: 'case-nzxt-h6-flow',
    category_id: 'case',
    name_ru: 'NZXT H6 Flow RGB White',
    name_uz: 'NZXT H6 Flow RGB White',
    brand: 'NZXT',
    model: 'H6 Flow RGB',
    price_uzs: 1850000,
    old_price_uzs: 2100000,
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80',
    in_stock: 11,
    specs_json: JSON.stringify({
      form_factor_support: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      max_gpu_length_mm: 365,
      max_cooler_height_mm: 165,
      color: 'White',
      glass_panels: 2
    }),
    description_ru: 'Стильный белый корпус с диагональным расположением вентиляторов для идеального прямого продува видеокарты.',
    description_uz: 'Videokartani to\'g\'ridan-to\'g\'ri a\'lo darajada sovutish uchun burchakli ventilyatorli oq korpus.',
    is_popular: 1
  },
  {
    id: 'case-deepcool-matrexx-40',
    category_id: 'case',
    name_ru: 'DeepCool MATREXX 40 3FS (Micro-ATX)',
    name_uz: 'DeepCool MATREXX 40 3FS (Micro-ATX)',
    brand: 'DeepCool',
    model: 'MATREXX 40 3FS',
    price_uzs: 650000,
    old_price_uzs: 750000,
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80',
    in_stock: 20,
    specs_json: JSON.stringify({
      form_factor_support: ['Micro-ATX', 'Mini-ITX'], // NOTE: NO ATX SUPPORT! Perfect for compatibility testing!
      max_gpu_length_mm: 320,
      max_cooler_height_mm: 165,
      color: 'Black',
      glass_panels: 1
    }),
    description_ru: 'Компактный продуваемый Micro-ATX корпус с тремя предустановленными вентиляторами.',
    description_uz: 'Uchta ventilyatorli ixcham va yaxshi shamollatiladigan Micro-ATX korpus.',
    is_popular: 0
  }
];

// 20 Heaviest & Demanding Games
const games = [
  {
    id: 'cyberpunk-2077',
    title: 'Cyberpunk 2077: Phantom Liberty',
    genre_ru: 'Action / RPG в открытом мире',
    genre_uz: 'Ochiq dunyoli Action / RPG',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 68,
    gpu_weight: 0.75,
    cpu_weight: 0.25,
    ram_rec_gb: 16,
    description_ru: 'Тяжелейший эталон графики с трассировкой пути (Overdrive Mode) и высокой плотностью Найт-Сити.',
    description_uz: 'Ray tracing va zich shahar muhiti bilan grafik jihatdan eng talabchan o\'yin.'
  },
  {
    id: 'black-myth-wukong',
    title: 'Black Myth: Wukong',
    genre_ru: 'Action / RPG (Unreal Engine 5)',
    genre_uz: 'Action / RPG (Unreal Engine 5)',
    year: 2024,
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 62,
    gpu_weight: 0.78,
    cpu_weight: 0.22,
    ram_rec_gb: 16,
    description_ru: 'Феноменальный хит на движке Unreal Engine 5 с технологией Nanite и полным Lumen освещением.',
    description_uz: 'Unreal Engine 5 dagi zamonaviy Nanite va to\'liq Lumen texnologiyalariga ega eng yangi xit o\'yin.'
  },
  {
    id: 'alan-wake-2',
    title: 'Alan Wake 2',
    genre_ru: 'Survival Horror / Триллер',
    genre_uz: 'Survival Horror / Triller',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 55,
    gpu_weight: 0.82,
    cpu_weight: 0.18,
    ram_rec_gb: 16,
    description_ru: 'Графический шедевр Remedy с инновационной геометрией Mesh Shaders и фотореализмом.',
    description_uz: 'Mesh Shaders va fotorealizmga ega zamonamizning eng og\'ir grafik durdonasi.'
  },
  {
    id: 'stalker-2',
    title: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl',
    genre_ru: 'Шутер / Выживание / Открытый мир',
    genre_uz: 'Shuter / Omon qolish / Ochiq dunyo',
    year: 2024,
    cover_image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 58,
    gpu_weight: 0.74,
    cpu_weight: 0.26,
    ram_rec_gb: 32,
    description_ru: 'Огромный бесшовный Чернобыль на Unreal Engine 5, создающий экстремальную нагрузку на видеопамять.',
    description_uz: 'Unreal Engine 5 dagi ulkan ochiq hudud, videoxotira va protsessorga juda katta talab qo\'yadi.'
  },
  {
    id: 'starfield',
    title: 'Starfield',
    genre_ru: 'Космическая RPG',
    genre_uz: 'Kosmik RPG',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 64,
    gpu_weight: 0.70,
    cpu_weight: 0.30,
    ram_rec_gb: 16,
    description_ru: 'Огромные космические города Bethesda с сильной нагрузкой на центральный процессор.',
    description_uz: 'Bethesda kompaniyasining protsessor va videokartani kuchli yuklovchi kosmik ochiq dunyosi.'
  },
  {
    id: 'rdr2',
    title: 'Red Dead Redemption 2',
    genre_ru: 'Приключенческий экшен',
    genre_uz: 'Sarguzashtli jangari o\'yin',
    year: 2019,
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 78,
    gpu_weight: 0.72,
    cpu_weight: 0.28,
    ram_rec_gb: 16,
    description_ru: 'Легендарный детализированный Дикий Запад от Rockstar Games с реалистичной физикой и объемным светом.',
    description_uz: 'Rockstar Games tomonidan yaratilgan ajoyib fizika va muhitga ega eng go\'zal o\'yinlardan biri.'
  },
  {
    id: 'hogwarts-legacy',
    title: 'Hogwarts Legacy',
    genre_ru: 'Фэнтези RPG в открытом мире',
    genre_uz: 'Ochiq dunyoli fentezi RPG',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 70,
    gpu_weight: 0.73,
    cpu_weight: 0.27,
    ram_rec_gb: 16,
    description_ru: 'Масштабный Хогвартс с детализированными интерьерами и трассировкой отражений.',
    description_uz: 'Katta sehrli maktab va qasr interyerlari, yuqori videoxotira talab qiladi.'
  },
  {
    id: 'witcher-3-nextgen',
    title: 'The Witcher 3: Wild Hunt (Next-Gen)',
    genre_ru: 'Ролевой экшен',
    genre_uz: 'Rolli action o\'yin',
    year: 2022,
    cover_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 72,
    gpu_weight: 0.76,
    cpu_weight: 0.24,
    ram_rec_gb: 16,
    description_ru: 'Обновленная версия Ведьмака с трассировкой глобального освещения RTGI и 4K текстурами.',
    description_uz: 'RTGI global yoritish va yangilangan 4K teksturalarga ega buyuk RPG o\'yini.'
  },
  {
    id: 'last-of-us-part-1',
    title: 'The Last of Us Part I',
    genre_ru: 'Постапокалиптический экшен',
    genre_uz: 'Post-apokalipsis janridagi sarguzasht',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 66,
    gpu_weight: 0.72,
    cpu_weight: 0.28,
    ram_rec_gb: 16,
    description_ru: 'Эмоциональная кинематографическая драма от Naughty Dog с высокими требованиями к VRAM.',
    description_uz: 'Naughty Dog kompaniyasidan ajoyib sarguzasht, kompyuter resurslariga juda talabchan.'
  },
  {
    id: 'god-of-war-ragnarok',
    title: 'God of War Ragnarök',
    genre_ru: 'Мифологический экшен',
    genre_uz: 'Skandinaviya mifologiyasi jangarisi',
    year: 2024,
    cover_image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 80,
    gpu_weight: 0.74,
    cpu_weight: 0.26,
    ram_rec_gb: 16,
    description_ru: 'Эпическое скандинавское приключение Кратоса и Атрея с детализированной графикой 9 миров.',
    description_uz: 'Kratos va Otreyning to\'qqiz olam bo\'ylab ajoyib va hayratlanarli sarguzashti.'
  },
  {
    id: 'horizon-forbidden-west',
    title: 'Horizon Forbidden West',
    genre_ru: 'Экшен в открытом мире',
    genre_uz: 'Ochiq dunyoli fantastik jangari',
    year: 2024,
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 69,
    gpu_weight: 0.75,
    cpu_weight: 0.25,
    ram_rec_gb: 16,
    description_ru: 'Потрясающая природа, густая растительность и сложнейшие модели механических роботов.',
    description_uz: 'Go\'zal tabiat, yashil o\'rmonlar va robot-hayvonlarning murakkab vizual modellari.'
  },
  {
    id: 'elden-ring',
    title: 'Elden Ring: Shadow of the Erdtree',
    genre_ru: 'Хардкорная Action / RPG',
    genre_uz: 'Og\'ir darajadagi jangari RPG',
    year: 2024,
    cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 75,
    gpu_weight: 0.70,
    cpu_weight: 0.30,
    ram_rec_gb: 16,
    description_ru: 'Мрачное фэнтези от Хидэтаки Миядзаки с огромным открытым миром Междуземья.',
    description_uz: 'FromSoftware tomonidan yaratilgan keng qamrovli qorong\'u fantastika olami.'
  },
  {
    id: 'avatar-frontiers',
    title: 'Avatar: Frontiers of Pandora',
    genre_ru: 'Приключения от первого лица',
    genre_uz: 'Birinchi shaxs nomidan sarguzasht',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 60,
    gpu_weight: 0.80,
    cpu_weight: 0.20,
    ram_rec_gb: 16,
    description_ru: 'Невероятный фотореалистичный мир Пандоры с обязательной аппаратной трассировкой лучей.',
    description_uz: 'Pandora sayyorasining mutlaqo barcha joyida nurlar qaytishi bilan yorilgan fotorealistik tabiati.'
  },
  {
    id: 'ac-mirage',
    title: "Assassin's Creed Mirage",
    genre_ru: 'Стелс-экшен',
    genre_uz: 'Yashirin jangari sarguzasht',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 82,
    gpu_weight: 0.70,
    cpu_weight: 0.30,
    ram_rec_gb: 16,
    description_ru: 'Атмосферный Багдад IX века с плотной застройкой и живыми улицами.',
    description_uz: 'IX asr Bag\'dodi, gavjum ko\'chalar va ajoyib sharqona muhit.'
  },
  {
    id: 'forza-horizon-5',
    title: 'Forza Horizon 5',
    genre_ru: 'Аркадный автосимулятор',
    genre_uz: 'Poyga avtosimulyatori',
    year: 2021,
    cover_image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 95,
    gpu_weight: 0.74,
    cpu_weight: 0.26,
    ram_rec_gb: 16,
    description_ru: 'Красочная Мексика, сотни гиперкаров и великолепная оптимизация графики.',
    description_uz: 'Meksikaning go\'zal manzaralari, yuzlab sport avtomobillari va a\'lo darajadagi grafika.'
  },
  {
    id: 'resident-evil-4',
    title: 'Resident Evil 4 Remake',
    genre_ru: 'Survival Horror экшен',
    genre_uz: 'Daxshatli jangari o\'yin',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 84,
    gpu_weight: 0.72,
    cpu_weight: 0.28,
    ram_rec_gb: 16,
    description_ru: 'Движок RE Engine с отличным освещением, физикой волос и атмосферным туманом.',
    description_uz: 'RE Engine dvigateli, ajoyib qorong\'u atmosferaga ega qo\'rqinchli o\'yin.'
  },
  {
    id: 'cod-warzone',
    title: 'Call of Duty: Warzone & MW III',
    genre_ru: 'Королевская битва / Шутер',
    genre_uz: 'Battle Royale / Otishma',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 105,
    gpu_weight: 0.65,
    cpu_weight: 0.35,
    ram_rec_gb: 16,
    description_ru: 'Динамичный сетевой шутер, требующий максимальной частоты кадров для киберспорта.',
    description_uz: 'Tezkor onlayn otishma o\'yini, kiber-sport uchun yuqori FPS talab etadi.'
  },
  {
    id: 'helldivers-2',
    title: 'Helldivers 2',
    genre_ru: 'Кооперативный шутер',
    genre_uz: 'Jamoaviy otishma o\'yini',
    year: 2024,
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 74,
    gpu_weight: 0.68,
    cpu_weight: 0.32,
    ram_rec_gb: 16,
    description_ru: 'Масштабные взрывы, сотни врагов на экране и высокая нагрузка на физику процессора.',
    description_uz: 'Yuzlab dushmanlar, qizg\'in janglar va protsessorga yuqori yuklama beruvchi jamoaviy o\'yin.'
  },
  {
    id: 'hellblade-2',
    title: "Senua's Saga: Hellblade II",
    genre_ru: 'Кинематографический триллер',
    genre_uz: 'Kinematografik triller',
    year: 2024,
    cover_image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 52,
    gpu_weight: 0.85,
    cpu_weight: 0.15,
    ram_rec_gb: 16,
    description_ru: 'Вершина фотореализма на движке Unreal Engine 5 с технологией цифровых людей MetaHuman.',
    description_uz: 'MetaHuman texnologiyasi bilan fotorealistik grafikaning eng yuqori cho\'qqisi.'
  },
  {
    id: 'cs2',
    title: 'Counter-Strike 2',
    genre_ru: 'Киберспортивный тактический шутер',
    genre_uz: 'Kiber-sport taktik otishma o\'yini',
    year: 2023,
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    base_fps_1080p_high: 220,
    gpu_weight: 0.55,
    cpu_weight: 0.45,
    ram_rec_gb: 16,
    description_ru: 'Соревновательный шутер на Source 2 с объемным дымом и субтиковой системой.',
    description_uz: 'Source 2 dvigatelidagi mashhur kiber-sport o\'yini, yuqori FPS va past kechikish talab qiladi.'
  }
];

async function seedDatabase() {
  console.log('Initializing Neon Lakebase Postgres schema...');
  await initDbSchema();

  console.log('Seeding categories into Neon Postgres...');
  for (const c of categories) {
    await query(
      `INSERT INTO categories (id, name_ru, name_uz, icon, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name_ru = EXCLUDED.name_ru,
         name_uz = EXCLUDED.name_uz,
         icon = EXCLUDED.icon,
         sort_order = EXCLUDED.sort_order`,
      [c.id, c.name_ru, c.name_uz, c.icon, c.sort_order]
    );
  }

  console.log('Seeding products with unique images into Neon Postgres...');
  for (const p of products) {
    const uniqueImage = `/products/${p.id}.svg`;
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
        p.id, p.category_id, p.name_ru, p.name_uz, p.brand, p.model,
        p.price_uzs, p.old_price_uzs, uniqueImage, p.in_stock, p.specs_json,
        p.description_ru, p.description_uz, p.is_popular
      ]
    );
  }

  console.log('Seeding 20 heavy games into Neon Postgres...');
  for (const g of games) {
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
        g.id, g.title, g.genre_ru, g.genre_uz, g.year, g.cover_image,
        g.base_fps_1080p_high, g.gpu_weight, g.cpu_weight, g.ram_rec_gb,
        g.description_ru, g.description_uz
      ]
    );
  }

  console.log('Neon Lakebase Postgres database seeded successfully!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, categories, products, games };
