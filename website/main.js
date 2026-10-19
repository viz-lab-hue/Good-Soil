/* =====================================================
   GOOD SOIL — Main JavaScript
   Navbar, scroll reveals, mobile menu, form, counters
   ===================================================== */

(function () {
  'use strict';

  // ── Navbar scroll effect ──
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  function handleNavScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    lastScroll = y;
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ── Mobile menu toggle ──
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('active');
      const spans = toggle.querySelectorAll('span');
      if (links.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close mobile menu when a link is clicked
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('active');
        const spans = toggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
    });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = navbar.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Scroll-reveal animations ──
  const reveals = document.querySelectorAll('.reveal');

  function checkReveals() {
    const trigger = window.innerHeight * 0.88;
    reveals.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < trigger) {
        el.classList.add('visible');
      }
    });
  }
  window.addEventListener('scroll', checkReveals, { passive: true });
  // Initial check
  requestAnimationFrame(checkReveals);

  // ── Counter animation for program numbers ──
  function animateCounters() {
    document.querySelectorAll('.program-card__number').forEach(el => {
      const target = parseInt(el.textContent, 10);
      if (isNaN(target) || el.dataset.counted) return;

      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight) return;

      el.dataset.counted = 'true';
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 20));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        el.textContent = current;
      }, 50);
    });
  }
  window.addEventListener('scroll', animateCounters, { passive: true });
  requestAnimationFrame(animateCounters);

  // ── Pedagogy number counter ──
  function animatePedagogyNums() {
    document.querySelectorAll('.pedagogy-card__num').forEach(el => {
      if (el.dataset.counted) return;
      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight) return;
      el.dataset.counted = 'true';
      // Simple fade-in slide is already handled by .reveal
    });
  }
  window.addEventListener('scroll', animatePedagogyNums, { passive: true });

  // ── Newsletter form ──
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = document.getElementById('email-input');
      const btn   = document.getElementById('subscribe-btn');
      if (!input || !btn) return;

      const email = input.value.trim();
      if (!email) return;

      // Visual feedback
      btn.textContent = '✓ Subscribed!';
      btn.style.background = 'var(--emerald)';
      btn.style.color = 'var(--white)';
      input.value = '';

      setTimeout(() => {
        btn.textContent = 'Subscribe';
        btn.style.background = '';
        btn.style.color = '';
      }, 3000);
    });
  }

  // ── Track card tilt micro-interaction ──
  document.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('mousemove', function (e) {
      const rect = this.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    card.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  });

  // ── Skill pill hover bounce ──
  document.querySelectorAll('.skill-pill').forEach(pill => {
    pill.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-4px) scale(1.05)';
    });
    pill.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  });

  // ── Passion idea cards gentle float ──
  document.querySelectorAll('.passion-idea').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.15}s`;
  });

  // ── Active nav highlighting on scroll ──
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  function highlightNav() {
    const scrollY = window.scrollY + navbar.offsetHeight + 80;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navAnchors.forEach(a => {
          a.style.color = '';
          if (a.getAttribute('href') === '#' + id) {
            a.style.color = 'var(--emerald)';
          }
        });
      }
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });

})();
