<?php
/**
 * API de contact — Proxiclic-Provence
 * À déployer sur : https://licence.jwl-marketing.fr/api/temp/proxiclic/contact.php
 * Reçoit les données du formulaire (JSON) et envoie un email HTML via mail()
 * à contact@proxiclic-provence.fr et wyatt.le@jwlmarketing.fr
 */

// --- Origines autorisées à appeler cette API (CORS) ---
$origines_autorisees = [
    'https://www.proxiclic-provence.fr',
    'https://proxiclic-provence.fr',
    'http://localhost:8934',
];

$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origine, $origines_autorisees, true)) {
    header('Access-Control-Allow-Origin: ' . $origine);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// Pré-requête CORS (navigateur)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erreur' => 'Méthode non autorisée']);
    exit;
}

// --- Lecture des données (JSON ou formulaire classique) ---
$brut = file_get_contents('php://input');
$donnees = json_decode($brut, true);
if (!is_array($donnees)) {
    $donnees = $_POST;
}

$nom     = trim((string)($donnees['nom'] ?? ''));
$email   = trim((string)($donnees['email'] ?? ''));
$sujet   = trim((string)($donnees['sujet'] ?? 'Nouvelle demande via le site'));
$message = trim((string)($donnees['message'] ?? ''));
$piege   = trim((string)($donnees['site_web'] ?? '')); // champ honeypot anti-spam

function repondre_erreur(string $texte): void {
    http_response_code(422);
    echo json_encode(['ok' => false, 'erreur' => $texte]);
    exit;
}

// --- Anti-spam : si le champ piège (invisible) est rempli, on ignore silencieusement ---
if ($piege !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

// --- Validation ---
if ($nom === '' || mb_strlen($nom) > 100) {
    repondre_erreur('Le nom est requis.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    repondre_erreur('Adresse email invalide.');
}
if (mb_strlen($sujet) > 150) {
    repondre_erreur('Objet trop long.');
}
if (mb_strlen($message) > 5000) {
    repondre_erreur('Message trop long.');
}
// Protection basique contre l'injection d'en-têtes email
if (preg_match('/[\r\n]/', $nom . $email . $sujet)) {
    repondre_erreur('Caractères non autorisés détectés.');
}

// --- Préparation des données pour l'email ---
$destinataires = [
    'contact@proxiclic-provence.fr',
    'wyatt.le@jwlmarketing.fr',
];
$destinataire = implode(', ', $destinataires);
$objet_mail   = '[Site Proxiclic-Provence] ' . $sujet;

$nom_html     = htmlspecialchars($nom, ENT_QUOTES, 'UTF-8');
$email_html   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$sujet_html   = htmlspecialchars($sujet, ENT_QUOTES, 'UTF-8');
$message_brut = $message !== '' ? $message : '(aucun message)';
$message_html = nl2br(htmlspecialchars($message_brut, ENT_QUOTES, 'UTF-8'));

$date_fr  = date('d/m/Y à H:i');
$initiale = mb_strtoupper(mb_substr($nom, 0, 1));
$logo_url = 'https://www.proxiclic-provence.fr/assets/images/proxixli-logo-digne-les-bains.jpeg';
$site_url = 'https://www.proxiclic-provence.fr/';
$sujet_url_encode = rawurlencode('Re : ' . $sujet);

// --- Gabarit HTML de l'email (compatible clients mail : tableaux + styles en ligne) ---
$corps_html = <<<HTML
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Nouveau message — Proxiclic-Provence</title>
</head>
<body style="margin:0; padding:0; background-color:#F2F1F1; font-family:Arial, Helvetica, sans-serif;">

  <!-- Texte de prévisualisation (masqué, visible dans la liste des mails) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    Nouvelle demande de {$nom_html} via le formulaire de contact de Proxiclic-Provence.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F1F1; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(6,34,78,0.14);">

          <!-- Bandeau supérieur -->
          <tr>
            <td style="background-color:#06224E; padding:30px 32px; text-align:center;">
              <img src="{$logo_url}" alt="Proxiclic-Provence" width="130" style="display:block; margin:0 auto 14px; border-radius:8px;">
              <span style="display:inline-block; background-color:#EB6139; color:#ffffff; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; padding:6px 14px; border-radius:99px;">Nouvelle demande de contact</span>
            </td>
          </tr>

          <!-- Titre + intro -->
          <tr>
            <td style="padding:34px 32px 6px;">
              <h1 style="margin:0 0 10px; color:#06224E; font-size:23px; font-family:Georgia, 'Times New Roman', serif;">Un visiteur souhaite être recontacté</h1>
              <p style="margin:0; color:#5b6b82; font-size:14px; line-height:1.6;">
                Un message vient d'être envoyé depuis le formulaire de contact du site
                <a href="{$site_url}" style="color:#06224E; font-weight:bold; text-decoration:none;">proxiclic-provence.fr</a>,
                le {$date_fr}. Retrouvez tous les détails ci-dessous.
              </p>
            </td>
          </tr>

          <!-- Ligne de repères rapides -->
          <tr>
            <td style="padding:22px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="background-color:#F2F1F1; border-radius:10px; padding:14px 10px; text-align:center;">
                    <p style="margin:0; font-size:20px;">⚡</p>
                    <p style="margin:4px 0 0; font-size:11px; color:#06224E; font-weight:bold; text-transform:uppercase; letter-spacing:.3px;">À traiter vite</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="background-color:#F2F1F1; border-radius:10px; padding:14px 10px; text-align:center;">
                    <p style="margin:0; font-size:20px;">📍</p>
                    <p style="margin:4px 0 0; font-size:11px; color:#06224E; font-weight:bold; text-transform:uppercase; letter-spacing:.3px;">Alpes-de-Haute-Provence</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="background-color:#F2F1F1; border-radius:10px; padding:14px 10px; text-align:center;">
                    <p style="margin:0; font-size:20px;">🔒</p>
                    <p style="margin:4px 0 0; font-size:11px; color:#06224E; font-weight:bold; text-transform:uppercase; letter-spacing:.3px;">Formulaire vérifié</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Carte détails du contact -->
          <tr>
            <td style="padding:26px 32px 8px;">
              <p style="margin:0 0 10px; font-size:12px; color:#8a97a8; text-transform:uppercase; letter-spacing:.6px; font-weight:bold;">Coordonnées du visiteur</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F1F1; border-radius:12px;">
                <tr>
                  <td width="52" style="padding:18px 0 18px 20px; vertical-align:top;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" height="40" style="background-color:#06224E; border-radius:50%; text-align:center; vertical-align:middle; color:#ffffff; font-size:16px; font-weight:bold;">{$initiale}</td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:18px 20px 18px 14px;">
                    <p style="margin:0 0 2px; font-size:12px; color:#8a97a8; text-transform:uppercase; letter-spacing:.5px;">Nom</p>
                    <p style="margin:0 0 12px; font-size:15px; color:#06224E; font-weight:bold;">{$nom_html}</p>
                    <p style="margin:0 0 2px; font-size:12px; color:#8a97a8; text-transform:uppercase; letter-spacing:.5px;">Email</p>
                    <p style="margin:0 0 12px; font-size:15px;"><a href="mailto:{$email_html}" style="color:#06224E; font-weight:bold; text-decoration:none;">{$email_html}</a></p>
                    <p style="margin:0 0 2px; font-size:12px; color:#8a97a8; text-transform:uppercase; letter-spacing:.5px;">Objet</p>
                    <p style="margin:0; font-size:15px; color:#06224E; font-weight:bold;">{$sujet_html}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Carte message -->
          <tr>
            <td style="padding:22px 32px 8px;">
              <p style="margin:0 0 10px; font-size:12px; color:#8a97a8; text-transform:uppercase; letter-spacing:.6px; font-weight:bold;">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #EB6139; background-color:#FDECE0; border-radius:0 12px 12px 0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0; font-size:15px; line-height:1.7; color:#06224E;">{$message_html}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bouton d'action principal -->
          <tr>
            <td style="padding:30px 32px 10px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#EB6139; border-radius:99px;">
                    <a href="mailto:{$email_html}?subject={$sujet_url_encode}" style="display:inline-block; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none; padding:15px 34px;">Répondre à {$nom_html}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0; font-size:12px; color:#8a97a8;">ou copiez directement l'adresse : {$email_html}</p>
            </td>
          </tr>

          <!-- Séparateur -->
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="border-top:1px solid #ececec;"></div>
            </td>
          </tr>

          <!-- Rappel pratique -->
          <tr>
            <td style="padding:22px 32px 6px;">
              <p style="margin:0 0 8px; font-size:13px; color:#06224E; font-weight:bold;">Pour rappel</p>
              <p style="margin:0; font-size:13px; color:#5b6b82; line-height:1.7;">
                Ce message a été envoyé via le formulaire de contact de proxiclic-provence.fr, protégé par un
                champ anti-spam. La réponse au visiteur doit se faire directement à l'adresse indiquée
                ci-dessus — l'adresse d'envoi de cette notification (no-reply@jwl-marketing.fr) n'est pas surveillée.
              </p>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color:#06224E; padding:26px 32px; text-align:center; margin-top:20px;">
              <p style="margin:0 0 4px; color:#ffffff; font-size:13px; font-weight:bold;">Proxiclic-Provence</p>
              <p style="margin:0; color:#bcd1e8; font-size:12px;">Rue Prête à Partir, 04000 Digne-les-Bains &middot; 06 99 40 52 98</p>
              <p style="margin:10px 0 0; color:#7d94b2; font-size:11px;">Notification automatique &middot; Site propulsé par JWL Marketing</p>
            </td>
          </tr>

        </table>

        <p style="max-width:600px; margin:16px auto 0; font-size:11px; color:#9aa6b8; text-align:center;">
          Vous recevez cet email car vous êtes destinataire des demandes de contact du site proxiclic-provence.fr.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

// --- Envoi de l'email ---
$entetes  = "From: Site Proxiclic-Provence <no-reply@jwl-marketing.fr>\r\n";
$entetes .= "Reply-To: {$nom} <{$email}>\r\n";
$entetes .= "MIME-Version: 1.0\r\n";
$entetes .= "Content-Type: text/html; charset=UTF-8\r\n";

$envoi_ok = mail($destinataire, $objet_mail, $corps_html, $entetes);

if ($envoi_ok) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'erreur' => "L'envoi de l'email a échoué."]);
}
