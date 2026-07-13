/* ================================================================
   PIXEL AURA — script.js
   100% Vanilla JavaScript. No frameworks or libraries.
   Sections:
   1. Loading Screen
   2. Scroll Progress Bar + Navbar
   3. Mobile Menu
   4. Cursor Glow
   5. Mouse Parallax (hero shapes)
   6. Particle Background (canvas)
   7. Typing Effect
   8. Content Data + Render (services, portfolio, process, why-us)
   9. Scroll Reveal (fade-up / zoom-in)
   10. Animated Counters
   11. Card Tilt Effect
   12. Ripple Buttons
   13. Contact Form (mailto submission, no backend)
   14. Back To Top Button
   ================================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ============================================================
     1. LOADING SCREEN
     Simulates a loading progress bar, then hides the overlay.
  ============================================================ */
  (function loadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loaderFill = document.getElementById('loaderFill');
    const loaderPercent = document.getElementById('loaderPercent');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 18 + 6;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          loadingScreen.classList.add('hidden');
          document.body.style.overflow = '';
        }, 300);
      }
      loaderFill.style.width = progress + '%';
      loaderPercent.textContent = Math.floor(progress) + '%';
    }, 160);

    document.body.style.overflow = 'hidden';
  })();

  /* ============================================================
     2. SCROLL PROGRESS BAR + NAVBAR STATE
  ============================================================ */
  const navbar = document.getElementById('navbar');
  const progressBar = document.getElementById('scrollProgressBar');
  const sections = document.querySelectorAll('main section[id], #stats');
  const navLinks = document.querySelectorAll('.nav-link');
  const backToTopBtn = document.getElementById('backToTop');

  function updateOnScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = scrollPercent + '%';

    navbar.classList.toggle('scrolled', scrollTop > 40);

    // Active navigation link based on section in view
    let currentSection = 'home';
    sections.forEach((section) => {
      if (scrollTop >= section.offsetTop - 160) {
        currentSection = section.id;
      }
    });
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === currentSection);
    });

    // Back to top visibility
    backToTopBtn.classList.toggle('visible', scrollTop > 500);
  }
  window.addEventListener('scroll', updateOnScroll, { passive: true });

  /* ============================================================
     3. MOBILE MENU TOGGLE
  ============================================================ */
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    menuToggle.classList.toggle('open');
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      menuToggle.classList.remove('open');
    });
  });

  /* ============================================================
     4. CURSOR GLOW (follows mouse with easing)
  ============================================================ */
  const cursorGlow = document.getElementById('cursorGlow');
  const cursorDot = document.getElementById('cursorDot');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  function animateCursorGlow() {
    // Simple easing toward the mouse position for a smooth trailing glow
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;
    cursorGlow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursorGlow);
  }
  animateCursorGlow();

  /* ============================================================
     5. MOUSE PARALLAX ON HERO FLOATING SHAPES
  ============================================================ */
  const parallaxShapes = document.querySelectorAll('[data-parallax]');
  window.addEventListener('mousemove', (e) => {
    const xRatio = e.clientX / window.innerWidth - 0.5;
    const yRatio = e.clientY / window.innerHeight - 0.5;

    parallaxShapes.forEach((shape) => {
      const depth = parseFloat(shape.dataset.parallax) || 20;
      const moveX = xRatio * depth;
      const moveY = yRatio * depth;
      shape.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });

  /* ============================================================
     6. PARTICLE BACKGROUND (HTML5 Canvas + Vanilla JS)
  ============================================================ */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const PARTICLE_COLORS = ['#2e9bff', '#a855f7', '#22d3ee'];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = document.documentElement.scrollHeight;
  }

  function createParticles() {
    const count = Math.min(85, Math.floor(window.innerWidth / 16));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8 + 0.6,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;

      // wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // only draw particles near the current viewport (perf optimization)
      if (p.y < viewTop - 100 || p.y > viewBottom + 100) return;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });
  // Recalculate canvas height if page content grows (images loaded, etc.)
  window.addEventListener('load', resizeCanvas);

  /* ============================================================
     7. TYPING EFFECT (hero subtitle)
  ============================================================ */
  (function typingEffect() {
    const typingEl = document.getElementById('typingText');
    const words = ['Portfolio Websites', 'Business Websites', 'Landing Pages', 'E-commerce Stores', 'Custom Web Apps'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const currentWord = words[wordIndex];

      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      typingEl.textContent = currentWord.substring(0, charIndex);

      let typeSpeed = isDeleting ? 45 : 90;

      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 1400; // pause at full word
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 400;
      }

      setTimeout(type, typeSpeed);
    }
    type();
  })();

  /* ============================================================
     8. CONTENT DATA + RENDERING
  ============================================================ */
  const SERVICES = [
    { icon: '⌘', title: 'Frontend Development', desc: 'Clean, fast, component-driven interfaces built with modern HTML, CSS & JS.' },
    { icon: '✦', title: 'Website Design', desc: 'Visually striking layouts crafted around your brand and your audience.' },
    { icon: '▤', title: 'Landing Pages', desc: 'High-converting single pages engineered for campaigns and product launches.' },
    { icon: '◧', title: 'Portfolio Websites', desc: 'Striking personal & creative portfolios that showcase your best work.' },
    { icon: '◫', title: 'Business Websites', desc: 'Professional, conversion-focused sites that build instant credibility.' },
    { icon: '↻', title: 'Website Redesign', desc: 'Modernize an outdated site without losing your existing SEO value.' },
    { icon: '⚡', title: 'Website Optimization', desc: 'Speed and Core Web Vitals tuning for lightning-fast load times.' },
    { icon: '▦', title: 'Responsive Design', desc: 'Pixel-perfect experiences across mobile, tablet and desktop devices.' }
  ];

  const PROJECTS = [
    { name: 'Verona Real Estate', desc: 'Property listing platform with map search and lead capture forms.', tags: ['HTML', 'CSS', 'JavaScript'], hue: ['#2e9bff', '#22d3ee'] },
    { name: 'Lumen Skincare Store', desc: 'High-converting e-commerce storefront with a custom checkout flow.', tags: ['HTML', 'CSS', 'JS'], hue: ['#a855f7', '#2e9bff'] },
    { name: 'Northstar Portfolio', desc: 'Cinematic personal portfolio with scroll-triggered storytelling.', tags: ['HTML5', 'CSS3', 'JavaScript'], hue: ['#22d3ee', '#a855f7'] },
    { name: 'Aiko Studio Landing', desc: 'Product launch landing page focused on speed and conversions.', tags: ['HTML', 'CSS', 'JS'], hue: ['#2e9bff', '#a855f7'] },
    { name: 'Cursive Bakery Co.', desc: 'Warm, conversion-optimized business site with an online menu.', tags: ['HTML', 'CSS3', 'JavaScript'], hue: ['#a855f7', '#22d3ee'] },
    { name: 'Pulse Fitness Site', desc: 'Membership-driven business website for a boutique fitness studio.', tags: ['HTML', 'CSS', 'JS'], hue: ['#2e9bff', '#22d3ee'] }
  ];

  const PROCESS = [
    { title: 'Requirement Discussion', desc: 'We learn your goals, audience and must-haves.' },
    { title: 'UI Design', desc: 'Wireframes and visuals crafted around your brand.' },
    { title: 'Development', desc: 'Clean, scalable code built section by section.' },
    { title: 'Testing', desc: 'Cross-browser and responsive quality checks.' },
    { title: 'Final Delivery', desc: 'Your finished website, ready to go live.' }
  ];

  const WHY_US = [
    { icon: '★', title: 'Premium Quality', desc: 'Every detail crafted with care.' },
    { icon: '⚡', title: 'Fast Delivery', desc: 'On-time, every time.' },
    { icon: '📱', title: 'Mobile Friendly', desc: 'Perfect on every screen size.' },
    { icon: '🔍', title: 'SEO Ready', desc: 'Built to be found on Google.' },
    { icon: '✦', title: 'Modern UI', desc: 'Designs that feel current.' },
    { icon: '💲', title: 'Affordable Pricing', desc: 'Premium work, fair pricing.' },
    { icon: '🎧', title: 'Free Support', desc: 'We stay after launch, too.' }
  ];

  // ---- Render Services ----
  const servicesGrid = document.getElementById('servicesGrid');
  servicesGrid.innerHTML = SERVICES.map((s, i) => `
    <div class="service-card fade-up tilt-card" style="transition-delay:${(i % 4) * 0.06}s">
      <div class="service-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>
  `).join('');

  // ---- Render Portfolio ----
  const portfolioGrid = document.getElementById('portfolioGrid');
  portfolioGrid.innerHTML = PROJECTS.map((p, i) => {
    const gradId = 'grad-' + p.name.replace(/\s/g, '');
    return `
    <div class="project-card fade-up tilt-card" style="transition-delay:${(i % 3) * 0.08}s">
      <div class="project-thumb" style="background:linear-gradient(135deg, ${p.hue[0]}22, ${p.hue[1]}22);">
        <div class="browser-bar"><i></i><i></i><i></i></div>
        <svg class="project-thumb-screen" viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="${p.hue[0]}"/>
              <stop offset="100%" stop-color="${p.hue[1]}"/>
            </linearGradient>
          </defs>
          <rect x="20" y="20" width="260" height="18" rx="4" fill="url(#${gradId})" opacity="0.6"/>
          <rect x="20" y="50" width="120" height="80" rx="6" fill="url(#${gradId})" opacity="0.3"/>
          <rect x="150" y="50" width="130" height="36" rx="6" fill="url(#${gradId})" opacity="0.45"/>
          <rect x="150" y="94" width="130" height="36" rx="6" fill="url(#${gradId})" opacity="0.45"/>
        </svg>
      </div>
      <div class="project-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="badge-row">${p.tags.map((t) => `<span class="badge">${t}</span>`).join('')}</div>
        <div class="project-actions">
          <a href="#" class="btn btn-neon ripple" onclick="return false;">Live Demo</a>
          <a href="#" class="btn btn-outline ripple" onclick="return false;">Source Code</a>
        </div>
      </div>
    </div>
  `;
  }).join('');

  // ---- Render Process ----
  const processGrid = document.getElementById('processGrid');
  processGrid.innerHTML = PROCESS.map((step, i) => `
    <div class="process-step fade-up" style="transition-delay:${i * 0.08}s">
      <div class="process-num">0${i + 1}</div>
      <h4>${step.title}</h4>
      <p>${step.desc}</p>
    </div>
  `).join('');

  // ---- Render Why Choose Us ----
  const whyGrid = document.getElementById('whyGrid');
  whyGrid.innerHTML = WHY_US.map((item, i) => `
    <div class="why-card fade-up zoom-in" style="transition-delay:${(i % 4) * 0.06}s">
      <div class="why-icon">${item.icon}</div>
      <h4>${item.title}</h4>
      <p>${item.desc}</p>
    </div>
  `).join('');

  /* ============================================================
     9. SCROLL REVEAL (fade-up / zoom-in via IntersectionObserver)
     Runs after content is injected above.
  ============================================================ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-up, .zoom-in').forEach((el) => revealObserver.observe(el));

  /* ============================================================
     10. ANIMATED COUNTERS (statistics section)
  ============================================================ */
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const startTime = performance.now();

      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target + suffix;
        }
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num').forEach((el) => counterObserver.observe(el));

  /* ============================================================
     11. CARD TILT EFFECT (vanilla JS, mouse-based 3D tilt)
     Applied to service cards and project cards.
  ============================================================ */
  function initTiltEffect() {
    const tiltCards = document.querySelectorAll('.tilt-card');

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // max tilt of ~8 degrees
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }
  // Cards are injected dynamically above, so init tilt right after render
  initTiltEffect();

  /* ============================================================
     12. RIPPLE BUTTON EFFECT
     Uses event delegation so it also works on dynamically
     injected buttons (portfolio Live Demo / Source Code).
  ============================================================ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ripple');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);

    ripple.className = 'ripple-circle';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

    btn.style.position = btn.style.position || 'relative';
    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 650);
  });

  /* ============================================================
     13. CONTACT FORM
     Submits to the /api/send-email Vercel Serverless Function via
     fetch(). Shows a loading state on the button, disables it while
     the request is in flight, and reports success/error inline
     without ever reloading the page.
  ============================================================ */
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');

  // Simple, dependency-free email format check (mirrors the server-side check)
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFormStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'form-status' + (type ? ' ' + type : '');
  }

  function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    submitBtnText.textContent = isSubmitting ? 'Sending…' : 'Submit Project';
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormStatus('', '');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const projectType = document.getElementById('projectType').value.trim();
    const budget = document.getElementById('budget').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const details = document.getElementById('details').value.trim();
    const website = document.getElementById('website').value.trim(); // honeypot

    // Client-side validation (server re-validates everything regardless)
    if (!name || !email || !details) {
      setFormStatus('✕ Please fill in your name, email, and project description.', 'error');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setFormStatus('✕ Please enter a valid email address.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, projectType, budget, subject, details, website
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      setFormStatus('✓ Thanks! Your project details were sent — we\'ll be in touch shortly.', 'success');
      contactForm.reset();
    } catch (err) {
      setFormStatus('✕ ' + (err.message || 'Failed to send. Please try again later.'), 'error');
    } finally {
      setSubmitting(false);
    }
  });

  /* ============================================================
     14. BACK TO TOP BUTTON
  ============================================================ */
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Initial call in case the page loads mid-scroll (e.g. refresh)
  updateOnScroll();
});