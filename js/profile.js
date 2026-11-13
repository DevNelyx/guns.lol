/* =============================================================
   GUNS.LOL CLONE — page publique du profil
   ============================================================= */
(function () {
  'use strict';
  const U = () => G.util;
  const I = () => G.icons;
  const S = () => G.store;

  const BADGES = {
    premium: { label: 'Premium', icon: 'crown', color: '#fbbf24' },
    verified: { label: 'Vérifié', icon: 'verified', color: '#38bdf8' },
    staff: { label: 'Staff', icon: 'shield', color: '#f87171' },
    legend: { label: 'Légende', icon: 'flame', color: '#fb923c' },
    booster: { label: 'Booster', icon: 'bolt', color: '#a3e635' },
    gift: { label: 'Cadeau', icon: 'gift', color: '#f472b6' },
    trophy: { label: 'Trophée', icon: 'trophy', color: '#facc15' },
    heart: { label: 'Favori', icon: 'heart', color: '#fb7185' },
    star: { label: 'Étoile', icon: 'star', color: '#fde047' },
    dev: { label: 'Développeur', icon: 'bolt', color: '#a78bfa' }
  };

  function targetName() {
    const q = new URLSearchParams(location.search).get('u');
    if (q) return q.toLowerCase();
    const h = location.hash.replace(/^#\/?/, '');
    if (h && !/^\d+$/.test(h)) return h.toLowerCase();
    return S().current().username;
  }

  function render() {
    const name = targetName();
    const p = S().user(name) || S().current();
    const isOwner = p.username === S().current().username;

    /* fond + thème */
    document.documentElement.style.setProperty('--accent', p.accent || '#8b5cf6');
    const bg = U().$('#pbg');
    if (p.bg) bg.innerHTML = '<img src="' + p.bg + '" alt="">';
    else bg.innerHTML = '';
    U().$('.pbg__veil') || bg.insertAdjacentHTML('beforeend', '<div class="pbg__veil"></div>');
    if (p.bg && p.settings.bgBlur) bg.style.filter = 'blur(2px)';
    G.effects.apply(U().$('#fx'), p.effect);
    G.effects.cursor(p.cursor);

    /* avatar */
    U().$('#pAvatar').innerHTML = p.avatar
      ? '<img src="' + p.avatar + '" alt="' + U().esc(p.displayName) + '">'
      : U().avatarSvg(p.username, 104);

    /* nom + badges */
    U().$('#pName').innerHTML = U().esc(p.displayName || p.username) +
      (p.premium ? ' ' + I().icon('crown', 'badge-crown') : '');
    const crown = U().$('.badge-crown');
    if (crown) { crown.style.cssText = 'width:20px;height:20px;color:#fbbf24;display:inline-block'; }

    U().$('#pBadges').innerHTML = (p.badges || []).map(b => {
      const meta = BADGES[b];
      if (!meta) return '';
      return '<span class="badge" style="color:' + meta.color + ';border-color:' + meta.color + '44;background:' + meta.color + '18">' +
        I().icon(meta.icon) + U().esc(meta.label) + '</span>';
    }).join('');

    /* bio */
    const bioEl = U().$('#pBio');
    if (p.settings.typewriter) G.effects.typewriter(bioEl, p.bio || '');
    else { bioEl.textContent = p.bio || ''; bioEl.style.whiteSpace = 'pre-line'; }

    U().$('#pMeta').textContent = 'Rejoins guns.lol — ' + (p.uid || '00000000');

    /* liens */
    const links = (p.links || []).filter(l => l.visible !== false);
    U().$('#pLinks').innerHTML = links.length ? links.map(l => {
      const c = I().colorOf(l.icon);
      return '<a class="plink" href="' + U().esc(l.url) + '" target="_blank" rel="noopener" data-link="' + l.id + '">' +
        '<span class="plink__ic" style="color:' + c + '">' + I().icon(l.icon) + '</span>' +
        '<span><span class="plink__t">' + U().esc(l.title) + '</span>' +
        '<span class="plink__s"> · ' + (l.clicks || 0) + ' clics</span></span>' +
        '<span class="plink__arw">↗</span></a>';
    }).join('') : '<div class="muted sm center">Aucun lien pour le moment.</div>';

    U().$$('#pLinks [data-link]').forEach(a => {
      a.addEventListener('click', () => S().clickLink(a.dataset.link));
    });

    /* audio */
    const tracks = (p.audio && p.audio.tracks) || [];
    const audioWrap = U().$('#pAudioWrap');
    const audioEl = U().$('#pAudioEl');
    if (tracks.length) {
      audioWrap.classList.remove('hidden');
      const cur = Math.min(p.audio.current < 0 ? 0 : p.audio.current, tracks.length - 1);
      const t = tracks[cur];
      U().$('#pAudioName').textContent = t.title;
      audioEl.src = t.url;
      audioEl.volume = (p.audio.volume || 70) / 100;
      const btn = U().$('#pAudioBtn');
      btn.onclick = () => {
        if (audioEl.paused) { audioEl.play().catch(() => U().toast('Audio indisponible (URL externe).', 'err')); btn.textContent = '⏸'; }
        else { audioEl.pause(); btn.textContent = '▶'; }
      };
      audioEl.addEventListener('timeupdate', () => {
        const pctv = audioEl.duration ? (audioEl.currentTime / audioEl.duration * 100) : 0;
        U().$('#pAudioBar i').style.width = pctv + '%';
      });
      U().$('#pAudioBar').onclick = e => {
        const r = e.currentTarget.getBoundingClientRect();
        if (audioEl.duration) audioEl.currentTime = (e.clientX - r.left) / r.width * audioEl.duration;
      };
      U().$('#pAudioVol').value = p.audio.volume || 70;
      U().$('#pAudioVol').oninput = e => { audioEl.volume = e.target.value / 100; };
      if (p.audio.autoplay) setTimeout(() => { audioEl.play().catch(() => {}); btn.textContent = '⏸'; }, 600);
    } else {
      audioWrap.classList.add('hidden');
    }

    /* discord */
    if (p.discord && p.discord.connected) {
      const d = U().$('#pDiscord');
      d.classList.remove('hidden');
      d.innerHTML = '<div class="pdiscord__av">' + I().icon('discord') + '</div>' +
        '<div><div class="pdiscord__t">' + U().esc(p.displayName) + '</div>' +
        '<div class="pdiscord__s">' + U().esc(p.discord.status || 'En ligne') + '</div></div>';
    }

    /* vues */
    const viewsEl = U().$('#pViews');
    if (p.settings.showViews !== false) {
      viewsEl.classList.remove('hidden');
      viewsEl.innerHTML = I().icon('eye') + ' <b id="pViewsNum">' + U().compact(p.views) + '</b> vues de ma page';
      G.effects.countUp(U().$('#pViewsNum'), p.views, 1400);
    } else {
      viewsEl.classList.add('hidden');
    }

    /* actions */
    U().$('#pEdit').classList.toggle('hidden', !isOwner);
    U().$('#pFreeViews').classList.toggle('hidden', !isOwner);

    document.title = (p.displayName || p.username) + ' · guns.lol';
  }

  /* ---------- vues ---------- */
  function countView() {
    const name = targetName();
    const p = S().user(name) || S().current();
    const key = 'guns.viewed.' + p.username;
    const last = parseInt(sessionStorage.getItem(key) || '0', 10);
    if (Date.now() - last > 30000) {
      S().addView(p.username);
      sessionStorage.setItem(key, String(Date.now()));
      render();
    }
  }

  /* ---------- interactions ---------- */
  function bind() {
    U().$('#navToggle').addEventListener('click', () => {
      U().$('#navlinks').classList.toggle('is-open');
    });

    U().$('#pShare').addEventListener('click', () => {
      const url = location.href;
      U().modal({
        title: 'Partager ma page',
        sub: 'Copie le lien ou le code d’intégration',
        content:
          '<div class="field"><label>Lien de la page</label><input class="input" id="shareUrl" readonly value="' + U().esc(url) + '"></div>' +
          '<div class="btnrow mb16"><button class="btn btn--primary btn--sm" id="copyUrl">Copier le lien</button>' +
          '<button class="btn btn--ghost btn--sm" id="copyEmbed">Copier l’iframe</button></div>' +
          '<div class="field"><label>Code d’intégration</label><textarea class="input" readonly id="embedCode">' +
          U().esc('<iframe src="' + url + '" width="400" height="600" frameborder="0"></iframe>') + '</textarea></div>' +
          '<p class="hint">Dans cette démo, chaque profil est local à votre navigateur (localStorage).</p>'
      });
      const m = U().$('.modal-back');
      m.querySelector('#copyUrl').onclick = () => U().copy(url, 'Lien copié !');
      m.querySelector('#copyEmbed').onclick = () => U().copy(m.querySelector('#embedCode').value, 'Code copié !');
    });

    U().$('#pFreeViews').addEventListener('click', () => {
      const btn = U().$('#pFreeViews');
      const now = Date.now();
      if (now - (parseInt(btn.dataset.last || '0', 10)) < 30000) {
        U().toast('Une vue gratuite toutes les 30 secondes.', 'err');
        return;
      }
      btn.dataset.last = String(now);
      const v = S().addFreeViews(1);
      U().toast('+1 vue ajoutée — total : ' + U().fmt(v), 'ok');
      render();
    });
  }

  function boot() {
    U().$('#logo').innerHTML = U().logo(28);
    render();
    bind();
    countView();
    window.addEventListener('hashchange', () => { render(); countView(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
