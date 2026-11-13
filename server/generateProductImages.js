const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../client/public/products');
fs.mkdirSync(outDir, { recursive: true });

const brandPalettes = {
  AMD: { primary: '#f97316', secondary: '#ef4444', bg1: '#1c1008', bg2: '#090d16' },
  Intel: { primary: '#38bdf8', secondary: '#2563eb', bg1: '#08192b', bg2: '#090d16' },
  MSI: { primary: '#ef4444', secondary: '#dc2626', bg1: '#230b11', bg2: '#090d16' },
  GIGABYTE: { primary: '#f59e0b', secondary: '#06b6d4', bg1: '#1e1509', bg2: '#090d16' },
  Gigabyte: { primary: '#f59e0b', secondary: '#06b6d4', bg1: '#1e1509', bg2: '#090d16' },
  ASUS: { primary: '#06b6d4', secondary: '#ec4899', bg1: '#091d26', bg2: '#0c0a1d' },
  Palit: { primary: '#eab308', secondary: '#ca8a04', bg1: '#1c1908', bg2: '#090d16' },
  Sapphire: { primary: '#f43f5e', secondary: '#3b82f6', bg1: '#240b18', bg2: '#090d16' },
  Kingston: { primary: '#ef4444', secondary: '#a855f7', bg1: '#1e0b1b', bg2: '#090d16' },
  Corsair: { primary: '#facc15', secondary: '#06b6d4', bg1: '#1c1b09', bg2: '#090d16' },
  'G.Skill': { primary: '#ef4444', secondary: '#f97316', bg1: '#1f0d0d', bg2: '#090d16' },
  Samsung: { primary: '#ef4444', secondary: '#38bdf8', bg1: '#1a0d18', bg2: '#090d16' },
  Crucial: { primary: '#3b82f6', secondary: '#06b6d4', bg1: '#0a192e', bg2: '#090d16' },
  DeepCool: { primary: '#14b8a6', secondary: '#06b6d4', bg1: '#072222', bg2: '#090d16' },
  ARCTIC: { primary: '#38bdf8', secondary: '#a855f7', bg1: '#082032', bg2: '#090d16' },
  'be quiet!': { primary: '#f97316', secondary: '#fb923c', bg1: '#1c1209', bg2: '#090d16' },
  'Lian Li': { primary: '#06b6d4', secondary: '#6366f1', bg1: '#081c29', bg2: '#090d16' },
  NZXT: { primary: '#a855f7', secondary: '#38bdf8', bg1: '#1e1030', bg2: '#0f172a' }
};

function renderHardwareIllustration(product, p) {
  const cat = product.category_id;
  if (cat === 'cpu') {
    const isAmd = product.brand === 'AMD';
    return `
      <!-- CPU Substrate -->
      <rect x="200" y="75" width="200" height="200" rx="16" fill="#0d4a29" stroke="${p.primary}" stroke-width="3"/>
      <!-- Gold Contact Pins Grid -->
      <rect x="212" y="87" width="176" height="176" rx="10" fill="none" stroke="#eab308" stroke-width="2" stroke-dasharray="6 4" opacity="0.65"/>
      <!-- Nickel Integrated Heat Spreader (IHS) -->
      <rect x="226" y="101" width="148" height="148" rx="${isAmd ? '22' : '12'}" fill="url(#metalGrad)" stroke="#94a3b8" stroke-width="3"/>
      ${isAmd ? `
        <!-- AMD AM5 notched IHS cutouts -->
        <circle cx="226" cy="135" r="8" fill="#0d4a29"/>
        <circle cx="374" cy="135" r="8" fill="#0d4a29"/>
        <circle cx="226" cy="215" r="8" fill="#0d4a29"/>
        <circle cx="374" cy="215" r="8" fill="#0d4a29"/>
      ` : `
        <rect x="238" y="115" width="124" height="120" rx="6" fill="none" stroke="#64748b" stroke-width="1.5"/>
      `}
      <text x="300" y="158" text-anchor="middle" fill="#0f172a" font-family="monospace" font-weight="900" font-size="22">${product.brand}</text>
      <text x="300" y="185" text-anchor="middle" fill="${p.primary}" font-family="sans-serif" font-weight="900" font-size="16">${product.badge1}</text>
      <text x="300" y="210" text-anchor="middle" fill="#334155" font-family="monospace" font-weight="700" font-size="12">${product.badge2}</text>
    `;
  }

  if (cat === 'motherboard') {
    return `
      <!-- Motherboard PCB -->
      <rect x="175" y="65" width="250" height="220" rx="12" fill="#0f172a" stroke="${p.primary}" stroke-width="2.5"/>
      <!-- VRM Heatsinks -->
      <rect x="190" y="80" width="38" height="95" rx="6" fill="url(#metalGrad)" stroke="${p.primary}" stroke-width="1.5"/>
      <rect x="235" y="75" width="90" height="28" rx="5" fill="url(#metalGrad)" stroke="${p.primary}" stroke-width="1.5"/>
      <!-- CPU Socket -->
      <rect x="250" y="115" width="62" height="62" rx="6" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
      <rect x="262" y="127" width="38" height="38" rx="3" fill="${p.primary}" opacity="0.25"/>
      <!-- 4 DIMM Slots -->
      <line x1="335" y1="108" x2="335" y2="182" stroke="${p.primary}" stroke-width="4"/>
      <line x1="346" y1="108" x2="346" y2="182" stroke="#475569" stroke-width="4"/>
      <line x1="357" y1="108" x2="357" y2="182" stroke="${p.primary}" stroke-width="4"/>
      <line x1="368" y1="108" x2="368" y2="182" stroke="#475569" stroke-width="4"/>
      <!-- PCIe Steel Slot + M.2 Armor -->
      <rect x="195" y="198" width="145" height="12" rx="3" fill="#cbd5e1"/>
      <rect x="195" y="220" width="120" height="22" rx="4" fill="#1e293b" stroke="${p.secondary}" stroke-width="1.5"/>
      <!-- Chipset Heatsink -->
      <rect x="335" y="205" width="68" height="58" rx="8" fill="url(#metalGrad)" stroke="${p.primary}" stroke-width="2"/>
      <text x="369" y="239" text-anchor="middle" fill="#0f172a" font-family="monospace" font-weight="900" font-size="13">${product.badge1}</text>
    `;
  }

  if (cat === 'gpu') {
    const isTripleFan = !product.id.includes('4060') && !product.id.includes('7800xt');
    return `
      <!-- GPU Shroud -->
      <rect x="125" y="95" width="350" height="150" rx="16" fill="#111827" stroke="${p.primary}" stroke-width="3"/>
      <!-- Top RGB Bar -->
      <rect x="145" y="95" width="310" height="8" rx="4" fill="url(#accentGrad)"/>
      <!-- PCIe Gold Finger -->
      <rect x="175" y="245" width="130" height="12" rx="2" fill="#eab308"/>
      <!-- Cooling Fans -->
      ${isTripleFan ? `
        <circle cx="195" cy="172" r="46" fill="#090d16" stroke="${p.primary}" stroke-width="2.5"/>
        <circle cx="195" cy="172" r="16" fill="${p.primary}" opacity="0.8"/>
        <circle cx="300" cy="172" r="46" fill="#090d16" stroke="${p.secondary}" stroke-width="2.5"/>
        <circle cx="300" cy="172" r="16" fill="${p.secondary}" opacity="0.8"/>
        <circle cx="405" cy="172" r="46" fill="#090d16" stroke="${p.primary}" stroke-width="2.5"/>
        <circle cx="405" cy="172" r="16" fill="${p.primary}" opacity="0.8"/>
      ` : `
        <circle cx="235" cy="172" r="54" fill="#090d16" stroke="${p.primary}" stroke-width="3"/>
        <circle cx="235" cy="172" r="18" fill="${p.primary}" opacity="0.85"/>
        <circle cx="365" cy="172" r="54" fill="#090d16" stroke="${p.secondary}" stroke-width="3"/>
        <circle cx="365" cy="172" r="18" fill="${p.secondary}" opacity="0.85"/>
      `}
      <text x="300" y="122" text-anchor="middle" fill="#ffffff" font-family="monospace" font-weight="900" font-size="13">${product.brand} GEFORCE / RADEON</text>
    `;
  }

  if (cat === 'ram') {
    const hasRgb = product.model.includes('RGB') || product.id.includes('ddr5');
    return `
      <!-- Dual RAM Kit Modules -->
      <g transform="translate(0, -18)">
        ${hasRgb ? `<rect x="145" y="102" width="310" height="14" rx="6" fill="url(#accentGrad)"/>` : ''}
        <rect x="140" y="114" width="320" height="58" rx="8" fill="#111827" stroke="${p.primary}" stroke-width="2.5"/>
        <rect x="160" y="172" width="280" height="8" rx="2" fill="#eab308"/>
        <text x="300" y="149" text-anchor="middle" fill="#ffffff" font-family="monospace" font-weight="900" font-size="16">${product.brand} ${product.badge1}</text>
      </g>
      <g transform="translate(0, 62)">
        ${hasRgb ? `<rect x="145" y="102" width="310" height="14" rx="6" fill="url(#accentGrad)"/>` : ''}
        <rect x="140" y="114" width="320" height="58" rx="8" fill="#1e293b" stroke="${p.secondary}" stroke-width="2.5"/>
        <rect x="160" y="172" width="280" height="8" rx="2" fill="#eab308"/>
        <text x="300" y="149" text-anchor="middle" fill="${p.primary}" font-family="monospace" font-weight="900" font-size="15">${product.badge2}</text>
      </g>
    `;
  }

  if (cat === 'storage') {
    return `
      <!-- M.2 NVMe 2280 Stick -->
      <rect x="120" y="125" width="360" height="96" rx="10" fill="#090d16" stroke="${p.primary}" stroke-width="3"/>
      <!-- M.2 Gold Connector Left -->
      <rect x="108" y="142" width="16" height="62" rx="3" fill="#eab308"/>
      <!-- Controller & NAND Flash Chips -->
      <rect x="145" y="140" width="62" height="66" rx="6" fill="url(#metalGrad)"/>
      <rect x="222" y="138" width="235" height="70" rx="6" fill="#111827" stroke="${p.secondary}" stroke-width="2"/>
      <text x="340" y="168" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="18">${product.brand} NVMe</text>
      <text x="340" y="192" text-anchor="middle" fill="${p.primary}" font-family="monospace" font-weight="800" font-size="14">${product.badge1} • ${product.badge2}</text>
    `;
  }

  if (cat === 'cooler') {
    const isAio = product.id.includes('liquid');
    if (isAio) {
      return `
        <!-- 360mm AIO Radiator + 3 ARGB Fans -->
        <rect x="120" y="85" width="360" height="110" rx="12" fill="#0f172a" stroke="${p.primary}" stroke-width="2.5"/>
        <circle cx="185" cy="140" r="42" fill="#090d16" stroke="${p.primary}" stroke-width="3"/>
        <circle cx="300" cy="140" r="42" fill="#090d16" stroke="${p.secondary}" stroke-width="3"/>
        <circle cx="415" cy="140" r="42" fill="#090d16" stroke="${p.primary}" stroke-width="3"/>
        <!-- Pump Block -->
        <circle cx="300" cy="245" r="32" fill="#111827" stroke="url(#accentGrad)" stroke-width="4"/>
        <path d="M 270 235 Q 230 215 240 195" fill="none" stroke="#475569" stroke-width="6"/>
        <path d="M 330 235 Q 370 215 360 195" fill="none" stroke="#475569" stroke-width="6"/>
      `;
    }
    return `
      <!-- Air Tower Cooler -->
      <rect x="205" y="75" width="190" height="190" rx="16" fill="#111827" stroke="${p.primary}" stroke-width="3"/>
      <!-- Fin Stack Lines -->
      <line x1="220" y1="95" x2="380" y2="95" stroke="#334155" stroke-width="3"/>
      <line x1="220" y1="110" x2="380" y2="110" stroke="#334155" stroke-width="3"/>
      <circle cx="300" cy="175" r="64" fill="#090d16" stroke="url(#accentGrad)" stroke-width="4"/>
      <circle cx="300" cy="175" r="24" fill="#111827" stroke="${p.primary}" stroke-width="2"/>
      <text x="300" y="180" text-anchor="middle" fill="${p.primary}" font-family="monospace" font-weight="900" font-size="13">${product.badge1}</text>
    `;
  }

  if (cat === 'psu') {
    return `
      <!-- ATX Power Supply Chassis -->
      <rect x="155" y="80" width="290" height="180" rx="16" fill="#111827" stroke="${p.primary}" stroke-width="3"/>
      <!-- Fan Grille Left -->
      <circle cx="240" cy="170" r="62" fill="#090d16" stroke="#334155" stroke-width="3"/>
      <circle cx="240" cy="170" r="44" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="8 6"/>
      <circle cx="240" cy="170" r="20" fill="${p.primary}"/>
      <!-- Wattage Label Right -->
      <rect x="320" y="115" width="105" height="110" rx="10" fill="#090d16" stroke="${p.primary}" stroke-width="2"/>
      <text x="372" y="160" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="24">${product.badge1}</text>
      <text x="372" y="188" text-anchor="middle" fill="${p.primary}" font-family="monospace" font-weight="800" font-size="11">${product.badge2}</text>
    `;
  }

  // Case
  const isWhite = product.id.includes('white') || product.id.includes('nzxt');
  return `
    <!-- Panoramic PC Case Tower -->
    <rect x="200" y="55" width="200" height="230" rx="14" fill="${isWhite ? '#e2e8f0' : '#0f172a'}" stroke="${p.primary}" stroke-width="3"/>
    <!-- Tempered Glass Window -->
    <rect x="214" y="70" width="132" height="195" rx="8" fill="#090d16" stroke="${p.secondary}" stroke-width="2"/>
    <!-- Internal RGB Fans & GPU Glow inside case -->
    <circle cx="368" cy="105" r="16" fill="none" stroke="${p.primary}" stroke-width="3"/>
    <circle cx="368" cy="150" r="16" fill="none" stroke="${p.secondary}" stroke-width="3"/>
    <circle cx="368" cy="195" r="16" fill="none" stroke="${p.primary}" stroke-width="3"/>
    <rect x="230" y="165" width="95" height="24" rx="5" fill="url(#accentGrad)" opacity="0.85"/>
    <circle cx="268" cy="122" r="22" fill="none" stroke="${p.primary}" stroke-width="3"/>
  `;
}

const items = [
  { id: 'cpu-7800x3d', category_id: 'cpu', brand: 'AMD', model: 'Ryzen 7 7800X3D', badge1: '8C/16T • 5.0GHz', badge2: '3D V-CACHE AM5' },
  { id: 'cpu-7600x', category_id: 'cpu', brand: 'AMD', model: 'Ryzen 5 7600X', badge1: '6C/12T • 5.3GHz', badge2: 'ZEN 4 • AM5' },
  { id: 'cpu-14700k', category_id: 'cpu', brand: 'Intel', model: 'Core i7-14700K', badge1: '20C/28T • 5.6GHz', badge2: 'LGA1700 UNLOCKED' },
  { id: 'cpu-13400f', category_id: 'cpu', brand: 'Intel', model: 'Core i5-13400F', badge1: '10C/16T • 4.6GHz', badge2: 'LGA1700 GAMING' },
  { id: 'cpu-5600x', category_id: 'cpu', brand: 'AMD', model: 'Ryzen 5 5600X', badge1: '6C/12T • 4.6GHz', badge2: 'AM4 • 65W TDP' },

  { id: 'mb-b650-tomahawk', category_id: 'motherboard', brand: 'MSI', model: 'MAG B650 TOMAHAWK WIFI', badge1: 'B650', badge2: 'AM5 • DDR5 • WIFI 6E' },
  { id: 'mb-b650m-ds3h', category_id: 'motherboard', brand: 'GIGABYTE', model: 'B650M DS3H', badge1: 'B650M', badge2: 'AM5 • Micro-ATX • DDR5' },
  { id: 'mb-z790-aorus-elite', category_id: 'motherboard', brand: 'GIGABYTE', model: 'Z790 AORUS ELITE AX', badge1: 'Z790', badge2: 'LGA1700 • ATX • DDR5' },
  { id: 'mb-b760m-ddr4', category_id: 'motherboard', brand: 'ASUS', model: 'PRIME B760M-K D4', badge1: 'B760M', badge2: 'LGA1700 • DDR4' },
  { id: 'mb-b550-gaming-plus', category_id: 'motherboard', brand: 'MSI', model: 'MPG B550 GAMING PLUS', badge1: 'B550', badge2: 'AM4 • ATX • DDR4' },

  { id: 'gpu-rtx-4090', category_id: 'gpu', brand: 'ASUS', model: 'ROG Strix RTX 4090 OC 24GB', badge1: '24GB GDDR6X', badge2: 'DLSS 3.5 • 450W' },
  { id: 'gpu-rtx-4080s', category_id: 'gpu', brand: 'Palit', model: 'RTX 4080 SUPER GamingPro 16GB', badge1: '16GB GDDR6X', badge2: '4K ULTRA • 320W' },
  { id: 'gpu-rtx-4070s', category_id: 'gpu', brand: 'Gigabyte', model: 'RTX 4070 SUPER WINDFORCE 12GB', badge1: '12GB GDDR6X', badge2: '1440P KING • 220W' },
  { id: 'gpu-rtx-4060', category_id: 'gpu', brand: 'MSI', model: 'RTX 4060 VENTUS 2X 8GB', badge1: '8GB GDDR6', badge2: '1080P ULTRA • 115W' },
  { id: 'gpu-rx-7800xt', category_id: 'gpu', brand: 'Sapphire', model: 'PULSE Radeon RX 7800 XT 16GB', badge1: '16GB GDDR6', badge2: 'RDNA 3 • 263W' },

  { id: 'ram-ddr5-32-6000', category_id: 'ram', brand: 'Kingston', model: 'FURY Beast RGB DDR5 32GB', badge1: '32GB (2x16GB)', badge2: 'DDR5 6000MHz CL30' },
  { id: 'ram-ddr5-64-6000', category_id: 'ram', brand: 'Corsair', model: 'Vengeance RGB DDR5 64GB', badge1: '64GB (2x32GB)', badge2: 'DDR5 6000MHz CL32' },
  { id: 'ram-ddr4-16-3200', category_id: 'ram', brand: 'G.Skill', model: 'Aegis DDR4 16GB (2x8GB)', badge1: '16GB (2x8GB)', badge2: 'DDR4 3200MHz CL16' },
  { id: 'ram-ddr4-32-3600', category_id: 'ram', brand: 'Kingston', model: 'FURY Renegade DDR4 32GB', badge1: '32GB (2x16GB)', badge2: 'DDR4 3600MHz CL16' },

  { id: 'ssd-samsung-990pro-2tb', category_id: 'storage', brand: 'Samsung', model: '990 PRO NVMe M.2 2TB', badge1: '2TB PCIe 4.0', badge2: '7450 MB/s' },
  { id: 'ssd-kingston-kc3000-1tb', category_id: 'storage', brand: 'Kingston', model: 'KC3000 NVMe M.2 1TB', badge1: '1TB PCIe 4.0', badge2: '7000 MB/s' },
  { id: 'ssd-crucial-p3-1tb', category_id: 'storage', brand: 'Crucial', model: 'P3 Plus M.2 NVMe 1TB', badge1: '1TB PCIe 4.0', badge2: '5000 MB/s' },

  { id: 'cooler-deepcool-ak620', category_id: 'cooler', brand: 'DeepCool', model: 'AK620 Digital Black', badge1: '260W TDP', badge2: 'DUAL TOWER LCD' },
  { id: 'cooler-arctic-liquid-iii-360', category_id: 'cooler', brand: 'ARCTIC', model: 'Liquid Freezer III 360 A-RGB', badge1: '350W TDP', badge2: 'AIO 360MM WATER' },
  { id: 'cooler-deepcool-ag400', category_id: 'cooler', brand: 'DeepCool', model: 'AG400 ARGB Tower', badge1: '180W TDP', badge2: '4 HEATPIPES ARGB' },

  { id: 'psu-corsair-rm850x', category_id: 'psu', brand: 'Corsair', model: 'RM850x 850W 80+ Gold', badge1: '850W', badge2: '80+ GOLD MODULAR' },
  { id: 'psu-deepcool-pl750d', category_id: 'psu', brand: 'DeepCool', model: 'PL750D 750W ATX 3.0', badge1: '750W', badge2: '80+ BRONZE PCIe 5.0' },
  { id: 'psu-bequiet-1000w', category_id: 'psu', brand: 'be quiet!', model: 'Straight Power 12 1000W', badge1: '1000W', badge2: '80+ PLATINUM ATX 3.0' },

  { id: 'case-lian-li-o11-dynamic-evo', category_id: 'case', brand: 'Lian Li', model: 'O11 Dynamic EVO Black', badge1: 'ATX DUAL CHAMBER', badge2: 'TEMPERED GLASS' },
  { id: 'case-nzxt-h6-flow', category_id: 'case', brand: 'NZXT', model: 'H6 Flow RGB White', badge1: 'PANORAMIC WHITE', badge2: 'ANGLED RGB AIRFLOW' },
  { id: 'case-deepcool-matrexx-40', category_id: 'case', brand: 'DeepCool', model: 'MATREXX 40 3FS mATX', badge1: 'MICRO-ATX MESH', badge2: '3x ARGB FANS' }
];

for (const item of items) {
  const p = brandPalettes[item.brand] || brandPalettes.ASUS;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bg1}"/>
      <stop offset="100%" stop-color="${p.bg2}"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${p.primary}"/>
      <stop offset="100%" stop-color="${p.secondary}"/>
    </linearGradient>
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${p.primary}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${p.primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="400" fill="url(#bgGrad)"/>
  <circle cx="300" cy="180" r="220" fill="url(#glow)"/>

  <!-- Subtle Tech Grid -->
  <g stroke="#ffffff" stroke-opacity="0.04" stroke-width="1">
    <line x1="0" y1="80" x2="600" y2="80"/>
    <line x1="0" y1="160" x2="600" y2="160"/>
    <line x1="0" y1="240" x2="600" y2="240"/>
    <line x1="0" y1="320" x2="600" y2="320"/>
    <line x1="120" y1="0" x2="120" y2="400"/>
    <line x1="240" y1="0" x2="240" y2="400"/>
    <line x1="360" y1="0" x2="360" y2="400"/>
    <line x1="480" y1="0" x2="480" y2="400"/>
  </g>

  <!-- Top Brand & Category Header -->
  <rect x="24" y="20" width="130" height="28" rx="8" fill="${p.primary}" fill-opacity="0.18" stroke="${p.primary}" stroke-width="1.5"/>
  <text x="89" y="39" text-anchor="middle" fill="${p.primary}" font-family="monospace" font-weight="900" font-size="13">${item.brand.toUpperCase()}</text>

  <rect x="446" y="20" width="130" height="28" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="511" y="39" text-anchor="middle" fill="#cbd5e1" font-family="monospace" font-weight="700" font-size="12">${item.category_id.toUpperCase()}</text>

  <!-- Hardware Illustration -->
  ${renderHardwareIllustration(item, p)}

  <!-- Bottom Product Title Banner -->
  <rect x="24" y="310" width="552" height="70" rx="14" fill="#090d16" fill-opacity="0.88" stroke="#1e293b" stroke-width="1.5"/>
  <text x="44" y="340" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="19">${item.model}</text>
  <text x="44" y="364" fill="${p.primary}" font-family="monospace" font-weight="700" font-size="13">${item.badge1}  •  ${item.badge2}</text>
</svg>`;

  fs.writeFileSync(path.join(outDir, `${item.id}.svg`), svg, 'utf8');
}

console.log(`Generated ${items.length} unique SVG product images in ${outDir}`);
