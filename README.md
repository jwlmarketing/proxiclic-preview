# Proxiclic-Provence

Site vitrine de **Proxiclic-Provence** — assistance et dépannage informatique à domicile pour les particuliers et les professionnels, à Digne-les-Bains et dans les Alpes-de-Haute-Provence.

🔗 **Site en ligne :** [proxiclic-provence.fr](https://www.proxiclic-provence.fr)

---

## À propos

Proxiclic-Provence accompagne particuliers, seniors et professionnels (notaires, avocats, cabinets médicaux, pharmacies, experts-comptables, artisans, commerçants, TPE/PME) pour tout ce qui touche à l'informatique : dépannage, maintenance, changement de matériel, réseau et Wi-Fi.

## Stack technique

- HTML / CSS / JavaScript natifs — aucun framework, aucune dépendance de build
- Formulaire de contact en PHP (`server/contact.php`)
- Polices : [Poppins](https://fonts.google.com/specimen/Poppins) (titres) et [Inter](https://fonts.google.com/specimen/Inter) (texte courant), via Google Fonts
- **Hébergement : OVH (mutualisé), servi par Apache/PHP**
- **Déploiement : automatique via GitHub Actions dès qu'un changement est fusionné
  dans `main`** (`.github/workflows/deploy.yml`, publication en FTP)
- `vercel.json` et `middleware.js` sont des résidus d'un hébergement Vercel
  envisagé puis abandonné — ils ne sont plus utilisés et peuvent être ignorés
  (voire supprimés dans une future branche)

> ⚠️ Toute modification doit suivre le workflow décrit dans `CLAUDE.md` :
> jamais de commit direct sur `main`, toujours une branche + vérification
> via `tools/` avant fusion.

## Structure du projet

```
├── index.html              # Page d'accueil
├── pro/                     # Espace professionnels
├── mentions-legales/
├── confidentialite/
├── politique-cookies/
├── assets/
│   ├── css/                # Feuille de style principale
│   ├── js/                 # Scripts (slider, formulaire, cookies…)
│   └── images/
├── server/
│   └── contact.php          # Traitement du formulaire de contact
├── tools/                   # Workflow de vérification avant mise en ligne
│   └── (voir CLAUDE.md)
└── .github/workflows/
    └── deploy.yml            # Déploiement FTP automatique vers OVH
```

## Développement local

Aucun outil de build requis — servir simplement les fichiers statiques :

```bash
python3 -m http.server 8000
```

Puis ouvrir [http://localhost:8000](http://localhost:8000).

---

## Copyright & propriété

© 2019–2026 **Proxiclic-Provence** — Tous droits réservés.

Ce site, son contenu, ses textes, images et son code source sont la propriété de Proxiclic-Provence et sont protégés par le droit d'auteur. Toute reproduction, distribution ou réutilisation, en tout ou partie, sans autorisation écrite préalable est interdite.

**Conception, stratégie digitale & développement :** [JWL Marketing](https://www.jwl-marketing.fr) — *« Une stratégie freelance, portée par la qualité d'une agence à taille humaine. »*

<div align="center">
<div style="background: #ffffff; border: 1px solid #e1e4e8; border-radius: 12px; padding: 24px; max-width: 450px; margin: 20px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<a href="https://copyright01.com/deposit/4742" target="_blank" rel="noopener">
<img src="https://copyright01.com/deposit/4742" alt="Protected by Copyright01" height="42" style="border: none;" />
</a>
<p style="font-size: 13px; color: #586069; margin: 16px 0 20px 0; line-height: 1.6;">
Nous avons pris le temps de protéger notre Repo git avec
<a href="https://copyright01.com/deposit/4742" target="_blank" rel="noopener" style="color: #0366d6; text-decoration: none; font-weight: 600;">Copyright01</a>
<br>
<code style="background-color: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #24292e; border: 1px solid #eaecef; font-family: monospace;">Ref: CR-2026-72634</code>
<span style="color: #24292e; font-size: 12px; margin-left: 5px;">• Certified 2026-08-20</span>
</p>
<hr style="height: 1px; border: none; background-color: #e1e4e8; margin: 0 auto; width: 80%;" />
<h3 style="font-size: 15px; font-weight: 600; color: #24292e; margin: 20px 0 0 0; letter-spacing: -0.1px;">
Création de sites Web protégés avec
<br>
<a href="https://jwl-marketing.fr" target="_blank" rel="noopener" style="color: #0366d6; text-decoration: none; font-weight: bold;">JWL Marketing</a>
</h3>
</div>
</div>
