/**
 * Hardware Compatibility Checker for PC Builder
 * Validates Sockets, RAM DDR generations, Form Factors, Dimensions, Power demands.
 */

function checkCompatibility({ cpu, motherboard, gpu, ram, storage, psu, casePart, cooler }, lang = 'ru') {
  const issues = []; // { type: 'error' | 'warning', message_ru, message_uz, code }
  let totalTdp = 80; // Baseline for motherboard, fans, ssd, peripherals

  if (cpu) {
    const specs = JSON.parse(cpu.specs_json || '{}');
    totalTdp += (specs.tdp || 65);
  }

  if (gpu) {
    const specs = JSON.parse(gpu.specs_json || '{}');
    totalTdp += (specs.tdp || 150);
  }

  const recommendedPsuWattage = Math.ceil((totalTdp * 1.3) / 50) * 50;

  // 1. CPU & Motherboard Socket Check
  if (cpu && motherboard) {
    const cpuSpecs = JSON.parse(cpu.specs_json || '{}');
    const mbSpecs = JSON.parse(motherboard.specs_json || '{}');

    if (cpuSpecs.socket && mbSpecs.socket && cpuSpecs.socket !== mbSpecs.socket) {
      issues.push({
        type: 'error',
        code: 'SOCKET_MISMATCH',
        message_ru: `Несовместимый сокет! Процессор ${cpu.name_ru} (${cpuSpecs.socket}) не подходит к плате ${motherboard.name_ru} (${mbSpecs.socket}).`,
        message_uz: `Mos kelmaydigan soket! ${cpu.name_uz} (${cpuSpecs.socket}) protsessori ${motherboard.name_uz} (${mbSpecs.socket}) platasiga to'g'ri kelmaydi.`
      });
    }
  }

  // 2. RAM & Motherboard Generation Check (DDR4 vs DDR5)
  if (ram && motherboard) {
    const ramSpecs = JSON.parse(ram.specs_json || '{}');
    const mbSpecs = JSON.parse(motherboard.specs_json || '{}');

    if (ramSpecs.ram_type && mbSpecs.ram_type && ramSpecs.ram_type !== mbSpecs.ram_type) {
      issues.push({
        type: 'error',
        code: 'RAM_TYPE_MISMATCH',
        message_ru: `Несовместимый тип памяти! Плата поддерживает ${mbSpecs.ram_type}, а выбрана память ${ramSpecs.ram_type}. Они физически несовместимы.`,
        message_uz: `Tezkor xotira turi mos kelmaydi! Ona plata faqat ${mbSpecs.ram_type} turini qo'llaydi, tanlangan xotira esa ${ramSpecs.ram_type}.`
      });
    }

    if (ramSpecs.capacity_gb && mbSpecs.max_ram_gb && ramSpecs.capacity_gb > mbSpecs.max_ram_gb) {
      issues.push({
        type: 'error',
        code: 'RAM_CAPACITY_EXCEEDED',
        message_ru: `Объем памяти (${ramSpecs.capacity_gb} ГБ) превышает максимальный лимит платы (${mbSpecs.max_ram_gb} ГБ).`,
        message_uz: `Xotira hajmi (${ramSpecs.capacity_gb} GB) ona plataning maksimal imkoniyatidan (${mbSpecs.max_ram_gb} GB) oshib ketdi.`
      });
    }
  }

  // 3. Motherboard & Case Form Factor Check
  if (motherboard && casePart) {
    const mbSpecs = JSON.parse(motherboard.specs_json || '{}');
    const caseSpecs = JSON.parse(casePart.specs_json || '{}');
    const supportedForms = caseSpecs.form_factor_support || ['ATX', 'Micro-ATX', 'Mini-ITX'];

    if (mbSpecs.form_factor && !supportedForms.includes(mbSpecs.form_factor)) {
      issues.push({
        type: 'error',
        code: 'FORM_FACTOR_MISMATCH',
        message_ru: `Плата формата ${mbSpecs.form_factor} не поместится в корпус ${casePart.name_ru} (поддерживает только: ${supportedForms.join(', ')}).`,
        message_uz: `${mbSpecs.form_factor} formatidagi ona plata ${casePart.name_uz} korpusiga sig'maydi (faqat ${supportedForms.join(', ')} qo'llab-quvvatlanadi).`
      });
    }
  }

  // 4. GPU Length & Case Max Clearance Check
  if (gpu && casePart) {
    const gpuSpecs = JSON.parse(gpu.specs_json || '{}');
    const caseSpecs = JSON.parse(casePart.specs_json || '{}');

    if (gpuSpecs.length_mm && caseSpecs.max_gpu_length_mm && gpuSpecs.length_mm > caseSpecs.max_gpu_length_mm) {
      issues.push({
        type: 'error',
        code: 'GPU_LENGTH_EXCEEDED',
        message_ru: `Видеокарта (${gpuSpecs.length_mm} мм) длиннее допустимого пространства в корпусе (${caseSpecs.max_gpu_length_mm} мм)!`,
        message_uz: `Videokarta uzunligi (${gpuSpecs.length_mm} mm) korpusdagi maksimal joydan (${caseSpecs.max_gpu_length_mm} mm) uzunroq!`
      });
    } else if (gpuSpecs.length_mm && caseSpecs.max_gpu_length_mm && (caseSpecs.max_gpu_length_mm - gpuSpecs.length_mm < 15)) {
      issues.push({
        type: 'warning',
        code: 'GPU_TIGHT_FIT',
        message_ru: `Видеокарта встает впритирку к передней стенке (запас менее 15 мм).`,
        message_uz: `Videokarta old qismga deyarli taqalib qoladi (15 mm dan kam masofa qoladi).`
      });
    }
  }

  // 5. Cooler Height & Case Clearance Check
  if (cooler && casePart) {
    const coolerSpecs = JSON.parse(cooler.specs_json || '{}');
    const caseSpecs = JSON.parse(casePart.specs_json || '{}');

    if (coolerSpecs.cooler_type && coolerSpecs.cooler_type.includes('Air') && coolerSpecs.height_mm && caseSpecs.max_cooler_height_mm) {
      if (coolerSpecs.height_mm > caseSpecs.max_cooler_height_mm) {
        issues.push({
          type: 'error',
          code: 'COOLER_HEIGHT_EXCEEDED',
          message_ru: `Высота кулера (${coolerSpecs.height_mm} мм) превышает ширину корпуса (${caseSpecs.max_cooler_height_mm} мм). Боковое стекло не закроется!`,
          message_uz: `Kuler balandligi (${coolerSpecs.height_mm} mm) korpus kengligidan (${caseSpecs.max_cooler_height_mm} mm) baland. Yon oyna yopilmaydi!`
        });
      }
    }
  }

  // 6. Cooler & CPU Socket Compatibility & TDP Dispassion
  if (cooler && cpu) {
    const coolerSpecs = JSON.parse(cooler.specs_json || '{}');
    const cpuSpecs = JSON.parse(cpu.specs_json || '{}');

    if (coolerSpecs.supported_sockets && cpuSpecs.socket && !coolerSpecs.supported_sockets.includes(cpuSpecs.socket)) {
      issues.push({
        type: 'error',
        code: 'COOLER_SOCKET_MISMATCH',
        message_ru: `Крепление кулера не поддерживает сокет процессора (${cpuSpecs.socket}).`,
        message_uz: `Kuler mahkamlagichi protsessor soketini (${cpuSpecs.socket}) qo'llab-quvvatlamaydi.`
      });
    }

    if (coolerSpecs.tdp_rating && cpuSpecs.tdp && coolerSpecs.tdp_rating < cpuSpecs.tdp) {
      issues.push({
        type: 'warning',
        code: 'COOLER_INSUFFICIENT_TDP',
        message_ru: `Кулер рассчитан на ${coolerSpecs.tdp_rating}W, тогда как TDP процессора составляет ${cpuSpecs.tdp}W. Возможен перегрев (троттлинг).`,
        message_uz: `Kuler quvvati ${coolerSpecs.tdp_rating}W, protsessor esa ${cpuSpecs.tdp}W talab qiladi. Qizib ketish xavfi mavjud.`
      });
    }
  }

  // 7. PSU Wattage Verification
  if (psu) {
    const psuSpecs = JSON.parse(psu.specs_json || '{}');
    const psuWattage = psuSpecs.wattage || 500;

    if (psuWattage < totalTdp) {
      issues.push({
        type: 'error',
        code: 'PSU_UNDERPOWERED',
        message_ru: `Критическая нехватка питания! Блок питания ${psuWattage}W, а суммарное потребление системы составляет минимум ${totalTdp}W. Компьютер будет аварийно выключаться.`,
        message_uz: `Quvvat yetishmovchiligi! Quvvat bloki ${psuWattage}W, kompyuterning minimal sarfi esa ${totalTdp}W. Tizim o'chib qoladi.`
      });
    } else if (psuWattage < recommendedPsuWattage) {
      issues.push({
        type: 'warning',
        code: 'PSU_LOW_HEADROOM',
        message_ru: `Блок питания ${psuWattage}W покроет номинальное потребление (${totalTdp}W), но рекомендуется запас минимум ${recommendedPsuWattage}W для защиты от скачков мощности видеокарты.`,
        message_uz: `Quvvat bloki (${psuWattage}W) ishlaydi, biroq to'satdan yuklama ortishining oldini olish uchun kamida ${recommendedPsuWattage}W tavsiya etiladi.`
      });
    }
  }

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const isCompatible = errors.length === 0;

  return {
    isCompatible,
    errors,
    warnings,
    totalTdp,
    recommendedPsuWattage,
    assembledComponentsCount: [cpu, motherboard, gpu, ram, storage, psu, casePart, cooler].filter(Boolean).length
  };
}

module.exports = { checkCompatibility };
