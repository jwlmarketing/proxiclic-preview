/**
 * widget.js — Pastille de validation flottante, injectée automatiquement
 * dans chaque page de prévisualisation (voir .github/workflows/mirror-preview.yml).
 * N'apparaît QUE sur les prévisualisations Vercel, jamais sur le site en
 * production (OVH) — ce fichier n'est jamais copié vers le dépôt principal.
 *
 * "Corriger" ouvre un mode sélecteur : on clique sur l'élément de la page
 * qui pose problème (texte, image...), puis on décrit le souci. Ça évite
 * d'avoir à décrire "où" en mots.
 */
(function () {
  const pr = window.__PREVIEW_PR__;
  const SECRET = window.__PREVIEW_WIDGET_SECRET__ || '';
  if (!pr) return;

  const WIDGET_IDS = ['pcw-pill', 'pcw-panel', 'pcw-hint'];

  const style = document.createElement('style');
  style.textContent = `
    #pcw-pill {
      position: fixed; bottom: 20px; right: 20px; z-index: 999999;
      background: #111827; color: #fff; border-radius: 999px;
      padding: 10px 14px; font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px; display: flex; gap: 8px; align-items: center;
      box-shadow: 0 4px 16px rgba(0,0,0,.35);
    }
    #pcw-pill button {
      border: none; border-radius: 999px; padding: 7px 13px; font-size: 13px;
      cursor: pointer; font-weight: 600;
    }
    #pcw-pill .pcw-yes { background: #22c55e; color: #fff; }
    #pcw-pill .pcw-fix { background: #ef4444; color: #fff; }
    #pcw-pill button:disabled { opacity: .6; cursor: default; }
    #pcw-panel {
      position: fixed; bottom: 72px; right: 20px; z-index: 999999;
      background: #fff; color: #111; border-radius: 12px; padding: 16px;
      width: 300px; box-shadow: 0 4px 20px rgba(0,0,0,.3); display: none;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #pcw-panel .pcw-target {
      background: #f3f4f6; border-radius: 8px; padding: 8px 10px;
      font-size: 12px; color: #374151; margin-bottom: 8px; max-height: 60px;
      overflow: hidden; text-overflow: ellipsis;
    }
    #pcw-panel .pcw-pick-link {
      font-size: 12px; color: #2563eb; cursor: pointer; text-decoration: underline;
      display: inline-block; margin-bottom: 8px;
    }
    #pcw-panel textarea {
      width: 100%; min-height: 80px; margin: 8px 0; padding: 8px;
      border: 1px solid #ddd; border-radius: 6px; font-size: 13px;
      font-family: inherit; box-sizing: border-box;
    }
    #pcw-panel button.pcw-send {
      border: none; border-radius: 6px; padding: 8px 14px; font-size: 13px;
      cursor: pointer; background: #ef4444; color: #fff; font-weight: 600;
    }
    #pcw-hint {
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      z-index: 999999; background: #111827; color: #fff; padding: 8px 16px;
      border-radius: 999px; font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px; display: none;
    }
    .pcw-picking, .pcw-picking * { cursor: crosshair !important; }
    .pcw-hover-outline { outline: 2px dashed #2563eb !important; outline-offset: 2px !important; }
    .pcw-selected-outline { outline: 3px solid #ef4444 !important; outline-offset: 2px !important; }
  `;
  document.head.appendChild(style);

  const pill = document.createElement('div');
  pill.id = 'pcw-pill';
  pill.innerHTML = `
    <span>PR #${pr}</span>
    <button class="pcw-yes">✅ Oui</button>
    <button class="pcw-fix">✏️ Corriger</button>
  `;
  document.body.appendChild(pill);

  const panel = document.createElement('div');
  panel.id = 'pcw-panel';
  panel.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;">Qu'est-ce qui ne va pas ?</div>
    <div class="pcw-target" style="display:none;"></div>
    <span class="pcw-pick-link">🎯 Cliquer sur l'élément concerné</span>
    <textarea placeholder="Décris la correction à apporter..."></textarea>
    <button class="pcw-send">Envoyer à Claude</button>
  `;
  document.body.appendChild(panel);

  const hint = document.createElement('div');
  hint.id = 'pcw-hint';
  hint.textContent = '🎯 Clique sur le texte ou l\'image qui pose problème';
  document.body.appendChild(hint);

  const yesBtn = pill.querySelector('.pcw-yes');
  const fixBtn = pill.querySelector('.pcw-fix');
  const pickLink = panel.querySelector('.pcw-pick-link');
  const targetBox = panel.querySelector('.pcw-target');
  const textarea = panel.querySelector('textarea');
  const sendBtn = panel.querySelector('.pcw-send');

  let selectedDescription = '';
  let hoveredEl = null;
  let picking = false;

  function isWidgetEl(el) {
    while (el) {
      if (el.id && WIDGET_IDS.includes(el.id)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function describeElement(el) {
    if (el.tagName === 'IMG') {
      return `Image (${el.getAttribute('alt') || el.getAttribute('src') || 'sans description'})`;
    }
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100);
    return `<${el.tagName.toLowerCase()}> « ${text || '(vide)'} »`;
  }

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isWidgetEl(el)) return;
    if (hoveredEl && hoveredEl !== el) hoveredEl.classList.remove('pcw-hover-outline');
    hoveredEl = el;
    hoveredEl.classList.add('pcw-hover-outline');
  }

  function onClickPick(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isWidgetEl(el)) return;
    e.preventDefault();
    e.stopPropagation();
    stopPicking();
    el.classList.add('pcw-selected-outline');
    selectedDescription = describeElement(el);
    targetBox.textContent = '🎯 ' + selectedDescription;
    targetBox.style.display = 'block';
    panel.style.display = 'block';
    textarea.focus();
  }

  function startPicking() {
    picking = true;
    document.body.classList.add('pcw-picking');
    hint.style.display = 'block';
    panel.style.display = 'none';
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClickPick, true);
  }

  function stopPicking() {
    picking = false;
    document.body.classList.remove('pcw-picking');
    hint.style.display = 'none';
    if (hoveredEl) hoveredEl.classList.remove('pcw-hover-outline');
    hoveredEl = null;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClickPick, true);
  }

  yesBtn.onclick = async () => {
    if (!confirm('Confirmer : cette modification va être fusionnée et mise en ligne sur OVH. Continuer ?')) return;
    yesBtn.disabled = true;
    fixBtn.disabled = true;
    yesBtn.textContent = '...';
    try {
      const r = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pr, secret: SECRET }),
      });
      if (r.ok) {
        pill.innerHTML = '<span>✅ Fusionné — mise en ligne OVH en cours</span>';
      } else {
        const d = await r.json().catch(() => ({}));
        alert('Erreur : ' + (d.error || r.status));
        yesBtn.disabled = false;
        fixBtn.disabled = false;
        yesBtn.textContent = '✅ Oui';
      }
    } catch (e) {
      alert('Erreur réseau : ' + e.message);
      yesBtn.disabled = false;
      fixBtn.disabled = false;
      yesBtn.textContent = '✅ Oui';
    }
  };

  fixBtn.onclick = () => {
    if (picking) { stopPicking(); return; }
    startPicking();
  };

  pickLink.onclick = () => {
    startPicking();
  };

  sendBtn.onclick = async () => {
    const message = textarea.value.trim();
    if (!message) { textarea.focus(); return; }
    const fullMessage = selectedDescription
      ? `Sur : ${selectedDescription}\n\n${message}`
      : message;
    sendBtn.disabled = true;
    sendBtn.textContent = '...';
    try {
      const r = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pr, secret: SECRET, message: fullMessage }),
      });
      if (r.ok) {
        panel.innerHTML = '<div>✅ Envoyé — visible en commentaire sur la Pull Request.</div>';
      } else {
        const d = await r.json().catch(() => ({}));
        alert('Erreur : ' + (d.error || r.status));
        sendBtn.disabled = false;
        sendBtn.textContent = 'Envoyer à Claude';
      }
    } catch (e) {
      alert('Erreur réseau : ' + e.message);
      sendBtn.disabled = false;
      sendBtn.textContent = 'Envoyer à Claude';
    }
  };
})();
