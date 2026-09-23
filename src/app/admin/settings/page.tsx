'use client';

import { useEffect, useState } from 'react';

interface Settings {
  couple_names: string;
  monogram: string;
  wedding_date: string;
  hashtag: string;
  album_url: string;
  welcome_title: string;
  welcome_subtitle: string;
  completion_title: string;
  completion_message: string;
  default_countdown: number;
  default_frame_slug: string;
  allow_rsvp_search: boolean;
  allow_print: boolean;
  print_copies: number;
  allow_gallery: boolean;
  allow_live_gallery: boolean;
  allow_digital_guestbook: boolean;
  allow_audio_guestbook: boolean;
  allow_sharing: boolean;
  auto_reset_seconds: number;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm focus:border-bronze focus:outline-none';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
  }

  if (!settings) return <p className="text-sm text-ink-soft">Memuat pengaturan...</p>;

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink">Settings</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Pasangan">
          <input className={inputClass} value={settings.couple_names} onChange={(e) => set('couple_names', e.target.value)} />
        </Field>
        <Field label="Monogram">
          <input className={inputClass} value={settings.monogram} onChange={(e) => set('monogram', e.target.value)} />
        </Field>
        <Field label="Tanggal Pernikahan">
          <input
            type="date"
            className={inputClass}
            value={settings.wedding_date}
            onChange={(e) => set('wedding_date', e.target.value)}
          />
        </Field>
        <Field label="Hashtag">
          <input className={inputClass} value={settings.hashtag} onChange={(e) => set('hashtag', e.target.value)} />
        </Field>
        <Field label="Judul Welcome">
          <input className={inputClass} value={settings.welcome_title} onChange={(e) => set('welcome_title', e.target.value)} />
        </Field>
        <Field label="Subjudul Welcome">
          <input className={inputClass} value={settings.welcome_subtitle} onChange={(e) => set('welcome_subtitle', e.target.value)} />
        </Field>
        <Field label="Judul Completion">
          <input className={inputClass} value={settings.completion_title} onChange={(e) => set('completion_title', e.target.value)} />
        </Field>
        <Field label="Pesan Completion">
          <input className={inputClass} value={settings.completion_message} onChange={(e) => set('completion_message', e.target.value)} />
        </Field>
        <Field label="Countdown Default (detik)">
          <select
            className={inputClass}
            value={settings.default_countdown}
            onChange={(e) => set('default_countdown', Number(e.target.value))}
          >
            {[3, 5, 10].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Jumlah Print Copies">
          <input
            type="number"
            min={1}
            max={5}
            className={inputClass}
            value={settings.print_copies}
            onChange={(e) => set('print_copies', Number(e.target.value))}
          />
        </Field>
        <Field label="Auto Reset Timeout (detik)">
          <input
            type="number"
            min={20}
            className={inputClass}
            value={settings.auto_reset_seconds}
            onChange={(e) => set('auto_reset_seconds', Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            ['allow_rsvp_search', 'Izinkan Cari RSVP'],
            ['allow_print', 'Izinkan Print'],
            ['allow_gallery', 'Izinkan Gallery'],
            ['allow_live_gallery', 'Izinkan Live Gallery'],
            ['allow_digital_guestbook', 'Izinkan Digital Guestbook'],
            ['allow_audio_guestbook', 'Izinkan Audio Guestbook'],
            ['allow_sharing', 'Izinkan Share'],
          ] as [keyof Settings, string][]
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={Boolean(settings[key])}
              onChange={(e) => set(key, e.target.checked as Settings[typeof key])}
            />
            {label}
          </label>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-8 text-sm">
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
      {saved && <span className="ml-3 text-sm text-sage">Tersimpan.</span>}
    </div>
  );
}
