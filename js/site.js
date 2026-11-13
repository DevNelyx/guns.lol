/* =============================================================
   GUNS.LOL CLONE — logique des pages site
   accueil · classement · tarifs · connexion · comparatif
   ============================================================= */
(function () {
  'use strict';
  const U = () => G.util;
  const I = () => G.icons;
  const S = () => G.store;

  /* ---------- données de démonstration ---------- */
  const MOCK = [
    { name: 'poppaperc', views: 1284000, clicks: 38400, premium: true, badge: 'Légende' },
    { name: 'hris', views: 972300, clicks: 22150, premium: true, badge: 'Légende' },
    { name: 'Azrea', views: 845100, clicks: 19870, premium: true, badge: 'Vérifié' },
    { name: 'vue', views: 612900, clicks: 15400, premium: false, badge: 'Étoile' },
    { name: 'noobmaster', views: 488200, clicks: 11250, premium: true, badge: 'Vérifié' },
    { name: 'dust2rat', views: 391700, clicks: 9880, premium: false, badge: '' },
    { name: 'VandalKing', views: 322400, clicks: 8740, premium: true, badge: 'Étoile' },
    { name: 'kev1n', views: 287600, clicks: 7310, premium: false, badge: '' },
    { name: 'c0ff1ne', views: 241300, clicks: 6980, premium: true, badge: 'Booster' },
    { name: 'swissroll', views: 198700, clicks: 5420, premium: false, badge: '' },
    { name: 'gamerX', views: 164200, clicks: 4890, premium: true, badge: '' },
    { name: 'stackz', views: 132900, clicks: 4120, premium: false, badge: '' }
  ];

  const FAQ = [
    ['C’est gratuit ?',
      'Oui. Le plan Gratuit donne accès à une page link-in-bio moderne, des liens illimités, un avatar, un fond, un lecteur audio et les statistiques de base — sans carte bancaire et sans abonnement.'],
    ['Qu’est-ce que guns.lol exactement ?',
      'guns.lol est ton allié pour des pages link-in-bio modernes et riches en fonctionnalités, avec un hébergement de fichiers rapide et sécurisé. Tu réserves un pseudo, tu personalises, tu publies : guns.lol/toutpseudo.'],
    ['Puis-je mettre ma musique sur ma page ?',
      'Oui. Le lecteur audio accepte une playlist de titres (URL ou fichier), avec volume, autoplay et barre de progression. Tu peux aussi activer ou désactiver la lecture automatique depuis le tableau de bord.'],
    ['Comment fonctionne l’hébergement de fichiers ?',
      'Depuis l’onglet Image host de ton tableau de bord, tu glisses-déposes tes images et fichiers : ils sont listés avec leur taille, et tu peux copier le lien direct ou le BBCode en un clic.'],
    ['Comment fonctionnent les vues et le classement ?',
      'Chaque visite de ta page compte une vue (une par session et par profil). Tu peux ajouter des vues gratuites depuis le tableau de bord, et suivre l’évolution sur 12 heures, 24 heures ou 7 jours.'],
    ['Puis-je changer de pseudo ou supprimer mon compte ?',
      'Oui. Le pseudo se réserve à la création ; le tableau de bord permet de modifier le nom d’affichage, l’alias et l’e-mail. La réinitialisation du compte se fait en un clic depuis l’onglet Compte.']
  ];

  /* ---------- shell commun ---------- */
  function shell() {
    U().$('#logo') && (U().$('#logo').innerHTML = U().logo(28));
    U().$('#logo2') && (U().$('#logo2').innerHTML = U().logo(26));
    const t = U().$('#navToggle');
    if (t) t.onclick = () => U().$('#navlinks').classList.toggle('is-open');
  }

  /* ---------- accueil ---------- */
  function initHome() {
    const gp = U().$('#gunpattern');
    if (gp) gp.innerHTML = G.effects.gunPattern();

    U().$$('[data-count]').forEach(el => {
      const to = parseInt(el.dataset.count, 10);
      el.dataset.from = '0';
      G.effects.countUp(el, to, 1800);
      el.textContent = U().compact(to);
      setTimeout(() => G.effects.countUp(el, to, 1800), 120);
    });

    // petit graphique factice dans la maquette
    const mc = U().$('#mockChart');
    if (mc) {
      const vals = [12, 26, 18, 40, 30, 52, 38, 62, 48, 74, 58, 88];
      const max = Math.max.apply(null, vals);
      const W = 700, H = 160;
      const d = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - (v / max) * (H - 24) - 8;
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
      mc.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:100%">' +
        '<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#a855f7" stop-opacity=".45"/><stop offset="100%" stop-color="#a855f7" stop-opacity="0"/></linearGradient></defs>' +
        '<path d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z" fill="url(#mg)"/>' +
        '<path d="' + d + '" fill="none" stroke="#a855f7" stroke-width="2.4"/></svg>';
    }

    // FAQ
    const list = U().$('#faqList');
    if (list) {
      list.innerHTML = FAQ.map((f, i) =>
        '<div class="faq__item' + (i === 0 ? ' is-open' : '') + '">' +
        '<button class="faq__q">' + U().esc(f[0]) + '<span>+</span></button>' +
        '<div class="faq__a">' + U().esc(f[1]) + '</div></div>').join('');
      list.addEventListener('click', e => {
        const q = e.target.closest('.faq__q');
        if (!q) return;
        const item = q.parentElement;
        const open = item.classList.contains('is-open');
        U().$$('.faq__item', list).forEach(x => { x.classList.remove('is-open'); x.querySelector('.faq__q span').textContent = '+'; });
        if (!open) { item.classList.add('is-open'); q.querySelector('span').textContent = '–'; }
      });
    }
  }

  /* ---------- classement ---------- */
  function initLeaderboard() {
    const table = U().$('#lbTable');
    const info = U().$('#lbInfo');
    if (!table) return;
    let mode = 'views';

    function render() {
      const me = S().current();
      const rows = MOCK.slice();
      rows.push({ name: me.username, views: me.views, clicks: (me.links || []).reduce((s, l) => s + (l.clicks || 0), 0), premium: me.premium, badge: '', me: true });
      if (mode === 'views') rows.sort((a, b) => b.views - a.views);
      else if (mode === 'clicks') rows.sort((a, b) => b.clicks - a.clicks);
      else if (mode === 'premium') rows.sort((a, b) => (b.premium - a.premium) || (b.views - a.views));
      else rows.sort((a, b) => a.name.localeCompare(b.name));
      const label = { views: 'Vues', clicks: 'Clics', premium: 'Premium', members: 'Membres' }[mode];
      table.innerHTML = '<thead><tr><th></th><th>Profil</th><th>' + label + '</th><th>Statut</th><th>Page</th></tr></thead><tbody>' +
        rows.map((r, i) => `
          <tr class="${r.me ? 'is-me' : ''}" style="${r.me ? 'background:var(--grad-soft)' : ''}">
            <td><span class="rank ${i === 0 ? 'rank--1' : i === 1 ? 'rank--2' : i === 2 ? 'rank--3' : ''}">${i + 1}</span></td>
            <td><div class="row gap8"><span style="width:28px;height:28px;border-radius:9px;overflow:hidden;display:block">${U().avatarSvg(r.name, 28)}</span>
              <b>${U().esc(r.name)}</b>${r.me ? '<span class="pill">vous</span>' : ''}</div></td>
            <td><b>${U().fmt(mode === 'clicks' ? r.clicks : r.views)}</b></td>
            <td>${r.premium ? '<span class="pill pill--gold">Premium</span>' : '<span class="pill">Gratuit</span>'}
              ${r.badge ? '<span class="pill pill--green">' + U().esc(r.badge) + '</span>' : ''}</td>
            <td><a class="btn btn--ghost btn--sm" href="index.html?u=${encodeURIComponent(r.name)}">Voir</a></td>
          </tr>`).join('') + '</tbody>';
      info.textContent = rows.length + ' profils';
    }
    U().$$('#lbTabs [data-lb]').forEach(b => b.onclick = () => {
      mode = b.dataset.lb;
      U().$$('#lbTabs .tab').forEach(x => x.classList.toggle('is-sel', x === b));
      render();
    });
    render();
  }

  /* ---------- tarifs ---------- */
  function initPricing() {
    const t = U().$('#cmpTable');
    if (!t) return;
    const rows = [
      ['Pages link-in-bio', '1', 'Illimitées'],
      ['Liens', 'Illimités', 'Illimités'],
      ['Avatar + fond personnalisé', '✓', '✓'],
      ['Effets de fond', 'De base', 'Tous + exclusifs'],
      ['Curseur personnalisé', '✗', '✓'],
      ['Lecteur audio + playlist', '✓', '✓'],
      ['Compteur de clics', '✓', '✓'],
      ['Statistiques', '12 h', '12 h / 24 h / 7 j'],
      ['Hébergement de fichiers', '100 Mo', '5 Go'],
      ['Badges Premium', '✗', '✓'],
      ['Support prioritaire', '✗', '✓'],
      ['Prix', '0 €', '7,99 € (à vie)']
    ];
    t.innerHTML = '<thead><tr><th>Fonctionnalité</th><th>Gratuit</th><th>Premium</th></tr></thead><tbody>' +
      rows.map(r => `<tr><td>${r[0]}</td><td class="muted">${r[1]}</td><td><b>${r[2]}</b></td></tr>`).join('') + '</tbody>';
  }

  /* ---------- comparaison ---------- */
  function initCompare() {
    const t = U().$('#vsTable');
    if (!t) return;
    const rows = [
      ['Pages link-in-bio', '✓', '✓', '✓'],
      ['Design gaming (curseurs, effets)', '✓', '✗', '~'],
      ['Hébergement de fichiers intégré', '✓', '✗', '✗'],
      ['Lecteur audio / playlist', '✓', '✗', '✗'],
      ['Statistiques de vues par profil', '✓', '~', '✗'],
      ['Badge Premium à vie', '✓', '✗', '✗'],
      ['Prix', '0 €', '≈ 5 €/mois', '≈ 19 €/an'],
      ['Offline / local (démo)', '✓', '✗', '✗']
    ];
    t.innerHTML = '<thead><tr><th>Critère</th><th>guns.lol</th><th>Linktree</th><th>Carrd</th></tr></thead><tbody>' +
      rows.map(r => `<tr><td>${r[0]}</td><td style="color:var(--green)"><b>${r[1]}</b></td><td class="muted">${r[2]}</td><td class="muted">${r[3]}</td></tr>`).join('') + '</tbody>';
  }

  /* ---------- connexion / inscription ---------- */
  function initLogin() {
    const tabs = U().$$('[data-mode]');
    if (!tabs.length) return;
    const loginPane = U().$('#loginPane');
    const regPane = U().$('#regPane');

    function setMode(mode) {
      tabs.forEach(t => t.classList.toggle('is-sel', t.dataset.mode === mode));
      loginPane.classList.toggle('hidden', mode !== 'login');
      regPane.classList.toggle('hidden', mode !== 'register');
      document.title = (mode === 'register' ? 'Inscription' : 'Connexion') + ' · guns.lol';
    }
    tabs.forEach(t => t.onclick = () => setMode(t.dataset.mode));
    if (new URLSearchParams(location.search).get('mode') === 'register') setMode('register');

    function renderAccounts() {
      const box = U().$('#lgAccounts');
      const users = S().users();
      box.innerHTML = users.map(u => `
        <div class="linkrow" data-user="${U().esc(u.username)}" style="cursor:pointer">
          <div class="linkrow__ic" style="width:38px;height:38px;border-radius:12px;overflow:hidden">${U().avatarSvg(u.username, 38)}</div>
          <div><div class="linkrow__t">${U().esc(u.username)}</div><div class="linkrow__u">${U().fmt(u.views)} vues</div></div>
          <span class="btn btn--ghost btn--sm">Ouvrir</span>
        </div>`).join('');
      box.onclick = e => {
        const row = e.target.closest('[data-user]');
        if (!row) return;
        S().switchUser(row.dataset.user);
        location.href = 'dashboard.html';
      };
    }
    renderAccounts();

    U().$('#rgCreate').onclick = () => {
      const username = U().$('#rgUser').value.trim();
      const res = S().createUser(username);
      if (!res.ok) { U().toast(res.msg, 'err'); return; }
      const p = S().current();
      p.email = U().$('#rgEmail').value.trim() || p.email;
      p.displayName = username;
      p.alias = username.toUpperCase();
      S().save();
      U().toast('Compte créé — bienvenue !', 'ok');
      setTimeout(() => { location.href = 'dashboard.html'; }, 700);
    };
    U().$('#lgLogin').onclick = () => {
      const username = U().$('#lgUser').value.trim().toLowerCase();
      if (!S().user(username)) { U().toast('Aucun profil avec ce pseudo sur cet appareil.', 'err'); return; }
      S().switchUser(username);
      U().toast('Connecté !', 'ok');
      setTimeout(() => { location.href = 'dashboard.html'; }, 500);
    };
    U().$('#lgUser').addEventListener('keydown', e => { if (e.key === 'Enter') U().$('#lgLogin').click(); });
    U().$('#rgUser').addEventListener('keydown', e => { if (e.key === 'Enter') U().$('#rgCreate').click(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    shell();
    if (U().$('#gunpattern')) initHome();
    if (U().$('#lbTable')) initLeaderboard();
    if (U().$('#cmpTable')) initPricing();
    if (U().$('#vsTable')) initCompare();
    if (U().$('#regPane')) initLogin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
