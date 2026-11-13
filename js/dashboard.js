/* =============================================================
   GUNS.LOL CLONE — tableau de bord
   Sections : compte · personnaliser · liens · premium · image host
   ============================================================= */
(function () {
  'use strict';
  const U = () => G.util;
  const I = () => G.icons;
  const S = () => G.store;

  let tab = 'account';
  let chartRange = 12;

  /* ================= helpers ================= */
  function resizeImage(file, maxW, maxH, quality) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width, maxH / img.height);
          const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          res(c.toDataURL('image/jpeg', quality || .82));
        };
        img.onerror = rej;
        img.src = fr.result;
      };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  function sparkline(values, color, h) {
    h = h || 200;
    const W = 700, max = Math.max.apply(null, values.concat([1]));
    const pts = values.map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * W;
      const y = h - (v / max) * (h - 30) - 10;
      return [x, y];
    });
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ' L' + W + ' ' + h + ' L0 ' + h + ' Z';
    let grid = '';
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      grid += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="rgba(255,255,255,.06)"/>';
    }
    return '<svg viewBox="0 0 ' + W + ' ' + h + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity=".45"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#cg)"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '</svg>';
  }

  /* ================= ACCOUNT ================= */
  function renderAccount(main) {
    const p = S().current();
    const views = S().viewsLast(chartRange);
    const total = views.reduce((a, b) => a + b, 0);
    main.innerHTML = `
      <div class="dash__head">
        <div><h1>Vue d'ensemble du compte</h1><p class="muted sm">Bienvenue, ${U().esc(p.displayName)} — voici l'activité de ta page.</p></div>
        <div class="row gap8">
          <button class="btn btn--ghost btn--sm" id="accFree">+1 vue gratuite</button>
          <a class="btn btn--primary btn--sm" href="index.html">Voir ma page</a>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi"><span>Nom d'utilisateur</span><b>${U().esc(p.username)}</b></div>
        <div class="kpi"><span>Alias</span><b>${U().esc(p.alias || '—')}</b></div>
        <div class="kpi"><span>UID</span><b>${U().esc(p.uid)}</b></div>
        <div class="kpi"><span>Vues du profil</span><b>${U().fmt(p.views)}</b></div>
      </div>

      <div class="card card--pad0 mb16">
        <div class="card__head">
          <div class="card__title">Statistiques du compte</div>
          <div class="tabs" style="margin:0">
            ${[12, 24, 168].map(r => `<button class="tab ${r === chartRange ? 'is-sel' : ''}" data-range="${r}">${r === 168 ? '7 jours' : 'Dernières ' + r + ' h'}</button>`).join('')}
          </div>
        </div>
        <div class="card" style="border:0;background:none">
          <p class="muted sm mb12">Vues du profil sur les ${chartRange === 168 ? '7 derniers jours' : 'dernières ' + chartRange + ' heures'} — <b>${U().fmt(total)}</b> vue(s)</p>
          <div class="chartbox">${sparkline(views, '#a855f7')}</div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
        <div class="card">
          <div class="card__title mb12">Gérer ton compte</div>
          <div class="field"><label>Adresse e-mail</label><input class="input" id="accEmail" value="${U().esc(p.email)}"></div>
          <div class="field"><label>Nom d'affichage</label><input class="input" id="accName" value="${U().esc(p.displayName)}"></div>
          <div class="field"><label>Alias</label><input class="input" id="accAlias" value="${U().esc(p.alias || '')}"></div>
          <div class="field"><label>Nouveau mot de passe</label><input class="input" id="accPass" type="password" placeholder="••••••••"></div>
          <div class="btnrow">
            <button class="btn btn--primary btn--sm" id="accSave">Enregistrer</button>
            <button class="btn btn--ghost btn--sm" id="accReset">Réinitialiser le compte</button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card__title mb12">Paramètres du compte</div>
            <div class="setrow"><div><div class="setrow__t">Compte Premium</div><div class="setrow__s">Effets exclusifs, curseurs, thèmes</div></div>
              <div class="switch ${p.premium ? 'is-on' : ''}" data-toggle="premium"></div></div>
            <div class="setrow"><div><div class="setrow__t">Langue</div><div class="setrow__s">Français</div></div>
              <select class="input" style="max-width:150px;height:38px"><option>Français</option><option>English</option><option>Español</option></select></div>
            <div class="setrow"><div><div class="setrow__t">Afficher les vues publiquement</div><div class="setrow__s">Visible sur ta page</div></div>
              <div class="switch ${p.settings.showViews !== false ? 'is-on' : ''}" data-toggle="showViews"></div></div>
            <div class="setrow"><div><div class="setrow__t">Connecté à Discord</div><div class="setrow__s">${p.discord.connected ? 'Compte lié' : 'Non lié'}</div></div>
              <button class="btn btn--ghost btn--sm" id="accDiscord">${p.discord.connected ? 'Délier' : 'Connecter'}</button></div>
          </div>
          <div class="card">
            <div class="card__title mb12">Aide & support</div>
            <p class="muted sm mb12">Une question ? Rejoins la communauté ou consulte le centre d’aide.</p>
            <div class="btnrow">
              <button class="btn btn--ghost btn--sm" id="helpDiscord">Rejoindre Discord</button>
              <a class="btn btn--ghost btn--sm" href="home.html#faq">Centre d’aide</a>
            </div>
          </div>
        </div>
      </div>`;

    U().$$('[data-range]').forEach(b => b.onclick = () => { chartRange = parseInt(b.dataset.range, 10); renderAccount(main); });
    U().$('#accSave').onclick = () => {
      const patch = {
        email: U().$('#accEmail').value.trim(),
        displayName: U().$('#accName').value.trim() || p.username,
        alias: U().$('#accAlias').value.trim()
      };
      S().update(patch);
      U().toast('Compte mis à jour.', 'ok');
      renderAccount(main);
    };
    U().$('#accReset').onclick = () => {
      U().modal({
        title: 'Réinitialiser le compte ?',
        sub: 'Toutes les modifications seront perdues',
        content: '<div class="btnrow" style="justify-content:flex-end"><button class="btn btn--ghost" data-a="no">Annuler</button><button class="btn btn--primary" data-a="yes">Réinitialiser</button></div>'
      }).el.addEventListener('click', e => {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        if (b.dataset.a === 'yes') { S().resetAccount(); U().toast('Compte réinitialisé.', 'ok'); renderAccount(main); }
        e.target.closest('.modal-back').remove();
      });
    };
    U().$('#accDiscord').onclick = () => {
      const patch = { discord: Object.assign({}, p.discord, { connected: !p.discord.connected }) };
      S().update(patch);
      U().toast(patch.discord.connected ? 'Discord connecté.' : 'Discord délié.', 'ok');
      renderAccount(main);
    };
    U().$('#helpDiscord').onclick = () => U().toast('Discord simulé dans cette démo.', 'info');
    U().$('#accFree').onclick = () => {
      const v = S().addFreeViews(1);
      U().toast('+1 vue — total : ' + U().fmt(v), 'ok');
      renderAccount(main);
    };
    U().$$('[data-toggle]').forEach(sw => sw.onclick = () => {
      const k = sw.dataset.toggle;
      const patch = {};
      if (k === 'premium') patch.premium = !p.premium;
      else patch.settings = Object.assign({}, p.settings, { showViews: !p.settings.showViews });
      S().update(patch);
      renderAccount(main);
    });
  }

  /* ================= CUSTOMIZE ================= */
  function renderCustomize(main) {
    const p = S().current();
    const effects = G.effects.EFFECTS;
    main.innerHTML = `
      <div class="dash__head"><div><h1>Personnaliser</h1><p class="muted sm">Avatar, fond, effets, couleurs et badges de ta page.</p></div></div>

      <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
        <div class="card">
          <div class="card__title mb12">Avatar</div>
          <div class="row gap16 mb12">
            <div class="pavatar" style="width:92px;height:92px;margin:0;border-radius:26px" id="czAvatarPrev"></div>
            <div class="grow">
              <input type="file" id="czAvatarFile" accept="image/*" class="hidden">
              <button class="btn btn--primary btn--sm" id="czAvatarBtn">Choisir une image</button>
              <button class="btn btn--ghost btn--sm" id="czAvatarReset">Retirer</button>
              <p class="hint mt8">PNG/JPG — redimensionnée automatiquement en 256 px.</p>
            </div>
          </div>
          <div class="field"><label>Nom d'affichage</label><input class="input" id="czName" value="${U().esc(p.displayName)}"></div>
          <div class="field"><label>Bio</label><textarea class="input" id="czBio">${U().esc(p.bio || '')}</textarea></div>
          <div class="setrow"><div><div class="setrow__t">Effet machine à écrire</div><div class="setrow__s">La bio s’écrit lettre par lettre</div></div>
            <div class="switch ${p.settings.typewriter ? 'is-on' : ''}" data-cz="typewriter"></div></div>
        </div>

        <div class="card">
          <div class="card__title mb12">Fond de page</div>
          <input type="file" id="czBgFile" accept="image/*" class="hidden">
          <button class="btn btn--primary btn--sm mb12" id="czBgBtn">Envoyer un fond</button>
          <button class="btn btn--ghost btn--sm mb16" id="czBgReset">Retirer le fond</button>
          <div class="field"><label>Effet de fond</label>
            <div class="icongrid" id="czEffects" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">
              ${Object.keys(effects).map(k => `
                <button class="chip ${p.effect === k ? 'is-sel' : ''}" data-eff="${k}" style="height:auto;padding:10px;flex-direction:column;gap:4px;display:flex">
                  ${I().icon(k === 'none' ? 'close' : 'zap')}<span style="font-size:11px">${effects[k].name}</span>
                  ${effects[k].premium && !p.premium ? '<span class="pill pill--gold" style="font-size:9px;padding:1px 6px">PRO</span>' : ''}
                </button>`).join('')}
            </div>
          </div>
          <div class="setrow"><div><div class="setrow__t">Flou d’arrière-plan</div><div class="setrow__s">Sur les images de fond</div></div>
            <div class="switch ${p.settings.bgBlur ? 'is-on' : ''}" data-cz="bgBlur"></div></div>
        </div>

        <div class="card">
          <div class="card__title mb12">Couleurs & thème</div>
          <div class="field"><label>Couleur d’accent</label>
            <div class="row gap8" id="czAccents" style="flex-wrap:wrap">
              ${['#8b5cf6', '#d946ef', '#ec4899', '#3b82f6', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'].map(c =>
                `<button data-color="${c}" style="width:38px;height:38px;border-radius:12px;background:${c};border:2px solid ${p.accent === c ? '#fff' : 'transparent'};cursor:pointer"></button>`).join('')}
              <input type="color" id="czColor" value="${U().esc(p.accent)}" title="Couleur personnalisée">
            </div>
          </div>
          <div class="field"><label>Curseur personnalisé</label>
            <div class="icongrid" style="grid-template-columns:repeat(3,1fr)">
              ${[['default', 'Défaut'], ['crosshair', 'Mire'], ['pointer', 'Flèche']].map(c =>
                `<button class="chip ${p.cursor === c[0] ? 'is-sel' : ''}" data-cursor="${c[0]}" style="height:auto;padding:12px">${c[1]}</button>`).join('')}
            </div>
          </div>
          <div class="setrow"><div><div class="setrow__t">Effet 3D au survol</div><div class="setrow__s">Inclinaison des cartes</div></div>
            <div class="switch ${p.settings.tilt ? 'is-on' : ''}" data-cz="tilt"></div></div>
        </div>

        <div class="card">
          <div class="card__title mb12">Badges</div>
          <p class="muted sm mb12">Sélectionne les badges affichés sous ton pseudo.</p>
          <div class="icongrid" id="czBadges" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr))">
            ${Object.keys(BADGES).map(b => `
              <button class="chip ${(p.badges || []).includes(b) ? 'is-sel' : ''}" data-badge="${b}" style="height:auto;padding:9px;display:flex;gap:6px;justify-content:center">
                ${I().icon(BADGES[b].icon)}<span style="font-size:11px">${BADGES[b].label}</span>
              </button>`).join('')}
          </div>
          <button class="btn btn--primary btn--sm mt16" id="czSave">Enregistrer la personnalisation</button>
        </div>
      </div>`;

    const prev = U().$('#czAvatarPrev');
    prev.innerHTML = p.avatar ? '<img src="' + p.avatar + '">' : U().avatarSvg(p.username, 92);

    U().$('#czAvatarBtn').onclick = () => U().$('#czAvatarFile').click();
    U().$('#czAvatarFile').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      const data = await resizeImage(f, 256, 256, .85);
      S().update({ avatar: data });
      U().toast('Avatar mis à jour.', 'ok');
      renderCustomize(main);
    };
    U().$('#czAvatarReset').onclick = () => { S().update({ avatar: null }); renderCustomize(main); };
    U().$('#czBgBtn').onclick = () => U().$('#czBgFile').click();
    U().$('#czBgFile').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      U().toast('Compression du fond…', 'info');
      const data = await resizeImage(f, 1280, 720, .75);
      S().update({ bg: data });
      U().toast('Fond mis à jour.', 'ok');
      renderCustomize(main);
    };
    U().$('#czBgReset').onclick = () => { S().update({ bg: null }); renderCustomize(main); };

    U().$$('[data-eff]').forEach(b => b.onclick = () => {
      const k = b.dataset.eff;
      if (G.effects.EFFECTS[k].premium && !p.premium) { U().toast('Effet Premium — active le Premium dans l’onglet Compte.', 'err'); return; }
      S().update({ effect: k });
      renderCustomize(main);
    });
    U().$$('[data-cursor]').forEach(b => b.onclick = () => { S().update({ cursor: b.dataset.cursor }); renderCustomize(main); });
    U().$$('[data-color]').forEach(b => b.onclick = () => { S().update({ accent: b.dataset.color }); renderCustomize(main); });
    U().$('#czColor').onchange = e => { S().update({ accent: e.target.value }); renderCustomize(main); };
    U().$$('[data-cz]').forEach(sw => sw.onclick = () => {
      const k = sw.dataset.cz;
      S().update({ settings: Object.assign({}, p.settings, { [k]: !p.settings[k] }) });
      renderCustomize(main);
    });
    U().$$('[data-badge]').forEach(b => b.onclick = () => {
      const id = b.dataset.badge;
      const list = (p.badges || []).slice();
      const i = list.indexOf(id);
      if (i === -1) list.push(id); else list.splice(i, 1);
      S().update({ badges: list });
      renderCustomize(main);
    });
    U().$('#czSave').onclick = () => {
      S().update({
        displayName: U().$('#czName').value.trim() || p.username,
        bio: U().$('#czBio').value
      });
      U().toast('Personnalisation enregistrée.', 'ok');
      renderCustomize(main);
    };
  }

  /* ================= LINKS ================= */
  function renderLinks(main) {
    const p = S().current();
    main.innerHTML = `
      <div class="dash__head">
        <div><h1>Liens</h1><p class="muted sm">Gère les boutons affichés sur ta page. ${p.links.length} lien(s).</p></div>
        <button class="btn btn--primary btn--sm" id="lnAdd">Ajouter un lien</button>
      </div>
      <div class="card">
        <div class="linklist" id="lnList">
          ${p.links.length ? p.links.map((l, i) => `
            <div class="linkrow ${l.visible === false ? 'is-hidden' : ''}" data-id="${l.id}">
              <div class="linkrow__ic" style="color:${I().colorOf(l.icon)}">${I().icon(l.icon)}</div>
              <div style="min-width:0">
                <div class="linkrow__t">${U().esc(l.title)} <span class="muted" style="font-weight:400">· ${l.clicks || 0} clics</span></div>
                <div class="linkrow__u">${U().esc(l.url)}</div>
              </div>
              <div class="row gap8">
                <button class="iconbtn" data-act="up" title="Monter">↑</button>
                <button class="iconbtn" data-act="down" title="Descendre">↓</button>
                <button class="iconbtn" data-act="vis" title="Visibilité">${l.visible === false ? '🚫' : '👁'}</button>
                <button class="iconbtn" data-act="edit" title="Modifier">✎</button>
                <button class="iconbtn" data-act="del" title="Supprimer">🗑</button>
              </div>
            </div>`).join('') : '<div class="empty"><h3>Aucun lien</h3><p>Ajoute ton premier lien pour commencer.</p><button class="btn btn--primary" id="lnAddEmpty">Ajouter un lien</button></div>'}
        </div>
      </div>`;

    const add = () => linkModal(null, () => renderLinks(main));
    U().$('#lnAdd').onclick = add;
    const emptyBtn = U().$('#lnAddEmpty');
    if (emptyBtn) emptyBtn.onclick = add;

    U().$('#lnList').addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const id = b.closest('[data-id]').dataset.id;
      const act = b.dataset.act;
      if (act === 'del') {
        S().removeLink(id); U().toast('Lien supprimé.', 'ok'); renderLinks(main);
      } else if (act === 'up') { S().moveLink(id, -1); renderLinks(main); }
      else if (act === 'down') { S().moveLink(id, 1); renderLinks(main); }
      else if (act === 'vis') {
        const l = p.links.find(x => x.id === id);
        S().setLink({ id: id, visible: l.visible === false });
        renderLinks(main);
      } else if (act === 'edit') {
        linkModal(p.links.find(x => x.id === id), () => renderLinks(main));
      }
    });
  }

  function linkModal(link, done) {
    link = link || { title: '', url: '', icon: 'link', visible: true, style: 'glass' };
    const iconList = I().SOCIAL_KEYS.concat(['link', 'mail', 'cart', 'gift', 'music', 'file', 'image', 'globe']);
    const m = U().modal({
      title: link.title ? 'Modifier le lien' : 'Nouveau lien',
      sub: 'Titre, URL et icône',
      content: `
        <div class="field"><label>Titre</label><input class="input" id="lkTitle" value="${U().esc(link.title)}" placeholder="Mon Discord"></div>
        <div class="field"><label>URL</label><input class="input" id="lkUrl" value="${U().esc(link.url)}" placeholder="https://discord.gg/…"></div>
        <div class="field"><label>Icône</label><div class="icongrid" id="lkIcons">
          ${iconList.map(k => `<button data-i="${k}" class="${link.icon === k ? 'is-sel' : ''}" style="color:${I().colorOf(k)}" title="${k}">${I().icon(k)}</button>`).join('')}
        </div></div>
        <div class="row between mb16">
          <span class="muted sm">Visible sur la page</span>
          <div class="switch ${link.visible !== false ? 'is-on' : ''}" id="lkVis"></div>
        </div>
        <div class="btnrow" style="justify-content:flex-end">
          <button class="btn btn--ghost" data-a="cancel">Annuler</button>
          <button class="btn btn--primary" data-a="save">Enregistrer</button>
        </div>`
    });
    let icon = link.icon, visible = link.visible !== false;
    m.el.addEventListener('click', e => {
      const ib = e.target.closest('[data-i]');
      if (ib) {
        icon = ib.dataset.i;
        U().$$('#lkIcons button').forEach(b => b.classList.toggle('is-sel', b === ib));
        return;
      }
      if (e.target.closest('#lkVis')) {
        visible = !visible;
        m.el.querySelector('#lkVis').classList.toggle('is-on', visible);
        return;
      }
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'save') {
        const title = m.el.querySelector('#lkTitle').value.trim();
        const url = m.el.querySelector('#lkUrl').value.trim();
        if (!title || !url) { U().toast('Titre et URL requis.', 'err'); return; }
        S().setLink(Object.assign({}, link, { title: title, url: url, icon: icon, visible: visible }));
        U().toast('Lien enregistré.', 'ok');
        m.close(); done();
      } else m.close();
    });
  }

  /* ================= PREMIUM ================= */
  function renderPremium(main) {
    const p = S().current();
    const perks = [
      ['Effets de fond exclusifs', 'Lucioles, trame, backgrounds animés', true],
      ['Curseurs personnalisés', 'Mire, flèche animée, effets de survol', true],
      ['Hébergement de fichiers', '5 Go au lieu de 100 Mo', true],
      ['Pages illimitées', 'Crée autant de pages que tu veux', true],
      ['Statistiques avancées', 'Historique complet des vues et des clics', true],
      ['Badge Premium', 'Sur ton profil et ton classement', true],
      ['Support prioritaire', 'Réponse en moins de 24 h', true]
    ];
    main.innerHTML = `
      <div class="dash__head"><div><h1>Premium</h1><p class="muted sm">Débloque toutes les fonctions de guns.lol.</p></div></div>
      <div class="grid" style="grid-template-columns:1.2fr 1fr;gap:16px">
        <div class="card">
          <div class="card__title mb12">Ce que tu obtiens</div>
          ${perks.map(x => `<div class="setrow"><div><div class="setrow__t">${x[0]}</div><div class="setrow__s">${x[1]}</div></div>
            <span style="color:var(--green)">✓</span></div>`).join('')}
          <div class="sep"></div>
          <div class="row between mb12"><span class="muted sm">Code promo</span></div>
          <div class="row gap8">
            <input class="input" id="prCode" placeholder="PREMIUM">
            <button class="btn btn--ghost" id="prCodeBtn">Valider</button>
          </div>
          <p class="hint mt8">Démo : le code <b>PREMIUM</b> active le plan.</p>
        </div>
        <div class="card center" style="display:flex;flex-direction:column;justify-content:center">
          <div class="pill ${p.premium ? 'pill--green' : 'pill--gold'}" style="margin:0 auto 14px">${p.premium ? 'Premium actif' : 'Plan Gratuit'}</div>
          <div style="font-size:42px;font-weight:900;letter-spacing:-.03em">7,99 €</div>
          <div class="muted sm">/ à vie — paiement unique</div>
          <p class="muted sm mt16 mb16">Toutes les fonctions Premium, sans abonnement, sans renouvellement.</p>
          ${p.premium
            ? '<button class="btn btn--ghost" id="prDisable">Désactiver la démo Premium</button>'
            : '<button class="btn btn--primary" id="prActivate">Activer Premium (démo)</button>'}
        </div>
      </div>`;

    U().$('#prCodeBtn').onclick = () => {
      const v = U().$('#prCode').value.trim().toUpperCase();
      if (v === 'PREMIUM') {
        S().update({ premium: true });
        U().toast('Premium activé 🎉', 'ok');
        renderPremium(main);
      } else U().toast('Code invalide.', 'err');
    };
    const act = U().$('#prActivate');
    if (act) act.onclick = () => { S().update({ premium: true }); U().toast('Premium activé 🎉', 'ok'); renderPremium(main); };
    const dis = U().$('#prDisable');
    if (dis) dis.onclick = () => { S().update({ premium: false }); U().toast('Premium désactivé.', 'info'); renderPremium(main); };
  }

  /* ================= IMAGE HOST ================= */
  const QUOTA = 100 * 1024 * 1024;
  async function renderFiles(main) {
    const files = await S().idb.all();
    files.sort((a, b) => b.createdAt - a.createdAt);
    const used = files.reduce((s, f) => s + f.size, 0);
    main.innerHTML = `
      <div class="dash__head">
        <div><h1>Image host</h1><p class="muted sm">Héberge tes images et fichiers, puis partage les liens.</p></div>
        <button class="btn btn--primary btn--sm" id="fhPick">Envoyer un fichier</button>
      </div>
      <input type="file" id="fhInput" multiple class="hidden">
      <div class="card mb16">
        <div class="row between mb8"><span class="muted sm">Espace utilisé</span><span class="sm"><b>${U().bytes(used)}</b> / ${U().bytes(QUOTA)}</span></div>
        <div class="quota"><i style="width:${Math.min(100, used / QUOTA * 100)}%"></i></div>
      </div>
      <div class="dropzone" id="fhDrop">
        <div style="font-size:30px">📤</div>
        <b>Glisse tes fichiers ici</b>
        <p class="muted sm mt8">ou clique pour parcourir — stockage local (IndexedDB) dans cette démo</p>
      </div>
      <div class="card card--pad0 mt16">
        <div class="card__head"><div class="card__title">Mes fichiers</div><span class="muted sm">${files.length} fichier(s)</span></div>
        <div id="fhList">
          ${files.length ? files.map(f => `
            <div class="filerow" data-id="${f.id}">
              <div class="filerow__ic">${(f.name.split('.').pop() || '?').slice(0, 4).toUpperCase()}</div>
              <div style="min-width:0">
                <div class="filerow__n">${U().esc(f.name)}</div>
                <div class="filerow__m">${U().bytes(f.size)} · ${U().timeAgo(f.createdAt)} · ${f.views || 0} vue(s)</div>
              </div>
              <div class="row gap8">
                <button class="btn btn--ghost btn--sm" data-f="link">Copier le lien</button>
                <button class="btn btn--ghost btn--sm" data-f="bb">BBCode</button>
                <button class="iconbtn" data-f="del" title="Supprimer">🗑</button>
              </div>
            </div>`).join('') : '<div class="empty"><h3>Aucun fichier</h3><p>Envoie ton premier fichier pour commencer.</p></div>'}
        </div>
      </div>`;

    const input = U().$('#fhInput');
    U().$('#fhPick').onclick = () => input.click();
    U().$('#fhDrop').onclick = () => input.click();
    const dz = U().$('#fhDrop');
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('is-over'); }));
    dz.addEventListener('drop', e => { if (e.dataTransfer.files.length) upload(e.dataTransfer.files); });
    input.onchange = e => { if (e.target.files.length) upload(e.target.files); };

    async function upload(list) {
      let ok = 0;
      for (const f of Array.prototype.slice.call(list)) {
        if (f.size > 25 * 1024 * 1024) { U().toast('Fichier trop volumineux (max 25 Mo).', 'err'); continue; }
        const buf = await f.arrayBuffer();
        const rec = {
          id: S().uid('f'), name: f.name, type: f.type, size: f.size,
          createdAt: Date.now(), views: 0, data: buf
        };
        await S().idb.put(rec);
        ok++;
      }
      U().toast(ok + ' fichier(s) envoyé(s).', 'ok');
      renderFiles(main);
    }

    U().$('#fhList').addEventListener('click', async e => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      const id = b.closest('[data-id]').dataset.id;
      const f = files.find(x => x.id === id);
      if (!f) return;
      const url = 'https://files.guns.lol/' + f.id + '/' + encodeURIComponent(f.name);
      if (b.dataset.f === 'link') U().copy(url, 'Lien copié !');
      if (b.dataset.f === 'bb') U().copy('[url=' + url + '][img]' + url + '[/img][/url]', 'BBCode copié !');
      if (b.dataset.f === 'del') {
        await S().idb.del(id);
        U().toast('Fichier supprimé.', 'ok');
        renderFiles(main);
      }
    });
  }

  /* ================= BADGES (partagés) ================= */
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

  /* ================= ROUTER ================= */
  async function render() {
    const main = U().$('#main');
    U().$$('#side .side__item[data-tab]').forEach(el => el.classList.toggle('is-active', el.dataset.tab === tab));
    if (tab === 'account') renderAccount(main);
    else if (tab === 'customize') renderCustomize(main);
    else if (tab === 'links') renderLinks(main);
    else if (tab === 'premium') renderPremium(main);
    else if (tab === 'files') await renderFiles(main);
  }

  function boot() {
    U().$('#logo').innerHTML = U().logo(28);
    U().$('#logo2').innerHTML = U().logo(26);
    U().$('#navToggle').onclick = () => U().$('#navlinks').classList.toggle('is-open');
    const TAB_ICONS = { account: 'user', customize: 'palette', links: 'link', premium: 'crown', files: 'image' };
    U().$$('#side .side__item[data-tab]').forEach(el => {
      const ic = TAB_ICONS[el.dataset.tab];
      if (ic) el.innerHTML = I().icon(ic) + '<span>' + el.innerHTML + '</span>';
    });
    const myPage = U().$('#sideMyPage');
    if (myPage) myPage.innerHTML = I().icon('external') + '<span>Voir ma page</span>';

    U().$('#side').addEventListener('click', e => {
      const it = e.target.closest('[data-tab]');
      if (!it) return;
      tab = it.dataset.tab;
      render();
    });
    const p = S().current();
    U().$('#myPage').href = 'index.html?u=' + encodeURIComponent(p.username);
    U().$('#sideMyPage').href = 'index.html?u=' + encodeURIComponent(p.username);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
