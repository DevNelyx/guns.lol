/* =============================================================
   GUNS.LOL CLONE — store : comptes, profils, liens, fichiers
   Persistance : localStorage (données) + IndexedDB (fichiers)
   ============================================================= */
window.G = window.G || {};

(function () {
  'use strict';

  const KEY = 'guns.db.v1';
  const FILE_DB = 'guns_files';

  /* ---------- helpers ---------- */
  function uid(p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- IndexedDB (fichiers) ---------- */
  const idb = {
    open: function () {
      return new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('IndexedDB indisponible'));
        const rq = indexedDB.open(FILE_DB, 1);
        rq.onupgradeneeded = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
        };
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    },
    put: function (file) {
      return idb.open().then(db => new Promise((res, rej) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put(file);
        tx.oncomplete = () => res(file);
        tx.onerror = () => rej(tx.error);
      }));
    },
    all: function () {
      return idb.open().then(db => new Promise((res, rej) => {
        const rq = db.transaction('files', 'readonly').objectStore('files').getAll();
        rq.onsuccess = () => res(rq.result || []);
        rq.onerror = () => rej(rq.error);
      })).catch(() => []);
    },
    del: function (id) {
      return idb.open().then(db => new Promise((res, rej) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').delete(id);
        tx.oncomplete = () => res(true);
        tx.onerror = () => rej(tx.error);
      }));
    }
  };

  /* ---------- données par défaut ---------- */
  function defaultLinks() {
    return [
      { id: uid('l'), title: 'Mon Discord', url: 'https://discord.gg/example', icon: 'discord', clicks: 128, visible: true, style: 'glass' },
      { id: uid('l'), title: 'Ma chaîne Twitch', url: 'https://twitch.tv/example', icon: 'twitch', clicks: 96, visible: true, style: 'glass' },
      { id: uid('l'), title: 'Mon YouTube', url: 'https://youtube.com/@example', icon: 'youtube', clicks: 74, visible: true, style: 'glass' },
      { id: uid('l'), title: 'Steam', url: 'https://steamcommunity.com/id/example', icon: 'steam', clicks: 41, visible: true, style: 'glass' },
      { id: uid('l'), title: 'Sponsorisé', url: 'https://example.com', icon: 'link', clicks: 12, visible: false, style: 'glass' }
    ];
  }

  function defaultProfile(name) {
    return {
      username: name || 'demo',
      displayName: 'poppaperc',
      alias: 'P0PPAPERC',
      uid: '30594172',
      email: 'demo@guns.lol',
      bio: 'welcome to my page !\nstreamer & crusty gamer',
      avatar: null,
      bg: null,
      accent: '#8b5cf6',
      theme: 'dark',
      effect: 'stars',
      cursor: 'default',
      badges: ['premium', 'verified'],
      links: defaultLinks(),
      audio: { tracks: [], volume: 70, autoplay: false, current: -1 },
      discord: { connected: true, status: 'Playing Visual Studio Code' },
      views: 4834,
      viewsLog: [],
      premium: true,
      createdAt: Date.now(),
      settings: { typewriter: true, tilt: true, showViews: true, language: 'fr', bgBlur: true }
    };
  }

  function defaultDb() {
    return {
      current: 'demo',
      users: { demo: defaultProfile('demo') },
      files: [],
      settings: { language: 'fr' }
    };
  }

  let db = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultDb();
      const parsed = JSON.parse(raw);
      const base = defaultDb();
      if (!parsed.users) return base;
      Object.keys(parsed.users).forEach(k => {
        const p = parsed.users[k];
        const d = defaultProfile(k);
        parsed.users[k] = Object.assign(d, p, {
          links: p.links || d.links,
          audio: Object.assign(d.audio, p.audio || {}),
          discord: Object.assign(d.discord, p.discord || {}),
          settings: Object.assign(d.settings, p.settings || {}),
          badges: p.badges || d.badges
        });
      });
      parsed.files = parsed.files || [];
      parsed.settings = Object.assign(base.settings, parsed.settings || {});
      parsed.current = parsed.current || Object.keys(parsed.users)[0];
      return parsed;
    } catch (e) {
      return defaultDb();
    }
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {
        G.util && G.util.toast('Stockage local plein : allégez vos images de fond.', 'err');
      }
    }, 150);
  }

  /* ---------- API ---------- */
  const Store = {
    get db() { return db; },
    save: save,
    uid: uid,
    clone: clone,
    idb: idb,

    current: function () { return db.users[db.current] || Object.values(db.users)[0]; },
    user: function (name) { return db.users[name] || null; },
    users: function () { return Object.values(db.users); },

    createUser: function (username) {
      const clean = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
      if (!clean) return { ok: false, msg: 'Pseudo invalide.' };
      if (db.users[clean]) return { ok: false, msg: 'Ce pseudo est déjà pris.' };
      db.users[clean] = defaultProfile(clean);
      db.users[clean].uid = String(10000000 + Math.floor(Math.random() * 89999999));
      db.current = clean;
      save();
      return { ok: true, user: db.users[clean] };
    },
    switchUser: function (username) {
      if (!db.users[username]) return false;
      db.current = username; save();
      return true;
    },
    update: function (patch) {
      const p = Store.current();
      Object.assign(p, patch);
      save();
      return p;
    },
    setLink: function (patch) {
      const p = Store.current();
      const i = p.links.findIndex(l => l.id === patch.id);
      if (i === -1) p.links.push(Object.assign({ id: uid('l'), clicks: 0, visible: true, style: 'glass' }, patch));
      else p.links[i] = Object.assign(p.links[i], patch);
      save();
      return p.links;
    },
    removeLink: function (id) {
      const p = Store.current();
      p.links = p.links.filter(l => l.id !== id);
      save();
    },
    moveLink: function (id, dir) {
      const p = Store.current();
      const i = p.links.findIndex(l => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.links.length) return;
      const tmp = p.links[i]; p.links[i] = p.links[j]; p.links[j] = tmp;
      save();
    },
    clickLink: function (id) {
      const p = Store.current();
      const l = p.links.find(x => x.id === id);
      if (l) { l.clicks = (l.clicks || 0) + 1; save(); }
    },
    addView: function (name) {
      const p = Store.user(name) || Store.current();
      p.views = (p.views || 0) + 1;
      p.viewsLog = (p.viewsLog || []).concat([Date.now()]).slice(-2000);
      save();
      return p.views;
    },
    addFreeViews: function (n) {
      const p = Store.current();
      p.views += (n || 1);
      p.viewsLog = (p.viewsLog || []).concat(Array(n || 1).fill(Date.now())).slice(-2000);
      save();
      return p.views;
    },
    viewsLast: function (hours) {
      const p = Store.current();
      const cut = Date.now() - (hours || 12) * 3600e3;
      const log = p.viewsLog || [];
      const buckets = new Array(hours || 12).fill(0);
      log.forEach(ts => {
        if (ts < cut) return;
        const idx = Math.min(buckets.length - 1, Math.floor((Date.now() - ts) / 3600e3));
        buckets[buckets.length - 1 - idx]++;
      });
      return buckets;
    },
    resetAccount: function () {
      const p = Store.current();
      db.users[p.username] = defaultProfile(p.username);
      db.current = p.username;
      save();
    }
  };

  /* ---------- utilitaires globaux ---------- */
  const Util = {
    $: (s, r) => (r || document).querySelector(s),
    $$: (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s)),
    h: function (html) {
      const t = document.createElement('template');
      t.innerHTML = String(html).trim();
      return t.content.firstElementChild;
    },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    fmt: function (n) { return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); },
    compact: function (n) {
      n = Number(n) || 0;
      if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' Md';
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' M';
      if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.', ',') + ' k';
      return String(n);
    },
    timeAgo: function (ts) {
      const s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return "à l'instant";
      if (s < 3600) return Math.floor(s / 60) + ' min';
      if (s < 86400) return Math.floor(s / 3600) + ' h';
      return Math.floor(s / 86400) + ' j';
    },
    bytes: function (n) {
      if (n < 1024) return n + ' o';
      if (n < 1048576) return (n / 1024).toFixed(1) + ' Ko';
      return (n / 1048576).toFixed(2) + ' Mo';
    },
    toast: function (msg, type) {
      const root = document.getElementById('toasts');
      if (!root) return;
      const el = Util.h('<div class="toast"><i class="toast__ic"></i><span></span></div>');
      el.className = 'toast ' + (type === 'ok' ? 'toast--ok' : type === 'err' ? 'toast--err' : '');
      el.querySelector('span').textContent = msg;
      root.appendChild(el);
      requestAnimationFrame(() => el.classList.add('is-in'));
      setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 300); }, 2600);
    },
    modal: function (opts) {
      const root = document.getElementById('modal-root');
      const back = Util.h('<div class="modal-back"><div class="modal"><button class="modal__x">✕</button><div class="modal__title"></div><div class="modal__sub"></div><div class="modal__body"></div></div></div>');
      back.querySelector('.modal__title').innerHTML = opts.title || '';
      const sub = back.querySelector('.modal__sub');
      if (opts.sub) sub.innerHTML = opts.sub; else sub.remove();
      const body = back.querySelector('.modal__body');
      if (typeof opts.content === 'string') body.innerHTML = opts.content;
      else if (opts.content) body.appendChild(opts.content);
      root.appendChild(back);
      requestAnimationFrame(() => back.classList.add('is-in'));
      const close = () => { back.classList.remove('is-in'); setTimeout(() => back.remove(), 240); document.removeEventListener('keydown', key); };
      const key = e => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', key);
      back.querySelector('.modal__x').addEventListener('click', close);
      back.addEventListener('click', e => { if (e.target === back && opts.dismissible !== false) close(); });
      return { el: back, body: body, close: close };
    },
    copy: function (text, msg) {
      const done = () => Util.toast(msg || 'Copié !', 'ok');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallback());
      } else fallback();
      function fallback() {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { Util.toast('Copie impossible.', 'err'); }
        ta.remove();
      }
    },
    /* avatar généré (fallback) */
    avatarSvg: function (seed, size) {
      let h = 0; const str = String(seed || 'x');
      for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
      const hue = Math.abs(h) % 360;
      return '<svg viewBox="0 0 40 40" width="' + (size || 104) + '" height="' + (size || 104) + '" class="avatar-svg" aria-hidden="true">' +
        '<defs><linearGradient id="av' + Math.abs(h) + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="hsl(' + hue + ',80%,64%)"/><stop offset="100%" stop-color="hsl(' + ((hue + 45) % 360) + ',75%,42%)"/>' +
        '</linearGradient></defs><rect width="40" height="40" rx="12" fill="url(#av' + Math.abs(h) + ')"/>' +
        '<circle cx="20" cy="16" r="7" fill="rgba(255,255,255,.92)"/><path d="M7 38c2-9 7-13 13-13s11 4 13 13z" fill="rgba(255,255,255,.92)"/></svg>';
    },
    /* logo guns-like */
    logo: function (size) {
      return '<svg viewBox="0 0 24 24" width="' + (size || 28) + '" height="' + (size || 28) + '" class="brand__ic" aria-hidden="true">' +
        '<path fill="currentColor" d="M12 2 3 12l9 10 9-10L12 2Zm0 4.6L17.2 12 12 17.4 6.8 12 12 6.6Z"/></svg>';
    },
    /* курсор */
    cursorSvg: function (kind) {
      if (kind === 'crosshair') {
        return '<svg viewBox="0 0 24 24" width="24" height="24" style="position:fixed;pointer-events:none;z-index:9999;color:#a78bfa">' +
          '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
          '<path d="M12 1v6M12 17v6M1 12h6M17 12h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      }
      if (kind === 'pointer') {
        return '<svg viewBox="0 0 24 24" width="24" height="24" style="position:fixed;pointer-events:none;z-index:9999;color:#a78bfa">' +
          '<path d="M5 3l14 8-6 1.5L10 19 5 3Z" fill="currentColor"/></svg>';
      }
      return '';
    }
  };

  G.store = Store;
  G.util = Util;
})();
