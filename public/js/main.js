/* ============================================================
   CUEVAS AUTOMÓVILES — MAIN JAVASCRIPT
   ============================================================ */

// ── NAVBAR SCROLL BEHAVIOR ────────────────────────────────────
const navbar = document.getElementById('navbar');
const mobileNav = document.getElementById('mobileNav');
const hamburger = document.getElementById('hamburger');

function updateNavbar() {
  if (!navbar) return;
  if (window.scrollY > 60) {
    navbar.classList.remove('transparent');
    navbar.classList.add('solid');
  } else {
    navbar.classList.add('transparent');
    navbar.classList.remove('solid');
  }
}

window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

// ── MOBILE MENU ───────────────────────────────────────────────
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.querySelectorAll('span')[0].style.transform = isOpen ? 'rotate(45deg) translate(5px,5px)' : '';
    hamburger.querySelectorAll('span')[1].style.opacity   = isOpen ? '0' : '';
    hamburger.querySelectorAll('span')[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px,-5px)' : '';
  });
  // Close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────
const animateEls = document.querySelectorAll('.animate-on-scroll');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
animateEls.forEach(el => io.observe(el));

// ── ACTIVE NAV LINK ───────────────────────────────────────────
(function setActiveLink() {
  const links = document.querySelectorAll('.nav-links a, .mobile-nav a');
  const path  = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();

// ── COUNTER ANIMATION ─────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const step = 16;
  const steps = duration / step;
  let current = 0;
  const inc = target / steps;
  const timer = setInterval(() => {
    current += inc;
    if (current >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(current);
  }, step);
}

const counterEls = document.querySelectorAll('[data-target]');
if (counterEls.length) {
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterIO.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counterEls.forEach(el => counterIO.observe(el));
}

// ── FAVORITE TOGGLE ───────────────────────────────────────────
document.querySelectorAll('.vehicle-card-favorite').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    btn.textContent = btn.classList.contains('active') ? '❤️' : '🤍';
  });
});

// ── CONTACT FORM ──────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
const formSuccess  = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    // Simulate send
    await new Promise(r => setTimeout(r, 1200));
    contactForm.style.display = 'none';
    if (formSuccess) formSuccess.classList.add('show');
  });
}

// ── SMOOTH SCROLL ─────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
