import React, { useState, useEffect } from 'react';
import { 
  Gauge, Monitor, Flame, Search, Plus, Cpu, Tv, Layers, 
  ChevronRight, Info, AlertCircle, Sparkles, Filter 
} from 'lucide-react';
import { translations } from '../translations';
import AddGameModal from './AddGameModal';

export default function FPSCalculator({ 
  parts, 
  products, 
  lang,
  onOpenBuilder
}) {
  const t = translations[lang];

  // Selected hardware for benchmark calculation
  const cpus = products.filter(p => p.category_id === 'cpu');
  const gpus = products.filter(p => p.category_id === 'gpu');
  const rams = products.filter(p => p.category_id === 'ram');

  const [selectedCpuId, setSelectedCpuId] = useState(parts.cpu?.id || cpus[0]?.id || '');
  const [selectedGpuId, setSelectedGpuId] = useState(parts.gpu?.id || gpus[0]?.id || '');
  const [selectedRamId, setSelectedRamId] = useState(parts.ram?.id || rams[0]?.id || '');

  const [resolution, setResolution] = useState('1080p');
  const [games, setGames] = useState([]);
  const [fpsResults, setFpsResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);

  // Sync when parts change from Builder
  useEffect(() => {
    if (parts.cpu?.id) setSelectedCpuId(parts.cpu.id);
    if (parts.gpu?.id) setSelectedGpuId(parts.gpu.id);
    if (parts.ram?.id) setSelectedRamId(parts.ram.id);
  }, [parts]);

  // Fetch games & calculate FPS
  const fetchFpsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fps/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpuId: selectedCpuId,
          gpuId: selectedGpuId,
          ramId: selectedRamId,
          resolution
        })
      });
      const data = await res.json();
      setFpsResults(data.results || []);
    } catch (err) {
      console.error('Error calculating FPS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFpsData();
  }, [selectedCpuId, selectedGpuId, selectedRamId, resolution]);

  const filteredResults = fpsResults.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.genre_ru && item.genre_ru.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.genre_uz && item.genre_uz.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCpu = cpus.find(c => c.id === selectedCpuId);
  const activeGpu = gpus.find(g => g.id === selectedGpuId);
  const activeRam = rams.find(r => r.id === selectedRamId);

  const bottleneckInfo = fpsResults[0]?.bottleneck;

  const getFpsColor = (fps) => {
    if (fps >= 120) return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
    if (fps >= 60) return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
    if (fps >= 30) return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    return 'text-red-400 bg-red-950/60 border-red-500/40';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl text-purple-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </span>
            {t.fps_title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t.fps_subtitle}</p>
        </div>

        <button
          onClick={() => setIsAddGameOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t.add_game_btn}
        </button>
      </div>

      {/* Control Panel: Rig Selection & Resolution Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-5 border-b border-slate-800">
          {/* CPU Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              {t.slot_cpu}
            </label>
            <select
              value={selectedCpuId}
              onChange={(e) => setSelectedCpuId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {cpus.map(c => (
                <option key={c.id} value={c.id}>{c.model} (Score: {JSON.parse(c.specs_json || '{}').benchmark_score})</option>
              ))}
            </select>
          </div>

          {/* GPU Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-indigo-400" />
              {t.slot_gpu}
            </label>
            <select
              value={selectedGpuId}
              onChange={(e) => setSelectedGpuId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {gpus.map(g => (
                <option key={g.id} value={g.id}>{g.model} ({JSON.parse(g.specs_json || '{}').vram_gb}GB VRAM)</option>
              ))}
            </select>
          </div>

          {/* RAM Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-pink-400" />
              {t.slot_ram}
            </label>
            <select
              value={selectedRamId}
              onChange={(e) => setSelectedRamId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {rams.map(r => (
                <option key={r.id} value={r.id}>{r.model}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resolution Toggle & Bottleneck diagnosis */}
        <div className="pt-5 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">
              {t.resolution}:
            </span>
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              {[
                { id: '1080p', label: t.res_1080p },
                { id: '1440p', label: t.res_1440p },
                { id: '4k', label: t.res_4k },
              ].map(res => (
                <button
                  key={res.id}
                  onClick={() => setResolution(res.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    resolution === res.id 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20' 
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottleneck Indicator */}
          {bottleneckInfo && (
            <div className="w-full lg:w-auto flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-white mr-1.5">{t.bottleneck_label}:</span>
                <span className={bottleneckInfo.type === 'balanced' ? 'text-emerald-400' : 'text-amber-400'}>
                  {lang === 'uz' ? bottleneckInfo.text_uz : bottleneckInfo.text_ru}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preset Legend & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.filter_games}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> {t.fps_status_esports}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> {t.fps_status_smooth}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> {t.fps_status_playable}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> {t.fps_status_low}
          </span>
        </div>
      </div>

      {/* Games Benchmark Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Расчет производительности...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredResults.map(item => (
            <div 
              key={item.gameId}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden relative group"
            >
              {/* Game Info Header */}
              <div className="flex gap-4">
                <img 
                  src={item.cover_image} 
                  alt={item.title} 
                  className="w-20 h-24 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0 group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'uz' ? item.genre_uz : item.genre_ru}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300 uppercase">
                      {resolution}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {t.low_1_percent}: ~{item.onePercentLow.high} FPS
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Presets Grid: Low, Med, High, Ultra */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
                {/* Low */}
                <div className="text-center p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400">{t.preset_low}</div>
                  <div className={`text-base sm:text-lg font-black font-mono mt-1 ${getFpsColor(item.presets.low)}`}>
                    {item.presets.low}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">FPS</div>
                </div>

                {/* Medium */}
                <div className="text-center p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400">{t.preset_medium}</div>
                  <div className={`text-base sm:text-lg font-black font-mono mt-1 ${getFpsColor(item.presets.medium)}`}>
                    {item.presets.medium}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">FPS</div>
                </div>

                {/* High */}
                <div className="text-center p-2 rounded-xl bg-slate-950/80 border-2 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold">{t.preset_high}</div>
                  <div className={`text-base sm:text-lg font-black font-mono mt-1 ${getFpsColor(item.presets.high)}`}>
                    {item.presets.high}
                  </div>
                  <div className="text-[9px] text-cyan-300/80 font-mono mt-0.5">FPS</div>
                </div>

                {/* Ultra */}
                <div className="text-center p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400">{t.preset_ultra}</div>
                  <div className={`text-base sm:text-lg font-black font-mono mt-1 ${getFpsColor(item.presets.ultra)}`}>
                    {item.presets.ultra}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">FPS</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Game Modal */}
      {isAddGameOpen && (
        <AddGameModal 
          isOpen={isAddGameOpen}
          onClose={() => setIsAddGameOpen(false)}
          onGameAdded={() => {
            fetchFpsData();
            setIsAddGameOpen(false);
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
