/**
 * api/correct.js — Fonction serveur Vercel. Reçoit le texte du bouton
 * "Corriger" du widget et le poste en commentaire sur la Pull Request
 * du dépôt PRIVÉ, pour que Jodie/son Claude le voie.
 *
 * Mêmes variables d'environnement que api/approve.js.
 */

const REPO = 'jwlmarketing/automatisation-proxiclic';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { pr, secret, message } = req.body || {};

  if (!secret || secret !== process.env.WIDGET_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!pr || !/^\d+$/.test(String(pr))) {
    return res.status(400).json({ error: 'pr invalide' });
  }
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'message invalide' });
  }

  const token = process.env.GITHUB_PR_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_PR_TOKEN non configuré' });
  }

  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/issues/${pr}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: `🔧 **Correction demandée (via la prévisualisation) :**\n\n${message}`,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.message || 'échec du commentaire' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
