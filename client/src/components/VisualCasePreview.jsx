import React, { useState } from 'react';
import { Cpu, Zap, ShieldCheck, AlertTriangle, Layers, Tv, Fan, HardDrive, Box, Eye } from 'lucide-react';
import { translations, formatPrice } from '../translations';
import ThreePCViewer from './ThreePCViewer';

export default function VisualCasePreview({ parts, compatibility, lang, isDarkMode }) {
  const t = translations[lang];
  const { cpu, motherboard, gpu, ram, storage, psu, casePart, cooler } = parts;

  // View Mode: '3d' or '2d'
  const [viewMode, setViewMode] = useState('3d');

  const totalWattage = compatibility?.totalTdp || 80;
  const recommendedPsu = compatibility?.recommendedPsuWattage || 300;
  const psuWattage = psu ? JSON.parse(psu.specs_json || '{}').wattage : 0;
  const powerPercent = psuWattage > 0 ? Math.min(100, Math.round((totalWattage / psuWattage) * 100)) : 0;

  return (
    <div className={`border rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900/90 border-slate-800' 
        : 'bg-white/90 border-slate-200'
    }`}>
      {/* Background ambient aura */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${
        isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className={`text-lg font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {t.visual_preview}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{t.visual_preview_hint}</p>
        </div>

        {/* 2D / 3D Mode Toggle Switcher + Compatibility Status */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 2D / 3D Mode Switcher */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D {lang === 'uz' ? 'Model' : 'Модель'}</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2D {lang === 'uz' ? 'Sxema' : 'Схема'}</span>
            </button>
          </div>

          {/* Live Status Pill */}
          {compatibility?.isCompatible ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.compatibility_ok}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{t.compatibility_error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Visualizer Chassis (3D or 2D) */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6 items-center">
        {viewMode === '3d' ? (
          <div className="w-full lg:w-[480px]">
            <ThreePCViewer parts={parts} isDarkMode={isDarkMode} lang={lang} />
          </div>
        ) : (
          /* 2D Graphic Computer Case Interior */
          <div className={`relative w-full max-w-[460px] h-[480px] rounded-2xl border-4 p-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-between ${
            isDarkMode ? 'bg-slate-950/90 border-slate-700/80' : 'bg-slate-900 border-slate-400'
          }`}>
            {/* Glass reflection gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none" />

            {/* Top Radiator / Exhaust Fan Area */}
            <div className="h-10 w-full rounded-lg border border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-between px-4 z-10">
              <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Top Exhaust / 360mm Radiator</span>
              {cooler && cooler.id.includes('liquid') ? (
                <span className="text-xs text-cyan-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Liquid Cooler 360 Mounted
                </span>
              ) : (
                <span className="text-[10px] text-slate-600">Dual Fan Mount</span>
              )}
            </div>

            {/* Main Motherboard Chamber */}
            <div className="relative flex-1 my-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 flex flex-col justify-between">
              {/* Motherboard Backplate */}
              <div className={`absolute inset-2 rounded-lg border transition-all duration-500 ${
                motherboard 
                  ? 'border-cyan-500/40 bg-slate-900/90 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]' 
                  : 'border-dashed border-slate-800 bg-slate-950/40'
              }`}>
                {motherboard && (
                  <div className="p-2 flex justify-between items-start text-[10px] font-mono text-cyan-400/70">
                    <span>{motherboard.model}</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                      {JSON.parse(motherboard.specs_json || '{}').socket} | {JSON.parse(motherboard.specs_json || '{}').ram_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Motherboard Components Area */}
              <div className="relative z-10 flex gap-4 h-full">
                {/* Left/Center: CPU & Cooler Zone */}
                <div className="flex-1 flex flex-col justify-center items-center relative">
                  {/* CPU Socket & Chip */}
                  <div className={`w-28 h-28 rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all duration-500 relative ${
                    cpu 
                      ? 'border-amber-400/80 bg-gradient-to-br from-amber-500/20 to-orange-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
                      : 'border-dashed border-slate-700 bg-slate-900/50'
                  }`}>
                    {cpu ? (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400 flex items-center justify-center mb-1 text-amber-300">
                          <Cpu className="w-5 h-5 animate-pulse" />
                        </div>
                        <span className="text-[11px] font-bold text-amber-300 text-center leading-tight">
                          {cpu.model}
                        </span>
                        <span className="text-[9px] text-amber-400/70 font-mono mt-0.5">
                          TDP: {JSON.parse(cpu.specs_json || '{}').tdp}W
                        </span>
                      </>
                    ) : (
                      <div className="text-center text-slate-500">
                        <Cpu className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px]">CPU Socket</span>
                      </div>
                    )}

                    {/* Cooler Mounted on top */}
                    {cooler && (
                      <div className="absolute -top-2 -right-2 px-2 py-1 bg-sky-500 text-black text-[9px] font-black rounded-md shadow-lg flex items-center gap-1 uppercase">
                        <Fan className="w-3 h-3 animate-spin" /> Cooler ON
                      </div>
                    )}
                  </div>

                  {/* M.2 SSD Slot right below CPU */}
                  <div className={`mt-3 w-28 h-5 rounded border flex items-center justify-center px-2 transition-all duration-300 ${
                    storage 
                      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                      : 'border-dashed border-slate-700/60 text-slate-600'
                  }`}>
                    <HardDrive className="w-3 h-3 mr-1" />
                    <span className="text-[9px] font-mono truncate">
                      {storage ? `${storage.brand} M.2` : 'M.2 NVMe Slot'}
                    </span>
                  </div>
                </div>

                {/* Right: RAM Slots */}
                <div className="w-16 flex flex-col justify-center items-center py-2">
                  <div className="w-full h-32 rounded border border-slate-800 bg-slate-950/60 p-1 flex justify-around items-center">
                    {[1, 2, 3, 4].map((slot) => {
                      const isOccupied = ram && (slot === 2 || slot === 4);
                      return (
                        <div 
                          key={slot}
                          className={`w-2.5 h-28 rounded-sm transition-all duration-500 ${
                            isOccupied 
                              ? 'bg-gradient-to-t from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse' 
                              : 'bg-slate-800 border-x border-slate-700'
                          }`}
                          title={isOccupied ? `${ram.model}` : `DIMM Slot ${slot}`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    {ram ? `${JSON.parse(ram.specs_json || '{}').capacity_gb}GB RAM` : 'DDR Slots'}
                  </span>
                </div>
              </div>

              {/* GPU Horizontal PCIe Slot & Card */}
              <div className="relative z-20 mt-2">
                <div className={`w-full h-16 rounded-xl border-2 transition-all duration-500 p-2 flex items-center justify-between ${
                  gpu 
                    ? 'border-indigo-500 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 shadow-[0_0_25px_rgba(99,102,241,0.35)]' 
                    : 'border-dashed border-slate-700 bg-slate-950/40 text-slate-500'
                }`}>
                  {gpu ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-400">
                          <Tv className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                            {gpu.model}
                          </div>
                          <div className="text-[10px] text-indigo-300/80 font-mono">
                            {JSON.parse(gpu.specs_json || '{}').vram_gb}GB VRAM | {JSON.parse(gpu.specs_json || '{}').length_mm} mm
                          </div>
                        </div>
                      </div>
                      {/* Spinning dual GPU fans graphic */}
                      <div className="flex items-center gap-1.5 pr-1">
                        <div className="w-7 h-7 rounded-full border border-indigo-400/40 bg-indigo-950 flex items-center justify-center">
                          <Fan className="w-4 h-4 text-cyan-400 animate-spin" />
                        </div>
                        <div className="w-7 h-7 rounded-full border border-indigo-400/40 bg-indigo-950 flex items-center justify-center">
                          <Fan className="w-4 h-4 text-cyan-400 animate-spin" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Tv className="w-4 h-4 opacity-40" />
                      <span>PCIe x16 GPU Slot (Empty)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom PSU Shroud & Basement */}
            <div className={`h-16 w-full rounded-xl border transition-all duration-500 p-3 flex items-center justify-between z-10 ${
              psu 
                ? 'border-yellow-500/50 bg-slate-900/90 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                : 'border-dashed border-slate-800 bg-slate-950/80 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${psu ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-800 text-slate-600'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {psu ? psu.model : 'Power Supply Basement'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {psu ? `${JSON.parse(psu.specs_json || '{}').wattage}W ${JSON.parse(psu.specs_json || '{}').efficiency}` : 'Select 650W - 1000W+'}
                  </div>
                </div>
              </div>

              {/* Case brand label */}
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400">
                  {casePart ? casePart.model : 'Chassis: Not selected'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live Build Diagnostics & Power Meter */}
        <div className="flex-1 w-full space-y-4">
          {/* Power Meter Card */}
          <div className={`border rounded-xl p-4 transition-colors ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Zap className="w-4 h-4 text-amber-400" />
                {t.system_tdp}
              </span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {totalWattage} W <span className="text-xs font-normal text-slate-400">/ {psuWattage > 0 ? `${psuWattage}W` : '???'}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  powerPercent > 90 ? 'bg-red-500' : powerPercent > 70 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, powerPercent))}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>{t.recommended_psu}: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{recommendedPsu} W+</strong></span>
              <span>{psuWattage > 0 ? `${powerPercent}% load` : 'No PSU'}</span>
            </div>
          </div>

          {/* Compatibility Alerts Box */}
          {compatibility && (
            <div className="space-y-2">
              {compatibility.errors?.map((err, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-400 block mb-0.5">Ошибка совместимости:</span>
                    <span>{lang === 'uz' ? err.message_uz : err.message_ru}</span>
                  </div>
                </div>
              ))}

              {compatibility.warnings?.map((warn, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-400 block mb-0.5">Предупреждение:</span>
                    <span>{lang === 'uz' ? warn.message_uz : warn.message_ru}</span>
                  </div>
                </div>
              ))}

              {compatibility.errors?.length === 0 && compatibility.warnings?.length === 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lang === 'uz' ? "Hamma tanlangan qismlar bir-biriga mukammal mos keladi!" : "Все выбранные компоненты идеально совместимы друг с другом!"}</span>
                </div>
              )}
            </div>
          )}

          {/* Component Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {[
              { label: 'CPU', val: cpu?.model, ok: !!cpu },
              { label: 'Motherboard', val: motherboard?.model, ok: !!motherboard },
              { label: 'GPU', val: gpu?.model, ok: !!gpu },
              { label: 'RAM', val: ram?.model, ok: !!ram },
              { label: 'Storage', val: storage?.model, ok: !!storage },
              { label: 'Cooler', val: cooler?.model, ok: !!cooler },
              { label: 'PSU', val: psu?.model, ok: !!psu },
              { label: 'Case', val: casePart?.model, ok: !!casePart },
            ].map((item, i) => (
              <div 
                key={i} 
                className={`p-2 rounded-lg border text-center transition-all ${
                  item.ok 
                    ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200' 
                    : isDarkMode 
                      ? 'border-slate-800 bg-slate-950/40 text-slate-500' 
                      : 'border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-70">{item.label}</div>
                <div className="text-xs font-bold truncate mt-0.5">{item.val || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
