/**
 * api/correct.js — reçoit une correction et, si présent, archive l'image
 * sur une branche dédiée afin de joindre un lien stable au commentaire PR.
 */
const REPO = 'jwlmarketing/automatisation-proxiclic';
const ATTACHMENT_BRANCH = 'correction-attachments';
const ALLOWED_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

async function github(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { pr, secret, message, filename, image, imageType } = req.body || {};
  if (!secret || secret !== process.env.WIDGET_SECRET) return res.status(401).json({ error: 'unauthorized' });
  if (!pr || !/^\d+$/.test(String(pr))) return res.status(400).json({ error: 'pr invalide' });
  if (!message || typeof message !== 'string' || message.length > 2000) return res.status(400).json({ error: 'message invalide' });
  if (image && (!filename || typeof filename !== 'string' || !/^[\w .()-]+\.(png|jpe?g|webp|gif)$/i.test(filename))) {
    return res.status(400).json({ error: 'nom de fichier image invalide' });
  }
  if (image && (!ALLOWED_TYPES[imageType] || typeof image !== 'string' || image.length > 4_200_000)) {
    return res.status(400).json({ error: 'image invalide ou trop volumineuse (3 Mo maximum)' });
  }
  const token = process.env.GITHUB_PR_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_PR_TOKEN non configuré' });

  try {
    let imageMarkdown = '';
    if (image) {
      // Crée la branche d'archivage une seule fois, à partir de main.
      let branch = await github(`/repos/${REPO}/git/ref/heads/${ATTACHMENT_BRANCH}`, token);
      if (!branch.response.ok) {
        const main = await github(`/repos/${REPO}/git/ref/heads/main`, token);
        if (!main.response.ok) return res.status(500).json({ error: 'impossible de lire la branche main' });
        const created = await github(`/repos/${REPO}/git/refs`, token, {
          method: 'POST',
          body: JSON.stringify({ ref: `refs/heads/${ATTACHMENT_BRANCH}`, sha: main.data.object.sha }),
        });
        if (!created.response.ok && created.response.status !== 422) {
          return res.status(created.response.status).json({ error: created.data.message || 'création de branche impossible' });
        }
        branch = await github(`/repos/${REPO}/git/ref/heads/${ATTACHMENT_BRANCH}`, token);
      }
      if (!branch.response.ok) return res.status(500).json({ error: 'branche de pièces jointes indisponible' });

      const safeName = filename.trim().replace(/[^\w .()-]/g, '_').replace(/\s+/g, '-').slice(0, 100);
      const path = `correction-attachments/pr-${pr}/${Date.now()}-${safeName}`;
      const uploaded = await github(`/repos/${REPO}/contents/${path}`, token, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Attach correction image for PR #${pr}`,
          content: image,
          branch: ATTACHMENT_BRANCH,
        }),
      });
      if (!uploaded.response.ok) return res.status(uploaded.response.status).json({ error: uploaded.data.message || 'échec du téléversement de l’image' });
      const htmlUrl = uploaded.data.content && uploaded.data.content.html_url;
      if (!htmlUrl) return res.status(500).json({ error: 'image enregistrée mais lien introuvable' });
      imageMarkdown = `\n\n**Image jointe (${safeName}) :** ${htmlUrl}`;
    }

    const posted = await github(`/repos/${REPO}/issues/${pr}/comments`, token, {
      method: 'POST',
      body: JSON.stringify({
        body: `🔧 **Correction demandée (via la prévisualisation) :**\n\n${message}${imageMarkdown}`,
      }),
    });
    if (!posted.response.ok) return res.status(posted.response.status).json({ error: posted.data.message || 'échec du commentaire' });
    return res.status(200).json({ ok: true, imageAttached: Boolean(image) });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
