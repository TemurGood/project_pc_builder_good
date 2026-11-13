/**
 * Real-time FPS Calculation Engine for 20 Heavy Games
 * Calculates performance across Low, Medium, High, Ultra settings and 1080p / 1440p / 4K resolutions.
 */

function calculateFpsForGame(game, cpu, gpu, ram, resolution = '1080p') {
  const cpuSpecs = JSON.parse(cpu?.specs_json || '{"benchmark_score": 60}');
  const gpuSpecs = JSON.parse(gpu?.specs_json || '{"benchmark_score": 50}');
  const ramSpecs = JSON.parse(ram?.specs_json || '{"capacity_gb": 16}');

  const cpuScore = cpuSpecs.benchmark_score || 60;
  const gpuScore = gpuSpecs.benchmark_score || 50;
  const ramGb = ramSpecs.capacity_gb || 16;

  // Resolution factors
  const resMultipliers = {
    '1080p': 1.0,
    '1440p': 0.72,
    '4k': 0.44
  };
  const resFactor = resMultipliers[resolution] || 1.0;

  // RAM capacity modifier
  let ramFactor = 1.0;
  if (ramGb < 16) {
    ramFactor = 0.82; // 8GB causes micro-stutters and drops in modern titles
  } else if (ramGb >= 32) {
    ramFactor = 1.04; // Nice headroom, 0 cache paging
  }

  // Bottleneck calculation
  // At 1080p CPU matters more; at 4K GPU is 90% of the load
  let effectiveGpuWeight = game.gpu_weight || 0.75;
  let effectiveCpuWeight = game.cpu_weight || 0.25;

  if (resolution === '1440p') {
    effectiveGpuWeight = Math.min(0.85, effectiveGpuWeight + 0.07);
    effectiveCpuWeight = 1 - effectiveGpuWeight;
  } else if (resolution === '4k') {
    effectiveGpuWeight = Math.min(0.92, effectiveGpuWeight + 0.14);
    effectiveCpuWeight = 1 - effectiveGpuWeight;
  }

  // Relative power index normalized to RTX 4070 / Ryzen 7 7800X3D tier (~70 index)
  const combinedPowerIndex = (
    (gpuScore * effectiveGpuWeight) +
    (cpuScore * effectiveCpuWeight)
  ) / 70.0;

  // Base High FPS at 1080p
  const baselineFpsHigh = (game.base_fps_1080p_high || 60) * combinedPowerIndex * ramFactor * resFactor;

  // Graphics presets scaling factors
  const presets = {
    low: Math.round(baselineFpsHigh * 1.55),
    medium: Math.round(baselineFpsHigh * 1.25),
    high: Math.round(baselineFpsHigh),
    ultra: Math.round(baselineFpsHigh * 0.78)
  };

  // 1% Low FPS estimation (crucial for perceived smoothness)
  const onePercentLow = {
    low: Math.max(15, Math.round(presets.low * 0.78 * ramFactor)),
    medium: Math.max(15, Math.round(presets.medium * 0.76 * ramFactor)),
    high: Math.max(15, Math.round(presets.high * 0.74 * ramFactor)),
    ultra: Math.max(15, Math.round(presets.ultra * 0.72 * ramFactor))
  };

  // Evaluate bottleneck
  const diff = gpuScore - cpuScore;
  let bottleneck = {
    type: 'balanced',
    text_ru: 'Сбалансированная связка CPU и GPU',
    text_uz: 'CPU va GPU mukammal muvozanatda'
  };

  if (diff > 25 && resolution === '1080p') {
    bottleneck = {
      type: 'cpu_bottleneck',
      percentage: Math.min(35, Math.round((diff / gpuScore) * 60)),
      text_ru: `Процессор сдерживает видеокарту в 1080p (~${Math.min(35, Math.round((diff / gpuScore) * 60))}%)`,
      text_uz: `Protsessor 1080p da videokartani to'liq ochishga ulgurmayapti (~${Math.min(35, Math.round((diff / gpuScore) * 60))}%)`
    };
  } else if (diff < -25) {
    bottleneck = {
      type: 'gpu_bottleneck',
      percentage: Math.min(45, Math.round((Math.abs(diff) / cpuScore) * 60)),
      text_ru: `Видеокарта является узким местом системы`,
      text_uz: `Videokarta tizimning asosiy cheklovchi qismi`
    };
  }

  return {
    gameId: game.id,
    title: game.title,
    cover_image: game.cover_image,
    genre_ru: game.genre_ru,
    genre_uz: game.genre_uz,
    resolution,
    presets,
    onePercentLow,
    bottleneck
  };
}

function calculateAllGamesFps(games, cpu, gpu, ram, resolution = '1080p') {
  return games.map(game => calculateFpsForGame(game, cpu, gpu, ram, resolution));
}

module.exports = { calculateFpsForGame, calculateAllGamesFps };
