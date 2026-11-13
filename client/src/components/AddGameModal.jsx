import React, { useState } from 'react';
import { Plus, X, Gamepad2 } from 'lucide-react';
import { translations } from '../translations';

export default function AddGameModal({ isOpen, onClose, onGameAdded, lang }) {
  const t = translations[lang];
  const [formData, setFormData] = useState({
    title: '',
    genre_ru: '',
    genre_uz: '',
    year: new Date().getFullYear(),
    cover_image: '',
    base_fps_1080p_high: 60,
    gpu_weight: 0.75,
    cpu_weight: 0.25,
    ram_rec_gb: 16,
    description_ru: '',
    description_uz: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onGameAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            {lang === 'uz' ? 'Yangi o\'yin qo\'shish' : 'Добавить игру в калькулятор'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              {lang === 'uz' ? 'O\'yin nomi' : 'Название игры'} *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Doom: The Dark Ages"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Жанр (RU)
              </label>
              <input
                type="text"
                value={formData.genre_ru}
                onChange={(e) => setFormData({ ...formData, genre_ru: e.target.value })}
                placeholder="Шутер / Экшен"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Janr (UZ)
              </label>
              <input
                type="text"
                value={formData.genre_uz}
                onChange={(e) => setFormData({ ...formData, genre_uz: e.target.value })}
                placeholder="Otishma / Action"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                {lang === 'uz' ? 'Chiqarilgan yili' : 'Год выхода'}
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Базовый High FPS (1080p)
              </label>
              <input
                type="number"
                value={formData.base_fps_1080p_high}
                onChange={(e) => setFormData({ ...formData, base_fps_1080p_high: parseInt(e.target.value) || 60 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              {lang === 'uz' ? 'Muqova rasmi (URL)' : 'Ссылка на постер (URL)'}
            </label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 text-xs font-semibold hover:text-white"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {submitting ? '...' : (lang === 'uz' ? 'Qo\'shish' : 'Добавить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
