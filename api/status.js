/**
 * api/status.js — Fonction serveur Vercel. Donne l'avancement RÉEL de la
 * mise en ligne OVH après un clic sur "Oui".
 *
 * Le workflow .github/workflows/deploy.yml publie des "statuts" sur le
 * commit de fusion (contexte `deploy/ovh`) : « Préparation… », « Envoi 12/91 »,
 * « Vérification du site en ligne », puis « Publié… » ou « Échec… ».
 * Cette fonction lit le dernier statut et le traduit en pourcentage.
 *
 * Variables d'environnement (les mêmes que approve.js) :
 *   - GITHUB_PR_TOKEN : doit pouvoir LIRE les statuts de commit du dépôt
 *     (fine-grained : "Commit statuses: Read" ; classique : repo:status)
 *   - WIDGET_SECRET
 */

const REPO = 'jwlmarketing/automatisation-proxiclic';
const CONTEXT = 'deploy/ovh';

// Traduit le texte du dernier statut en { phase, percent, label, ... }
export function interpret(statuses) {
  const latest = (statuses || []).find((s) => s.context === CONTEXT);
  if (!latest) {
    return { phase: 'waiting', percent: 12, label: 'Fusion faite, démarrage de la mise en ligne…' };
  }
  const desc = String(latest.description || '');
  if (latest.state === 'failure' || latest.state === 'error') {
    return { phase: 'error', percent: 100, label: desc || 'Échec de la mise en ligne', done: true, error: true };
  }
  if (latest.state === 'success') {
    const warn = /non concluante/i.test(desc);
    return { phase: 'done', percent: 100, label: desc || 'Publié sur OVH', done: true, warn };
  }
  // state === 'pending'
  const envoi = desc.match(/Envoi\s+(\d+)\s*\/\s*(\d+)/i);
  if (envoi) {
    const n = Number(envoi[1]);
    const total = Math.max(1, Number(envoi[2]));
    return { phase: 'upload', percent: 25 + Math.round((65 * n) / total), label: `Envoi vers OVH : ${n}/${total} fichiers` };
  }
  if (/v[ée]rification/i.test(desc)) return { phase: 'verify', percent: 95, label: 'Vérification du site en ligne…' };
  if (/pr[ée]paration/i.test(desc)) return { phase: 'prepare', percent: 20, label: 'Préparation de la mise en ligne…' };
  return { phase: 'start', percent: 15, label: 'Mise en ligne démarrée…' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const { sha, secret } = req.body || {};
  if (!secret || secret !== process.env.WIDGET_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!sha || !/^[0-9a-f]{40}$/i.test(String(sha))) {
    return res.status(400).json({ error: 'sha invalide' });
  }
  const token = process.env.GITHUB_PR_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_PR_TOKEN non configuré' });
  }

  try {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/commits/${sha}/statuses?per_page=30`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (resp.status === 403 || resp.status === 404) {
      // Le jeton ne peut pas lire les statuts : la pastille passe en barre "indéterminée".
      return res.status(200).json({ phase: 'unknown', percent: null, label: 'Mise en ligne en cours…', untracked: true });
    }
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'GitHub a répondu ' + resp.status });
    }
    const statuses = await resp.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(interpret(statuses));
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
