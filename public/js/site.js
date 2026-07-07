/* Nordfjord Trafikk – interaktivitet og animasjonar */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header-skygge ved scroll ---------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobilmeny ---------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('hovudmeny');
  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Opne meny');
    };
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Lukk meny' : 'Opne meny');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); toggle.focus(); }
    });
  }

  /* ---------- Scroll-avdekking ---------- */
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.documentElement.classList.add('no-io');
  }

  /* ---------- Teljarar (statistikk) ---------- */
  if (!prefersReduced && 'IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(String(el.dataset.count).replace(/\D/g, ''), 10);
        if (!isFinite(target)) return;
        var start = target > 100 ? Math.max(0, target - 60) : 0;
        var dur = 1200, t0 = null;
        var step = function (t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(start + (target - start) * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- Skjema (AJAX) ---------- */
  document.querySelectorAll('form.js-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      status.textContent = 'Sender …';
      status.classList.remove('error');

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok && res.body.ok) {
            var tpl = form.parentElement.querySelector('template[data-success]');
            if (tpl) {
              form.replaceWith(tpl.content.cloneNode(true));
            } else {
              status.textContent = 'Sendt!';
            }
          } else {
            throw new Error(res.body && res.body.error ? res.body.error : 'Noko gjekk gale. Prøv igjen.');
          }
        })
        .catch(function (err) {
          status.textContent = err.message || 'Noko gjekk gale. Prøv igjen – eller ring oss.';
          status.classList.add('error');
          btn.disabled = false;
        });
    });
  });

  /* ---------- Informasjonskapslar ---------- */
  var CONSENT_KEY = 'nt-consent';
  var banner = document.getElementById('cookieBanner');
  var getConsent = function () {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  };
  var setConsent = function (v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { /* privat modus */ }
  };
  if (banner && !getConsent()) {
    banner.hidden = false;
    banner.querySelectorAll('[data-consent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setConsent(btn.dataset.consent);
        banner.hidden = true;
        if (btn.dataset.consent === 'all') loadMaps();
      });
    });
  }

  /* ---------- Kart med samtykke + avdelingsval ---------- */
  var mapsLoaded = false;
  function loadMaps() {
    mapsLoaded = true;
    document.querySelectorAll('[data-map]').forEach(function (slot) {
      var iframe = slot.querySelector('iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.title = 'Kart som viser kvar Nordfjord Trafikk held til';
        iframe.loading = 'lazy';
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        slot.innerHTML = '';
        slot.appendChild(iframe);
      }
      iframe.src = 'https://www.google.com/maps?q=' + slot.dataset.q + '&output=embed';
    });
  }
  document.querySelectorAll('[data-map-load]').forEach(function (btn) {
    btn.addEventListener('click', function () { loadMaps(); });
  });
  document.querySelectorAll('[data-map-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('[data-map-tab]').forEach(function (t) {
        t.classList.remove('chip-active');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('chip-active');
      tab.setAttribute('aria-pressed', 'true');
      var slot = document.querySelector('[data-map]');
      if (slot) {
        slot.dataset.q = tab.dataset.q;
        if (mapsLoaded) loadMaps();
      }
    });
  });
  if (getConsent() === 'all') loadMaps();
})();
