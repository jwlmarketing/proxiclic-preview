// Proxiclic-Provence — comportements UI
document.addEventListener('DOMContentLoaded', () => {

  // --- Menu mobile ---
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Lien actif : seulement pour les pages distinctes (Accueil / Contact) ---
  const path = window.location.pathname;
  document.querySelectorAll('.main-nav a[href]:not([href^="#"])').forEach(link => {
    if (link.pathname === path) link.classList.add('active');
  });

  // --- Header qui se condense en pastille flottante au scroll ---
  const header = document.querySelector('.site-header');
  if (header) {
    const basculerCondense = () => {
      header.classList.toggle('is-condensed', window.scrollY > 40);
    };
    basculerCondense();
    window.addEventListener('scroll', basculerCondense, { passive: true });
  }

  // --- Bannière cookies ---
  const CLE_CONSENTEMENT = 'proxiclic_cookie_consent';
  const banniere = document.querySelector('.cookie-banniere');
  if (banniere && !localStorage.getItem(CLE_CONSENTEMENT)) {
    setTimeout(() => banniere.classList.add('visible'), 500);
  }
  const fermerBanniere = () => banniere && banniere.classList.remove('visible');
  document.querySelector('.cookie-accepter')?.addEventListener('click', () => {
    localStorage.setItem(CLE_CONSENTEMENT, 'accepte');
    fermerBanniere();
  });
  document.querySelector('.cookie-refuser')?.addEventListener('click', () => {
    localStorage.setItem(CLE_CONSENTEMENT, 'refuse');
    fermerBanniere();
  });
  document.querySelector('.cookie-fermer')?.addEventListener('click', () => {
    localStorage.setItem(CLE_CONSENTEMENT, 'refuse');
    fermerBanniere();
  });

  // --- Formulaire de contact ---
  const CONTACT_API = 'https://licence.jwl-marketing.fr/api/temp/proxiclic/contact.php';

  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const feedback = form.querySelector('.form-feedback');
      const bouton = form.querySelector('button[type="submit"]');
      const libelleInitial = bouton ? bouton.textContent : '';

      const afficher = (texte, ok) => {
        if (!feedback) return;
        feedback.textContent = texte;
        feedback.style.display = 'block';
        feedback.style.color = ok ? 'var(--succes)' : 'var(--alerte)';
      };

      if (bouton) { bouton.disabled = true; bouton.textContent = 'Envoi en cours...'; }

      try {
        const reponse = await fetch(CONTACT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: form.nom.value,
            email: form.email.value,
            sujet: form.sujet.value,
            message: form.message.value,
            site_web: form.site_web ? form.site_web.value : '' // honeypot
          })
        });
        const resultat = await reponse.json();
        if (reponse.ok && resultat.ok) {
          afficher('Merci, votre message a bien été envoyé. Je vous réponds au plus vite.', true);
          form.reset();
        } else {
          afficher(resultat.erreur || "Une erreur est survenue, merci de réessayer ou d'appeler directement.", false);
        }
      } catch (err) {
        afficher("Impossible d'envoyer le message pour le moment. Merci d'appeler directement au 06 99 40 52 98.", false);
      } finally {
        if (bouton) { bouton.disabled = false; bouton.textContent = libelleInitial; }
      }
    });
  }

  const slider = document.getElementById('servicesSlider');
  if (slider) {
    const pas = () => (slider.querySelector('.service-card')?.offsetWidth || 260) + 18;
    document.querySelectorAll('.slider-arrow.next').forEach(btn => {
      btn.addEventListener('click', () => slider.scrollBy({ left: pas(), behavior: 'smooth' }));
    });
    document.querySelectorAll('.slider-arrow.prev').forEach(btn => {
      btn.addEventListener('click', () => slider.scrollBy({ left: -pas(), behavior: 'smooth' }));
    });
  }

  // --- Slider avis Google : flèches + défilement automatique ---
  const avisSlider = document.getElementById('avisSlider');
  if (avisSlider) {
    const pasAvis = () => (avisSlider.querySelector('.avis-card')?.offsetWidth || 280) + 18;
    const finDeCourse = () => avisSlider.scrollLeft + avisSlider.clientWidth >= avisSlider.scrollWidth - 4;

    const avancer = () => {
      if (finDeCourse()) {
        avisSlider.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        avisSlider.scrollBy({ left: pasAvis(), behavior: 'smooth' });
      }
    };
    const reculer = () => {
      if (avisSlider.scrollLeft <= 4) {
        avisSlider.scrollTo({ left: avisSlider.scrollWidth, behavior: 'smooth' });
      } else {
        avisSlider.scrollBy({ left: -pasAvis(), behavior: 'smooth' });
      }
    };

    document.querySelectorAll('.avis-arrow.next').forEach(btn => btn.addEventListener('click', () => { avancer(); redemarrerAuto(); }));
    document.querySelectorAll('.avis-arrow.prev').forEach(btn => btn.addEventListener('click', () => { reculer(); redemarrerAuto(); }));

    let minuteurAuto;
    const demarrerAuto = () => { minuteurAuto = setInterval(avancer, 3500); };
    const arreterAuto = () => clearInterval(minuteurAuto);
    const redemarrerAuto = () => { arreterAuto(); demarrerAuto(); };

    avisSlider.addEventListener('mouseenter', arreterAuto);
    avisSlider.addEventListener('mouseleave', demarrerAuto);
    avisSlider.addEventListener('touchstart', arreterAuto, { passive: true });
    avisSlider.addEventListener('touchend', demarrerAuto);

    demarrerAuto();
  }
});
