/**
 * api/approve.js — Fonction serveur Vercel (jamais exécutée côté
 * navigateur). Reçoit le clic "Oui" du widget et fusionne la Pull
 * Request correspondante dans `main` sur le dépôt PRIVÉ.
 *
 * Variables d'environnement requises (définies dans le projet Vercel
 * "proxiclic-preview", jamais dans le code) :
 *   - GITHUB_PR_TOKEN : token avec droit "Pull requests: write" et
 *     "Contents: write" sur jwlmarketing/automatisation-proxiclic
 *   - WIDGET_SECRET : doit correspondre au secret GitHub
 *     PREVIEW_WIDGET_SECRET injecté dans les pages par mirror-preview.yml
 */

const REPO = 'jwlmarketing/automatisation-proxiclic';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { pr, secret } = req.body || {};

  if (!secret || secret !== process.env.WIDGET_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!pr || !/^\d+$/.test(String(pr))) {
    return res.status(400).json({ error: 'pr invalide' });
  }

  const token = process.env.GITHUB_PR_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_PR_TOKEN non configuré' });
  }

  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/pulls/${pr}/merge`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merge_method: 'squash',
        commit_title: `Fusion PR #${pr} (approuvée via prévisualisation)`,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.message || 'échec de la fusion' });
    }
    return res.status(200).json({ ok: true, merged: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
