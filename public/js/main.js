/* ============================================================
   CUEVAS AUTOMÓVILES — MAIN JAVASCRIPT
   ============================================================ */

// ── GALLERY SLIDER (compartido entre home y catálogo) ─────────
window.galleryNav = function(id, dir, event) {
  event.stopPropagation();
  const wrap = document.querySelector(`.vehicle-card-gallery[data-id="${id}"]`);
  if (!wrap) return;
  const slides = wrap.querySelectorAll('.gallery-slide');
  const dots   = wrap.querySelectorAll('.gallery-dot');
  if (!slides.length) return;
  let cur = Array.from(slides).findIndex(s => s.classList.contains('active'));
  if (cur < 0) cur = 0;
  slides[cur].classList.remove('active');
  if (dots[cur]) dots[cur].classList.remove('active');
  cur = (cur + dir + slides.length) % slides.length;
  slides[cur].classList.add('active');
  if (dots[cur]) dots[cur].classList.add('active');
};

window.galleryGo = function(id, index, event) {
  event.stopPropagation();
  const wrap = document.querySelector(`.vehicle-card-gallery[data-id="${id}"]`);
  if (!wrap) return;
  wrap.querySelectorAll('.gallery-slide').forEach((s, i) => s.classList.toggle('active', i === index));
  wrap.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === index));
};

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
const canObserve = typeof window !== 'undefined' && 'IntersectionObserver' in window;
const io = canObserve
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 })
  : null;

function bindScrollAnimations(root = document) {
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('.animate-on-scroll').forEach((el) => {
    if (el.dataset.animBound === '1') return;
    el.dataset.animBound = '1';
    if (io) io.observe(el);
    else el.classList.add('visible');
  });
}

bindScrollAnimations();

if (typeof MutationObserver !== 'undefined' && document.body) {
  const dynamicObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        const element = /** @type {Element} */ (node);
        if (element.matches && element.matches('.animate-on-scroll')) {
          bindScrollAnimations(element.parentElement || document);
        } else if (element.querySelectorAll) {
          bindScrollAnimations(element);
        }
      });
    }
  });
  dynamicObserver.observe(document.body, { childList: true, subtree: true });
}

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
