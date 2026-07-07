/* Admin-app for Nordfjord Trafikk. Rein JS, ingen avhengigheiter. */
(function () {
  'use strict';

  var root = document.getElementById('viewRoot');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  /* ---------------- Hjelparar ---------------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }

  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('error', !!isError);
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3200);
  }

  function api(path, opts) {
    opts = opts || {};
    if (opts.body && typeof opts.body !== 'string' && !(opts.body instanceof FormData)) {
      opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers);
      opts.body = JSON.stringify(opts.body);
    }
    return fetch('/admin/api' + path, opts).then(function (r) {
      if (r.status === 401) { location.href = '/admin'; throw new Error('Ikkje innlogga'); }
      var ct = r.headers.get('content-type') || '';
      return (ct.includes('json') ? r.json() : r.text()).then(function (body) {
        if (!r.ok || (body && body.ok === false)) {
          throw new Error((body && body.error) || 'Noko gjekk gale (' + r.status + ')');
        }
        return body;
      });
    });
  }

  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) {
      if (o[k] == null) o[k] = /^\d+$/.test(k) ? [] : {};
      return o[k];
    }, obj);
    target[last] = value;
  }

  // Les alle [data-path]-felt i containeren inn i objektet
  function collect(container, obj) {
    container.querySelectorAll('[data-path]').forEach(function (el) {
      var v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'number') v = Number(el.value);
      else v = el.value;
      setPath(obj, el.dataset.path, v);
    });
    return obj;
  }

  function field(label, path, value, opts) {
    opts = opts || {};
    var type = opts.type || 'text';
    if (type === 'textarea') {
      return '<label>' + esc(label) + '<textarea data-path="' + esc(path) + '" rows="' + (opts.rows || 4) + '">' + esc(value) + '</textarea></label>';
    }
    if (type === 'checkbox') {
      return '<div class="check-row"><input type="checkbox" id="f-' + esc(path) + '" data-path="' + esc(path) + '"' + (value ? ' checked' : '') + '><label for="f-' + esc(path) + '">' + esc(label) + '</label></div>';
    }
    return '<label>' + esc(label) + '<input type="' + type + '" data-path="' + esc(path) + '" value="' + esc(value) + '"></label>';
  }

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('nn-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
        d.toLocaleTimeString('nn-NO', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  }

  var STATUSES = {
    signups: ['ny', 'kontakta', 'fullført', 'avmeldt'],
    requests: ['ny', 'kontakta', 'fullført'],
    giftcards: ['ny', 'sendt', 'betalt', 'fullført'],
    messages: ['ny', 'kontakta', 'fullført']
  };

  function statusSelect(kind, item) {
    return '<select class="status-select" data-status="' + item.id + '" aria-label="Status">' +
      STATUSES[kind].map(function (s) {
        return '<option value="' + s + '"' + (item.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') + '</select>';
  }

  function bindListHandlers(section, kind, reload) {
    section.querySelectorAll('[data-status]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        api('/' + kind + '/' + sel.dataset.status, { method: 'PATCH', body: { status: sel.value } })
          .then(function () { toast('Status oppdatert'); refreshBadges(); })
          .catch(function (e) { toast(e.message, true); });
      });
    });
    section.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Slette denne oppføringa for godt?')) return;
        api('/' + kind + '/' + btn.dataset.del, { method: 'DELETE' })
          .then(function () { toast('Sletta'); reload(); refreshBadges(); })
          .catch(function (e) { toast(e.message, true); });
      });
    });
  }

  /* ---------------- Navigasjon ---------------- */

  var views = {};
  var navButtons = document.querySelectorAll('.admin-nav [data-view]');
  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      navButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      show(btn.dataset.view);
    });
  });

  function show(name) {
    root.innerHTML = '<p class="muted">Lastar …</p>';
    views[name]().catch(function (e) {
      root.innerHTML = '<div class="panel"><p>Klarte ikkje å laste: ' + esc(e.message) + '</p></div>';
    });
  }

  function refreshBadges() {
    api('/overview').then(function (data) {
      var c = data.counts;
      var total = c.newSignups + c.newRequests + c.newGiftcards + c.newMessages;
      [['total', total], ['newSignups', c.newSignups], ['newRequests', c.newRequests], ['newGiftcards', c.newGiftcards], ['newMessages', c.newMessages]].forEach(function (pair) {
        var el = document.querySelector('[data-badge="' + pair[0] + '"]');
        if (el) { el.textContent = pair[1]; el.hidden = !pair[1]; }
      });
    }).catch(function () {});
  }

  /* ---------------- Oversikt ---------------- */

  views.oversikt = function () {
    return api('/overview').then(function (data) {
      var c = data.counts;
      root.innerHTML =
        '<div class="toolbar"><h1>Oversikt</h1><a class="btn btn-primary" href="#" id="nyttKursSnarveg">+ Nytt kurs</a></div>' +
        '<div class="grid-4">' +
        kpi(c.newSignups, 'Nye kurspåmeldingar') +
        kpi(c.newRequests, 'Nye opplæringsønske') +
        kpi(c.newMessages, 'Nye meldingar') +
        kpi(c.newGiftcards, 'Nye gåvekortbestillingar') +
        '</div>' +
        '<div class="panel"><h2>Kommande kurs</h2>' +
        (data.upcoming.length
          ? '<div class="table-scroll"><table><thead><tr><th>Kurs</th><th>Avdeling</th><th>Dato</th><th>Påmelde</th></tr></thead><tbody>' +
            data.upcoming.map(function (k) {
              return '<tr><td><strong>' + esc(k.title) + '</strong></td><td>' + esc(k.location) + '</td><td>' + fmtDate(k.starts_at) + '</td><td>' + capMini(k) + '</td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<p class="muted">Ingen kommande kurs. Opprett eit under «Kurs og påmeldingar».</p>') +
        '</div>';
      function kpi(n, label) {
        return '<div class="kpi' + (n ? ' hot' : '') + '"><strong>' + n + '</strong><span>' + label + '</span></div>';
      }
      document.getElementById('nyttKursSnarveg').addEventListener('click', function (e) {
        e.preventDefault();
        navButtons.forEach(function (b) { b.classList.toggle('active', b.dataset.view === 'kurs'); });
        show('kurs');
      });
      refreshBadges();
    });
  };

  function capMini(k) {
    if (!k.capacity) return (k.taken || 0) + ' påmelde';
    var pct = Math.min(100, Math.round((k.taken || 0) / k.capacity * 100));
    var full = k.taken >= k.capacity;
    return '<span class="cap-mini' + (full ? ' full' : '') + '"><span class="bar"><span style="width:' + pct + '%"></span></span><span class="small">' + k.taken + '/' + k.capacity + (full ? ' – FULLT' : '') + '</span></span>';
  }

  /* ---------------- Kurs ---------------- */

  views.kurs = function () {
    return Promise.all([api('/courses'), api('/content/courseTypes'), api('/content/settings'), api('/content/team')]).then(function (res) {
      var courses = res[0].courses;
      var types = res[1].value || [];
      var locations = (res[2].value.locations || []).map(function (l) { return l.name; });
      var teamNames = (res[3].value || []).map(function (t) { return t.name; }).filter(Boolean);

      root.innerHTML =
        '<div class="toolbar"><h1>Kurs og påmeldingar</h1><button class="btn btn-primary" id="btnNyttKurs">+ Nytt kurs</button></div>' +
        '<div id="kursEditor"></div>' +
        '<div class="panel"><div class="table-scroll"><table><thead><tr><th>Kurs</th><th>Avdeling</th><th>Dato</th><th>Påmelde</th><th>Synleg</th><th></th></tr></thead><tbody>' +
        (courses.length ? courses.map(function (k) {
          var instr = [];
          try { instr = JSON.parse(k.instructors || '[]'); } catch (e) {}
          return '<tr>' +
            '<td><strong>' + esc(k.title) + '</strong><br><span class="muted small">' + esc(k.type || '') + (instr.length ? ' · ' + esc(instr.join(', ')) : '') + '</span></td>' +
            '<td>' + esc(k.location) + '</td>' +
            '<td>' + fmtDate(k.starts_at) + (k.ends_at ? '<br><span class="muted small">→ ' + esc(k.ends_at) + '</span>' : '') + '</td>' +
            '<td>' + capMini(k) + '</td>' +
            '<td>' + (k.visible ? 'Ja' : '<span class="pill pill-avmeldt">Skjult</span>') + '</td>' +
            '<td class="row-actions">' +
            '<button class="btn btn-ghost btn-sm" data-signups="' + k.id + '">Påmeldingar (' + k.taken + ')</button>' +
            '<button class="btn btn-ghost btn-sm" data-edit="' + k.id + '">Rediger</button>' +
            '<a class="btn btn-ghost btn-sm" href="/admin/api/courses/' + k.id + '/signups.csv">CSV</a>' +
            '<a class="btn btn-ghost btn-sm" href="/kurs/' + k.id + '/kalender.ics" title="Last ned til kalender">📅</a>' +
            '<button class="btn-danger btn btn-sm" data-delcourse="' + k.id + '">Slett</button>' +
            '</td></tr>' +
            '<tr hidden data-signup-row="' + k.id + '"><td colspan="6"><div data-signup-slot="' + k.id + '"></div></td></tr>';
        }).join('') : '<tr><td colspan="6" class="muted">Ingen kurs enno. Klikk «+ Nytt kurs» for å opprette det første!</td></tr>') +
        '</tbody></table></div></div>' +
        '<div class="panel"><h2>📅 Kalender for kursholdarane</h2>' +
        '<p class="muted small">Kvar kursholdar kan abonnere på kurskalenderen i Google/Outlook/Apple-kalenderen sin («legg til kalender frå nettadresse»). Då dukkar nye kurs opp automatisk med dato og klokkeslett. Lim inn adressa under – eller ei filtrert adresse per kursholdar.</p>' +
        '<p><code>' + location.origin + '/kurs.ics</code> <button class="btn btn-ghost btn-sm" data-copy="/kurs.ics">Kopier</button></p>' +
        (teamNames.length ? '<p class="small">' + teamNames.map(function (n) {
          return '<button class="btn btn-ghost btn-sm" data-copy="/kurs.ics?kursholdar=' + encodeURIComponent(n) + '">' + esc(n) + '</button>';
        }).join(' ') + '</p><p class="muted small">Knappane kopierer den personlege feed-adressa til utklippstavla.</p>' : '');
      root.querySelectorAll('[data-copy]').forEach(function (b) {
        b.addEventListener('click', function () {
          navigator.clipboard.writeText(location.origin + b.dataset.copy).then(function () { toast('Kalenderadresse kopiert'); });
        });
      });

      function editorHtml(k) {
        k = k || { title: '', type: types[0] || '', location: locations[0] || '', starts_at: '', ends_at: '', duration: '', capacity: 12, price: '', description: '', instructors: '[]', visible: 1 };
        var dt = k.starts_at ? String(k.starts_at).slice(0, 16) : '';
        var selected = [];
        try { selected = JSON.parse(k.instructors || '[]'); } catch (e) {}
        return '<div class="panel editor" id="editorPanel"><h2>' + (k.id ? 'Rediger kurs' : 'Nytt kurs') + '</h2>' +
          '<div class="grid-2">' +
          '<label>Tittel<input data-k="title" value="' + esc(k.title) + '" placeholder="T.d. Trafikalt grunnkurs – kveldskurs"></label>' +
          '<label>Kurstype<select data-k="type">' + types.map(function (t) { return '<option' + (t === k.type ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
          '<label>Avdeling<select data-k="location">' + locations.map(function (l) { return '<option' + (l === k.location ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></label>' +
          '<label>Startdato og klokkeslett<input type="datetime-local" data-k="starts_at" value="' + esc(dt) + '"></label>' +
          '<label>Sluttdato (valfri – for kurs over fleire dagar)<input type="date" data-k="ends_at" value="' + esc(String(k.ends_at || '').slice(0, 10)) + '"></label>' +
          '<label>Varigheit (fritekst)<input data-k="duration" value="' + esc(k.duration) + '" placeholder="T.d. 4 kveldar à 3 timar"></label>' +
          '<label>Tal plassar (0 = uavgrensa)<input type="number" min="0" data-k="capacity" value="' + esc(k.capacity) + '"></label>' +
          '<label>Pris (fritekst)<input data-k="price" value="' + esc(k.price) + '" placeholder="T.d. kr 2 200,-"></label>' +
          '</div>' +
          '<label>Kursholdar(ar)</label>' +
          (teamNames.length
            ? '<div class="instructor-picker">' + teamNames.map(function (n, i) {
                return '<label class="check-row small"><input type="checkbox" data-instructor value="' + esc(n) + '"' + (selected.indexOf(n) >= 0 ? ' checked' : '') + '> ' + esc(n) + '</label>';
              }).join('') + '</div>'
            : '<p class="muted small">Legg inn tilsette under «Tilsette» for å kunne velje kursholdarar.</p>') +
          '<label>Skildring<textarea data-k="description" rows="4" placeholder="Kva inneheld kurset, kven passar det for, kva må ein ha med?">' + esc(k.description) + '</textarea></label>' +
          '<div class="check-row"><input type="checkbox" id="kVis" data-k="visible"' + (k.visible ? ' checked' : '') + '><label for="kVis">Synleg på nettsida</label></div>' +
          '<button class="btn btn-primary" id="btnLagreKurs">Lagre kurs</button> ' +
          '<button class="btn btn-ghost" id="btnAvbryt">Avbryt</button></div>';
      }

      function openEditor(k) {
        var slot = document.getElementById('kursEditor');
        slot.innerHTML = editorHtml(k);
        slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('btnAvbryt').addEventListener('click', function () { slot.innerHTML = ''; });
        document.getElementById('btnLagreKurs').addEventListener('click', function () {
          var data = { visible: false };
          slot.querySelectorAll('[data-k]').forEach(function (el) {
            data[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value;
          });
          data.instructors = Array.prototype.map.call(slot.querySelectorAll('[data-instructor]:checked'), function (el) { return el.value; });
          if (!data.title || !data.starts_at) return toast('Tittel og startdato må fyllast ut', true);
          if (data.ends_at && data.ends_at < String(data.starts_at).slice(0, 10)) return toast('Sluttdatoen kan ikkje vere før startdatoen', true);
          var call = k && k.id
            ? api('/courses/' + k.id, { method: 'PUT', body: data })
            : api('/courses', { method: 'POST', body: data });
          call.then(function () { toast('Kurset er lagra'); views.kurs(); })
            .catch(function (e) { toast(e.message, true); });
        });
      }

      document.getElementById('btnNyttKurs').addEventListener('click', function () { openEditor(null); });
      root.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openEditor(courses.find(function (k) { return k.id === Number(btn.dataset.edit); }));
        });
      });
      root.querySelectorAll('[data-delcourse]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Slette kurset og ALLE påmeldingane? Dette kan ikkje angrast.')) return;
          api('/courses/' + btn.dataset.delcourse, { method: 'DELETE' })
            .then(function () { toast('Kurset er sletta'); views.kurs(); })
            .catch(function (e) { toast(e.message, true); });
        });
      });
      root.querySelectorAll('[data-signups]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.dataset.signups;
          var row = root.querySelector('[data-signup-row="' + id + '"]');
          if (!row.hidden) { row.hidden = true; return; }
          row.hidden = false;
          var slot = root.querySelector('[data-signup-slot="' + id + '"]');
          slot.innerHTML = '<p class="muted">Lastar …</p>';
          api('/courses/' + id + '/signups').then(function (res) {
            slot.innerHTML = res.signups.length
              ? '<div class="table-scroll"><table><thead><tr><th>Namn</th><th>Fødd</th><th>Kontakt</th><th>Merknad</th><th>Status</th><th></th></tr></thead><tbody>' +
                res.signups.map(function (s) {
                  return '<tr><td><strong>' + esc(s.name) + '</strong><br><span class="muted small">' + fmtDate(s.created_at) + '</span></td>' +
                    '<td>' + esc(s.birthdate) + '</td>' +
                    '<td>' + (s.phone ? '<a href="tel:' + esc(s.phone) + '">' + esc(s.phone) + '</a><br>' : '') + (s.email ? '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a>' : '') + '</td>' +
                    '<td>' + esc(s.note) + '</td>' +
                    '<td>' + statusSelect('signups', s) + '</td>' +
                    '<td><button class="btn-danger btn btn-sm" data-del="' + s.id + '">Slett</button></td></tr>';
                }).join('') + '</tbody></table></div>'
              : '<p class="muted">Ingen påmeldingar enno.</p>';
            bindListHandlers(slot, 'signups', function () { btn.click(); btn.click(); });
          });
        });
      });
    });
  };

  /* ---------------- Innboksar ---------------- */

  function inboxView(kind, title, cols) {
    return function () {
      return api('/' + kind).then(function (res) {
        root.innerHTML =
          '<div class="toolbar"><h1>' + title + '</h1></div>' +
          '<div class="panel"><div class="table-scroll"><table><thead><tr>' +
          cols.map(function (c) { return '<th>' + c.th + '</th>'; }).join('') +
          '<th>Status</th><th></th></tr></thead><tbody>' +
          (res.items.length ? res.items.map(function (item) {
            return '<tr>' + cols.map(function (c) { return '<td>' + c.td(item) + '</td>'; }).join('') +
              '<td>' + statusSelect(kind, item) + '</td>' +
              '<td><button class="btn-danger btn btn-sm" data-del="' + item.id + '">Slett</button></td></tr>';
          }).join('') : '<tr><td colspan="' + (cols.length + 2) + '" class="muted">Ingenting her enno.</td></tr>') +
          '</tbody></table></div></div>';
        bindListHandlers(root, kind, function () { show(kind); });
        refreshBadges();
      });
    };
  }

  var contactTd = function (i) {
    return (i.phone ? '<a href="tel:' + esc(i.phone) + '">' + esc(i.phone) + '</a><br>' : '') +
      (i.email ? '<a href="mailto:' + esc(i.email) + '">' + esc(i.email) + '</a>' : '');
  };
  var nameTd = function (i) {
    return '<strong>' + esc(i.name || i.buyer_name) + '</strong><br><span class="muted small">' + fmtDate(i.created_at) + '</span>';
  };

  views.requests = inboxView('requests', 'Påmelding til opplæring', [
    { th: 'Namn', td: nameTd },
    { th: 'Fødd', td: function (i) { return esc(i.birthdate); } },
    { th: 'Kontakt', td: contactTd },
    { th: 'Klasse', td: function (i) { return esc(i.klass); } },
    { th: 'Avdeling', td: function (i) { return esc(i.location); } },
    { th: 'Melding', td: function (i) { return esc(i.note); } }
  ]);

  views.messages = inboxView('messages', 'Meldingar frå kontaktskjemaet', [
    { th: 'Frå', td: nameTd },
    { th: 'Kontakt', td: contactTd },
    { th: 'Emne', td: function (i) { return '<strong>' + esc(i.subject) + '</strong>'; } },
    { th: 'Melding', td: function (i) { return esc(i.body); } }
  ]);

  views.giftcards = inboxView('giftcards', 'Gåvekort-bestillingar', [
    { th: 'Bestillar', td: nameTd },
    { th: 'Kontakt', td: function (i) { return (i.buyer_phone ? '<a href="tel:' + esc(i.buyer_phone) + '">' + esc(i.buyer_phone) + '</a><br>' : '') + (i.buyer_email ? '<a href="mailto:' + esc(i.buyer_email) + '">' + esc(i.buyer_email) + '</a>' : ''); } },
    { th: 'Verdi', td: function (i) { return '<strong>' + esc(i.value) + '</strong>'; } },
    { th: 'Mottakar', td: function (i) { return esc(i.recipient); } }
  ]);

  /* ---------------- Tekst og SEO ---------------- */

  views.innhald = function () {
    return Promise.all([api('/content/pages'), api('/content/seo')]).then(function (res) {
      var pages = res[0].value;
      var seo = res[1].value;

      var seoRows = Object.keys(seo).map(function (key) {
        return '<div class="list-block"><strong>' + esc(seoLabel(key)) + '</strong>' +
          field('Sidetittel (title)', key + '.title', seo[key].title) +
          field('Meta-skildring', key + '.description', seo[key].description, { type: 'textarea', rows: 2 }) +
          '</div>';
      }).join('');

      root.innerHTML =
        '<div class="toolbar"><h1>Tekst og SEO</h1><button class="btn btn-primary" id="btnLagreInnhald">Lagre alt</button></div>' +
        '<div class="panel" id="pagesPanel"><h2>Framsida</h2>' +
        field('Liten tittel over overskrifta', 'home.heroKicker', pages.home.heroKicker) +
        field('Undertekst i toppseksjonen', 'home.heroSub', pages.home.heroSub, { type: 'textarea', rows: 3 }) +
        field('Tittel på «Kvifor velje oss»', 'home.uspTitle', pages.home.uspTitle) +
        pages.home.usps.map(function (u, i) {
          return '<div class="list-block"><strong>Salspunkt ' + (i + 1) + '</strong>' +
            field('Tittel', 'home.usps.' + i + '.title', u.title) +
            field('Tekst', 'home.usps.' + i + '.text', u.text, { type: 'textarea', rows: 2 }) + '</div>';
        }).join('') +
        '<h2>Om oss</h2>' +
        field('Introduksjon', 'om.intro', pages.om.intro, { type: 'textarea' }) +
        field('Om skulebilane', 'om.cars', pages.om.cars, { type: 'textarea', rows: 2 }) +
        '<h2>Trafikkopplæringa</h2>' +
        field('Introduksjon', 'opplaring.intro', pages.opplaring.intro, { type: 'textarea', rows: 6 }) +
        pages.opplaring.trinn.map(function (t, i) {
          return '<div class="list-block"><strong>Trinn ' + (i + 1) + '</strong>' +
            field('Tittel', 'opplaring.trinn.' + i + '.title', t.title) +
            field('Tekst', 'opplaring.trinn.' + i + '.body', t.body, { type: 'textarea', rows: 4 }) + '</div>';
        }).join('') +
        '<h2>Prisar</h2>' +
        field('«Oppdatert»-merknad', 'prisar.updated', pages.prisar.updated) +
        field('Introduksjon', 'prisar.intro', pages.prisar.intro, { type: 'textarea', rows: 5 }) +
        field('Gebyr-merknad', 'prisar.gebyrNote', pages.prisar.gebyrNote, { type: 'textarea', rows: 2 }) +
        field('Lenke til Statens vegvesen', 'prisar.gebyrUrl', pages.prisar.gebyrUrl) +
        '<h2>Kurs</h2>' +
        field('Introduksjon', 'kurs.intro', pages.kurs.intro, { type: 'textarea', rows: 3 }) +
        field('Tekst når ingen kurs finst', 'kurs.empty', pages.kurs.empty, { type: 'textarea', rows: 2 }) +
        '<h2>Påmelding til opplæring</h2>' +
        field('Introduksjon', 'pamelding.intro', pages.pamelding.intro, { type: 'textarea', rows: 3 }) +
        '<h2>Gåvekort</h2>' +
        field('Introduksjon', 'gavekort.intro', pages.gavekort.intro, { type: 'textarea', rows: 3 }) +
        field('Slik fungerer det', 'gavekort.how', pages.gavekort.how, { type: 'textarea', rows: 3 }) +
        '<h2>Kontakt</h2>' +
        field('Introduksjon', 'kontakt.intro', pages.kontakt.intro, { type: 'textarea', rows: 2 }) +
        '</div>' +
        '<div class="panel" id="seoPanel"><h2>SEO – tittel og skildring per side</h2><p class="muted small">Tittelen viser i Google og i nettlesarfana. Skildringa viser i søkjetreff – hald ho under ca. 155 teikn.</p>' + seoRows + '</div>';

      document.getElementById('btnLagreInnhald').addEventListener('click', function () {
        collect(document.getElementById('pagesPanel'), pages);
        collect(document.getElementById('seoPanel'), seo);
        Promise.all([
          api('/content/pages', { method: 'PUT', body: { value: pages } }),
          api('/content/seo', { method: 'PUT', body: { value: seo } })
        ]).then(function () { toast('Innhaldet er lagra og publisert'); })
          .catch(function (e) { toast(e.message, true); });
      });
    });
  };

  function seoLabel(key) {
    return ({ home: 'Framsida', om: 'Om oss', opplaring: 'Trafikkopplæringa', prisar: 'Prisar', kurs: 'Kurs', pamelding: 'Påmelding', gavekort: 'Gåvekort', kontakt: 'Kontakt', personvern: 'Personvern' })[key] || key;
  }

  /* ---------------- Prisar ---------------- */

  views.prisar = function () {
    return api('/content/prices').then(function (res) {
      var prices = res.value;

      function render() {
        root.innerHTML =
          '<div class="toolbar"><h1>Prisar</h1><div><button class="btn btn-ghost" id="btnNyGruppe">+ Ny prisgruppe</button> <button class="btn btn-primary" id="btnLagrePrisar">Lagre alt</button></div></div>' +
          prices.map(function (g, gi) {
            return '<div class="panel" data-group="' + gi + '">' +
              '<div class="toolbar"><label style="flex:1">Gruppetittel<input data-gtitle="' + gi + '" value="' + esc(g.title) + '"></label>' +
              '<div class="row-actions">' +
              '<button class="btn btn-ghost btn-sm" data-gmove="' + gi + ',-1"' + (gi === 0 ? ' disabled' : '') + '>↑</button>' +
              '<button class="btn btn-ghost btn-sm" data-gmove="' + gi + ',1"' + (gi === prices.length - 1 ? ' disabled' : '') + '>↓</button>' +
              '<button class="btn-danger btn btn-sm" data-gdel="' + gi + '">Slett gruppa</button></div></div>' +
              g.items.map(function (item, ii) {
                return '<div class="item-row">' +
                  '<input data-ilabel="' + gi + ',' + ii + '" value="' + esc(item.label) + '" placeholder="Kva gjeld prisen?" aria-label="Tekst">' +
                  '<input data-iprice="' + gi + ',' + ii + '" value="' + esc(item.price) + '" placeholder="kr 0,-" aria-label="Pris">' +
                  '<div class="row-actions"><label class="check-row small"><input type="checkbox" data-iindent="' + gi + ',' + ii + '"' + (item.indent ? ' checked' : '') + '>innrykk</label>' +
                  '<button class="btn-danger btn btn-sm" data-idel="' + gi + ',' + ii + '">Fjern</button></div>' +
                  '</div>';
              }).join('') +
              '<button class="btn btn-ghost btn-sm" data-iadd="' + gi + '">+ Legg til linje</button>' +
              '</div>';
          }).join('');

        root.querySelectorAll('[data-gdel]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (!confirm('Slette heile prisgruppa?')) return;
            sync(); prices.splice(Number(b.dataset.gdel), 1); render();
          });
        });
        root.querySelectorAll('[data-gmove]').forEach(function (b) {
          b.addEventListener('click', function () {
            sync();
            var parts = b.dataset.gmove.split(',').map(Number);
            var g = prices.splice(parts[0], 1)[0];
            prices.splice(parts[0] + parts[1], 0, g);
            render();
          });
        });
        root.querySelectorAll('[data-iadd]').forEach(function (b) {
          b.addEventListener('click', function () {
            sync(); prices[Number(b.dataset.iadd)].items.push({ label: '', price: '' }); render();
          });
        });
        root.querySelectorAll('[data-idel]').forEach(function (b) {
          b.addEventListener('click', function () {
            sync();
            var parts = b.dataset.idel.split(',').map(Number);
            prices[parts[0]].items.splice(parts[1], 1); render();
          });
        });
        document.getElementById('btnNyGruppe').addEventListener('click', function () {
          sync(); prices.push({ id: 'gruppe-' + Date.now(), title: 'Ny prisgruppe', items: [{ label: '', price: '' }] }); render();
        });
        document.getElementById('btnLagrePrisar').addEventListener('click', function () {
          sync();
          api('/content/prices', { method: 'PUT', body: { value: prices } })
            .then(function () { toast('Prisane er lagra og publiserte'); })
            .catch(function (e) { toast(e.message, true); });
        });
      }

      function sync() {
        root.querySelectorAll('[data-gtitle]').forEach(function (el) { prices[Number(el.dataset.gtitle)].title = el.value; });
        root.querySelectorAll('[data-ilabel]').forEach(function (el) {
          var p = el.dataset.ilabel.split(',').map(Number);
          prices[p[0]].items[p[1]].label = el.value;
        });
        root.querySelectorAll('[data-iprice]').forEach(function (el) {
          var p = el.dataset.iprice.split(',').map(Number);
          prices[p[0]].items[p[1]].price = el.value;
        });
        root.querySelectorAll('[data-iindent]').forEach(function (el) {
          var p = el.dataset.iindent.split(',').map(Number);
          prices[p[0]].items[p[1]].indent = el.checked;
        });
      }

      render();
    });
  };

  /* ---------------- Tilsette ---------------- */

  views.team = function () {
    return api('/content/team').then(function (res) {
      var team = res.value;

      function render() {
        root.innerHTML =
          '<div class="toolbar"><h1>Tilsette</h1><div><button class="btn btn-ghost" id="btnNyPerson">+ Ny person</button> <button class="btn btn-primary" id="btnLagreTeam">Lagre alt</button></div></div>' +
          '<p class="muted small">Biletadresse kan vere eit opplasta bilete (kopier adressa frå «Bilete»-fana) eller eit av standardbileta.</p>' +
          team.map(function (t, i) {
            return '<div class="panel"><div class="grid-2">' +
              '<div>' + field('Namn', i + '.name', t.name) + field('Rolle', i + '.role', t.role) +
              field('Underviser i (klassar) / tekst', i + '.classes', t.classes) +
              field('Biletadresse', i + '.img', t.img) + '</div>' +
              '<div><img src="' + esc(t.img) + '" alt="" style="width:130px;height:130px;object-fit:cover;object-position:top;border-radius:12px;background:#eee">' +
              '<div class="row-actions" style="margin-top:.6rem">' +
              '<button class="btn btn-ghost btn-sm" data-tmove="' + i + ',-1"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
              '<button class="btn btn-ghost btn-sm" data-tmove="' + i + ',1"' + (i === team.length - 1 ? ' disabled' : '') + '>↓</button>' +
              '<button class="btn-danger btn btn-sm" data-tdel="' + i + '">Fjern person</button></div></div>' +
              '</div></div>';
          }).join('');

        root.querySelectorAll('[data-tdel]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (!confirm('Fjerne denne personen frå nettsida?')) return;
            sync(); team.splice(Number(b.dataset.tdel), 1); render();
          });
        });
        root.querySelectorAll('[data-tmove]').forEach(function (b) {
          b.addEventListener('click', function () {
            sync();
            var p = b.dataset.tmove.split(',').map(Number);
            var t = team.splice(p[0], 1)[0];
            team.splice(p[0] + p[1], 0, t);
            render();
          });
        });
        document.getElementById('btnNyPerson').addEventListener('click', function () {
          sync(); team.push({ name: '', role: 'Trafikklærar', classes: '', img: '' }); render();
        });
        document.getElementById('btnLagreTeam').addEventListener('click', function () {
          sync();
          api('/content/team', { method: 'PUT', body: { value: team } })
            .then(function () { toast('Tilsett-lista er lagra og publisert'); })
            .catch(function (e) { toast(e.message, true); });
        });
      }
      function sync() { collect(root, team); }
      render();
    });
  };

  /* ---------------- Kjøretøy ---------------- */

  views.kjoretoy = function () {
    return api('/content/vehicles').then(function (res) {
      var vehicles = res.value || [];

      function render() {
        root.innerHTML =
          '<div class="toolbar"><h1>Kjøretøy</h1><div><button class="btn btn-ghost" id="btnNyttKjoretoy">+ Nytt kjøretøy</button> <button class="btn btn-primary" id="btnLagreKjoretoy">Lagre alt</button></div></div>' +
          '<p class="muted small">Desse blir viste på sida «Skulebilane våre». Last opp bilete under «Bilete»-fana og lim inn adressa her. Utan bilete viser sida ein tydeleg plasshaldar.</p>' +
          (vehicles.length ? vehicles.map(function (v, i) {
            return '<div class="panel"><div class="grid-2">' +
              '<div>' + field('Namn (t.d. Audi A3)', i + '.name', v.name) +
              field('Kort skildring (valfri)', i + '.desc', v.desc, { type: 'textarea', rows: 2 }) +
              field('Biletadresse (valfri)', i + '.img', v.img) + '</div>' +
              '<div>' + (v.img ? '<img src="' + esc(v.img) + '" alt="" style="width:200px;aspect-ratio:16/10;object-fit:cover;border-radius:12px;background:#eee">' : '<p class="muted small">Ikkje noko bilete enno.</p>') +
              '<div class="row-actions" style="margin-top:.6rem">' +
              '<button class="btn btn-ghost btn-sm" data-vmove="' + i + ',-1"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
              '<button class="btn btn-ghost btn-sm" data-vmove="' + i + ',1"' + (i === vehicles.length - 1 ? ' disabled' : '') + '>↓</button>' +
              '<button class="btn-danger btn btn-sm" data-vdel="' + i + '">Fjern</button></div></div>' +
              '</div></div>';
          }).join('') : '<div class="panel"><p class="muted">Ingen kjøretøy enno. Klikk «+ Nytt kjøretøy».</p></div>');

        root.querySelectorAll('[data-vdel]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (!confirm('Fjerne kjøretøyet frå nettsida?')) return;
            sync(); vehicles.splice(Number(b.dataset.vdel), 1); render();
          });
        });
        root.querySelectorAll('[data-vmove]').forEach(function (b) {
          b.addEventListener('click', function () {
            sync();
            var p = b.dataset.vmove.split(',').map(Number);
            var v = vehicles.splice(p[0], 1)[0];
            vehicles.splice(p[0] + p[1], 0, v);
            render();
          });
        });
        document.getElementById('btnNyttKjoretoy').addEventListener('click', function () {
          sync(); vehicles.push({ name: '', desc: '', img: '' }); render();
        });
        document.getElementById('btnLagreKjoretoy').addEventListener('click', function () {
          sync();
          api('/content/vehicles', { method: 'PUT', body: { value: vehicles } })
            .then(function () { toast('Kjøretøya er lagra og publiserte'); })
            .catch(function (e) { toast(e.message, true); });
        });
      }
      function sync() { collect(root, vehicles); }
      render();
    });
  };

  /* ---------------- Bilete ---------------- */

  views.bilete = function () {
    return api('/images').then(function (res) {
      root.innerHTML =
        '<div class="toolbar"><h1>Bilete</h1><label class="btn btn-primary" style="margin:0">Last opp bilete<input type="file" id="imgUpload" accept="image/*" hidden multiple></label></div>' +
        '<p class="muted small">Opplasta bilete blir automatisk komprimerte og skalerte. Kopier adressa og lim inn t.d. under «Tilsette».</p>' +
        '<div class="img-grid" id="imgGrid">' +
        (res.images.length ? res.images.map(function (img) {
          return '<figure class="img-card" style="margin:0"><img src="/media/' + img.id + '" alt="' + esc(img.name) + '" loading="lazy">' +
            '<figcaption class="img-meta"><code>/media/' + img.id + '</code><br><span class="muted">' + esc(img.name) + '</span><br>' +
            '<button class="btn btn-ghost btn-sm" data-copy="/media/' + img.id + '">Kopier adresse</button> ' +
            '<button class="btn-danger btn btn-sm" data-imgdel="' + img.id + '">Slett</button></figcaption></figure>';
        }).join('') : '<p class="muted">Ingen opplasta bilete enno.</p>') +
        '</div>';

      document.getElementById('imgUpload').addEventListener('change', function () {
        var files = Array.from(this.files || []);
        if (!files.length) return;
        toast('Lastar opp ' + files.length + ' bilete …');
        Promise.all(files.map(function (f) {
          var fd = new FormData();
          fd.append('file', f);
          return api('/images', { method: 'POST', body: fd });
        })).then(function () { toast('Opplasta!'); show('bilete'); })
          .catch(function (e) { toast(e.message, true); });
      });
      root.querySelectorAll('[data-copy]').forEach(function (b) {
        b.addEventListener('click', function () {
          navigator.clipboard.writeText(location.origin + b.dataset.copy)
            .then(function () { toast('Adresse kopiert'); });
        });
      });
      root.querySelectorAll('[data-imgdel]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!confirm('Slette biletet? Stader som brukar det vil miste biletet.')) return;
          api('/images/' + b.dataset.imgdel, { method: 'DELETE' })
            .then(function () { toast('Sletta'); show('bilete'); })
            .catch(function (e) { toast(e.message, true); });
        });
      });
    });
  };

  /* ---------------- Innstillingar ---------------- */

  views.innstillingar = function () {
    return api('/content/settings').then(function (res) {
      var s = res.value;

      function render() {
        root.innerHTML =
          '<div class="toolbar"><h1>Innstillingar</h1><button class="btn btn-primary" id="btnLagreInnst">Lagre alt</button></div>' +

          '<div class="panel" id="alertPanel"><h2>📣 Varsellinje (øvst på alle sider)</h2>' +
          field('Vis varsellinja', 'alert.enabled', s.alert.enabled, { type: 'checkbox' }) +
          field('Tekst', 'alert.text', s.alert.text) +
          field('Lenke (valfri – heile linja blir klikkbar, t.d. /kurs)', 'alert.link', s.alert.link) +
          '</div>' +

          '<div class="panel" id="kontaktPanel"><h2>Kontaktinfo</h2><div class="grid-2">' +
          field('Namn på verksemda', 'siteName', s.siteName) +
          field('Slagord', 'tagline', s.tagline) +
          field('E-postadresse', 'email', s.email) +
          field('Org.nr (valfritt)', 'orgnr', s.orgnr) +
          field('Gateadresse', 'address.street', s.address.street) +
          field('Postnummer', 'address.zip', s.address.zip) +
          field('Poststad', 'address.city', s.address.city) +
          '</div><h2>Sosiale medium</h2><div class="grid-2">' +
          field('Facebook-adresse', 'social.facebook', s.social.facebook) +
          field('Instagram-adresse', 'social.instagram', s.social.instagram) +
          '</div></div>' +

          '<div class="panel"><h2>Avdelingar</h2><div id="locList">' +
          s.locations.map(function (l, i) {
            return '<div class="list-block"><div class="grid-2">' +
              field('Namn (t.d. Nordfjordeid)', 'locations.' + i + '.name', l.name) +
              field('Telefon', 'locations.' + i + '.phone', l.phone) +
              field('Kontaktperson', 'locations.' + i + '.person', l.person) +
              field('Firmanamn (til footer)', 'locations.' + i + '.company', l.company) +
              field('Adresse (til kartet på kontaktsida)', 'locations.' + i + '.address', l.address || '') +
              '</div><button class="btn-danger btn btn-sm" data-locdel="' + i + '">Fjern avdelinga</button></div>';
          }).join('') +
          '</div><button class="btn btn-ghost btn-sm" id="btnNyLoc">+ Legg til avdeling</button></div>' +

          '<div class="panel"><h2>Opningstider</h2><div id="hourList">' +
          (s.hours || []).map(function (h, i) {
            return '<div class="item-row">' +
              '<input data-path="hours.' + i + '.label" value="' + esc(h.label) + '" placeholder="T.d. Måndag–fredag" aria-label="Dagar">' +
              '<input data-path="hours.' + i + '.value" value="' + esc(h.value) + '" placeholder="T.d. 08.00–16.00" aria-label="Tid">' +
              '<button class="btn-danger btn btn-sm" data-hourdel="' + i + '">Fjern</button></div>';
          }).join('') +
          '</div><button class="btn btn-ghost btn-sm" id="btnNyHour">+ Legg til linje</button></div>' +

          '<div class="panel"><h2>🔐 Byt passord</h2><div class="grid-2">' +
          '<label>Noverande passord<input type="password" id="pwCurrent" autocomplete="current-password"></label>' +
          '<label>Nytt passord (minst 10 teikn)<input type="password" id="pwNext" autocomplete="new-password"></label>' +
          '</div><button class="btn btn-ghost" id="btnPw">Byt passord</button></div>' +

          '<div class="panel"><h2>💾 Sikkerheitskopi</h2>' +
          '<p class="muted small">Last ned ein kopi av alt innhald med jamne mellomrom. Med gratisplanen på Render kan databasen gå tapt – med ein fersk kopi kan du gjenopprette alt på sekund.</p>' +
          '<a class="btn btn-ghost" href="/admin/api/backup">Last ned sikkerheitskopi</a> ' +
          '<label class="btn btn-ghost" style="margin:0">Gjenopprett frå fil<input type="file" id="restoreFile" accept="application/json" hidden></label></div>';

        document.getElementById('btnLagreInnst').addEventListener('click', function () {
          collect(root, s);
          api('/content/settings', { method: 'PUT', body: { value: s } })
            .then(function () { toast('Innstillingane er lagra og publiserte'); })
            .catch(function (e) { toast(e.message, true); });
        });
        root.querySelectorAll('[data-locdel]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (!confirm('Fjerne avdelinga?')) return;
            collect(root, s); s.locations.splice(Number(b.dataset.locdel), 1); render();
          });
        });
        document.getElementById('btnNyLoc').addEventListener('click', function () {
          collect(root, s); s.locations.push({ name: '', phone: '', person: '', company: '' }); render();
        });
        root.querySelectorAll('[data-hourdel]').forEach(function (b) {
          b.addEventListener('click', function () {
            collect(root, s); s.hours.splice(Number(b.dataset.hourdel), 1); render();
          });
        });
        document.getElementById('btnNyHour').addEventListener('click', function () {
          collect(root, s); (s.hours = s.hours || []).push({ label: '', value: '' }); render();
        });
        document.getElementById('btnPw').addEventListener('click', function () {
          api('/password', { method: 'POST', body: { current: document.getElementById('pwCurrent').value, next: document.getElementById('pwNext').value } })
            .then(function () { toast('Passordet er endra'); document.getElementById('pwCurrent').value = ''; document.getElementById('pwNext').value = ''; })
            .catch(function (e) { toast(e.message, true); });
        });
        document.getElementById('restoreFile').addEventListener('change', function () {
          var f = this.files[0];
          if (!f) return;
          if (!confirm('Gjenopprette innhald frå fila? Dagens tekstar/prisar/innstillingar blir overskrivne.')) return;
          f.text().then(function (txt) {
            return api('/restore', { method: 'POST', body: JSON.parse(txt) });
          }).then(function () { toast('Gjenoppretta!'); render(); })
            .catch(function (e) { toast('Klarte ikkje å gjenopprette: ' + e.message, true); });
        });
      }
      render();
    });
  };

  /* ---------------- Start ---------------- */
  show('oversikt');
  setInterval(refreshBadges, 60000);
})();
