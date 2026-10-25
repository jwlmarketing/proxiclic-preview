// Verrouillage temporaire du site : tant que la BASCULE ci-dessous n'est pas
// desactivee, tous les visiteurs voient /maintenance.html a la place du
// vrai contenu. Le deverrouillage se fait UNIQUEMENT depuis cette page,
// en tapant un code au clavier (cf. maintenance.html + api/unlock.js).
//
// IMPORTANT — ce depot GitHub est PUBLIC : le vrai code secret et le jeton
// de cookie ne doivent JAMAIS etre ecrits en dur ici. Ils vivent uniquement
// dans les variables d'environnement Vercel (Project Settings > Environment
// Variables) :
//   PP_ACCESS_SECRET   -> jeton aleatoire pour le cookie de deverrouillage
//
// Pour REMETTRE le site en ligne pour tout le monde : passe LOCKED a false
// ci-dessous et redeploie (ou supprime ce fichier).

export const config = { matcher: '/:path*' };

const LOCKED = false;
const COOKIE_NAME = 'pp_access';

export default function middleware(request) {
  if (!LOCKED) return;

  const url = new URL(request.url);

  // Laisse TOUJOURS passer la page de maintenance elle-meme, les fichiers
  // necessaires a son affichage, et l'endpoint de verification du code —
  // avant meme de regarder si le secret est configure, sinon l'API de
  // deverrouillage se retrouve elle-meme bloquee.
  if (
    url.pathname === '/maintenance.html' ||
    url.pathname === '/api/unlock' ||
    url.pathname.startsWith('/assets/')
  ) {
    return;
  }

  const secret = process.env.PP_ACCESS_SECRET;
  // Variable d'environnement absente -> on ne peut verifier aucun cookie,
  // on verrouille sans exception plutot que de risquer un contournement.
  if (!secret) {
    return fetch(new URL('/maintenance.html', request.url));
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const hasAccess = cookieHeader
    .split(';')
    .some((c) => c.trim() === `${COOKIE_NAME}=${secret}`);

  if (hasAccess) return;

  return fetch(new URL('/maintenance.html', url.origin));
}
