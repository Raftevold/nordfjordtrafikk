// Startinnhald for nettsida. Alt tekstleg innhald her er henta frå nordfjordtrafikk.no (juli 2026)
// eller tydeleg merka som PLACEHOLDER. Etter første oppstart blir innhaldet redigert i admin.

module.exports = {
  settings: {
    siteName: 'Nordfjord Trafikk',
    tagline: '– vi KOSA oss –',
    email: 'post@nordfjordtrafikk.no',
    address: { street: 'Rådhusvegen 10', zip: '6770', city: 'Nordfjordeid' },
    orgnr: '', // Ikkje oppgitt på gamal side – fyll inn i admin
    locations: [
      { name: 'Nordfjordeid', phone: '458 12345', person: 'John Ingvald Myklebust', company: 'Nordfjord Trafikk avd. Eid' },
      { name: 'Stryn', phone: '41 50 22 52', person: 'Even Andreas Dispen', company: 'Nordfjord Trafikk avd. Stryn' },
      { name: 'Stranda/Sykkylven', phone: '40 344 344', person: 'Kontor', company: 'Storfjord Trafikk avd. Stranda/Sykkylven' }
    ],
    social: {
      facebook: 'https://www.facebook.com/nordfjordtrafikk',
      instagram: 'https://instagram.com/nordfjordtrafikk'
    },
    hours: [
      { label: 'Måndag–fredag', value: '08.00–16.00 (PLACEHOLDER – rett i admin)' }
    ],
    alert: { enabled: false, text: '', link: '' }
  },

  seo: {
    home: { title: 'Nordfjord Trafikk – Trafikkskule i Nordfjord og på Sunnmøre', description: 'Ta lappen hos Nordfjord Trafikk! Trafikkskule med avdelingar på Nordfjordeid, i Stryn og Stranda/Sykkylven. Opplæring i alle lette klassar – bil, MC, moped, snøscooter og traktor.' },
    om: { title: 'Om trafikkskulen – Nordfjord Trafikk', description: 'Nordfjord Trafikk har tilbydd trafikkopplæring sidan 2009. Møt trafikklærarane våre og les om skulebilane – Audi A3, Audi Q3, VW Golf og Tesla Model Y.' },
    opplaring: { title: 'Om trafikkopplæringa – Nordfjord Trafikk', description: 'Slik føregår trafikkopplæringa: frå trafikalt grunnkurs til oppkjøring. Les om trinn 1–4 og korleis du kjem raskast mogleg til førarprøva.' },
    prisar: { title: 'Prisar – Nordfjord Trafikk', description: 'Oversiktlege prisar på kjøretimar, trafikalt grunnkurs, sikkerhetskurs og opplæring i klasse B, BE, A1, A2, A, AM146, S og T. Ingen lokkeprisar.' },
    kurs: { title: 'Kurskalender og påmelding – Nordfjord Trafikk', description: 'Sjå kommande kurs hos Nordfjord Trafikk og meld deg på direkte: trafikalt grunnkurs, mørkekøyring, førstehjelp og meir – på Nordfjordeid, i Stryn og Stranda/Sykkylven.' },
    pamelding: { title: 'Påmelding til opplæring – Nordfjord Trafikk', description: 'Meld deg på trafikkopplæring hos Nordfjord Trafikk. Fyll ut skjemaet, så tek vi kontakt og lagar eit opplegg tilpassa deg.' },
    gavekort: { title: 'Gåvekort på trafikkopplæring – Nordfjord Trafikk', description: 'Gje vekk lappen! Bestill gåvekort på trafikkopplæring som kan brukast til alle lette førarkortklassar, trafikalt grunnkurs og mørkekøyring.' },
    kontakt: { title: 'Kontakt oss – Nordfjord Trafikk', description: 'Kontakt Nordfjord Trafikk på Nordfjordeid, i Stryn eller Stranda/Sykkylven. Ring, send e-post eller bruk kontaktskjemaet.' },
    personvern: { title: 'Personvernerklæring – Nordfjord Trafikk', description: 'Slik behandlar Nordfjord Trafikk personopplysningane dine.' }
  },

  pages: {
    home: {
      heroKicker: 'Trafikkskule i Nordfjord og på Sunnmøre',
      heroTitle: 'Det første steget til lappen',
      heroSub: 'er å ta kontakt med oss. Ring, send SMS – eller meld deg på eit kurs i dag. Vi har opplæring i alle lette klassar, og vi kosar oss på vegen!',
      uspTitle: 'Kvifor velje oss?',
      usps: [
        { icon: 'road', title: 'Erfarne lærarar', text: 'Trafikklærarar utdanna etter den norske modellen for trafikkopplæring – med deg i fokus.' },
        { icon: 'price', title: 'Ærlege prisar', text: 'Prisane vert oppdaterte med jamne mellomrom. Ingen lokkeprisar eller plutselege tilbod.' },
        { icon: 'car', title: 'Moderne skulebilar', text: 'Du øver i Audi A3, Audi Q3, VW Golf eller Tesla Model Y.' },
        { icon: 'pin', title: 'Nær deg', text: 'Avdelingar på Nordfjordeid, i Stryn og Stranda/Sykkylven – sidan 2009.' }
      ],
      statYear: '2009',
      statYearLabel: 'Trafikkskule sidan',
      statClasses: '11',
      statClassesLabel: 'Førarkortklassar',
      statTeam: '8',
      statTeamLabel: 'Tilsette',
      statLocations: '3',
      statLocationsLabel: 'Avdelingar'
    },
    om: {
      intro: 'Nordfjord Trafikk er ein trafikkskule som tilbyr opplæring i alle lette klassar. Trafikkskulen vart starta i 2009 og har avdelingar i Nordfjord, Sunnfjord og Møre.',
      cars: 'Nordfjord Trafikk brukar Audi A3, Audi Q3, VW Golf og Tesla Model Y som skulebilar.',
      teamTitle: 'Folka bak rattet'
    },
    opplaring: {
      intro: 'Vi anbefalar deg å komme i gang med kjøretimar når du er 16 år. På den måten kan vi gje deg tilbakemelding på kva det er lurt at akkurat DU øvar på når du lærekjører heime.\n\nNormalt sett er det nok med mellom 2–3 dobbeltimar i begynnelsen.\n\nEtter det lærekjører du mest mulig heime fram til du nærmar deg 17 år. Då fortsetter vi opplæringa og fordelar timane fornuftig fram til du er 18 år og klar til oppkjøring!',
      trinn: [
        { title: 'Trafikalt grunnkurs', body: 'Trafikalt grunnkurs er eit obligatorisk kurs alle må ha før dei startar med føreropplæring og privat øvingskjøring. Kurset er på totalt 17 undervisningstimar og omhandlar: trafikkopplæringa, trafikk og førarrolla, mennesket i trafikken og samhandling, trafikkopplæring, øvingskjøring og kjøreerfaring, plikter ved trafikkuhell og førstehjelp, tiltak ved trafikkulykke og trafikant i mørket.' },
        { title: 'Grunnleggande kjøretøy- og kjørekompetanse', body: 'På trinn 2 skal du bli flink til å behandle bilen på ein behagelig måte både på flat veg, i oppoverbakkar og nedoverbakkar ved riktig bruk av clutch, gass og brems. Riktig bruk av observasjonar ved igangsetting og stans, og å sjekke speil og blindsone, er òg viktig. Du skal gjennomgå sikkerhetskontroll av bilen for å få kunnskap om bilen sin virkemåte og utstyr. På slutten av trinn 2 skal det gjennomførast ei obligatorisk trinnvurdering.' },
        { title: 'Trafikal del', body: 'På trinn 3 skal du bli flink til å samhandle med andre trafikantar ved riktig bruk av tegn, fart og plassering i mange forskjellige situasjonar. Ingen situasjon er nøyaktig lik, men etterkvart lærer du å skjønne kva som kan skje og tilpasse deg – trafikksikkert og tydelig. Sikkerhetskurs på øvingsbane er obligatorisk og gjennomførast på trinn 3. På slutten av trinnet skal det gjennomførast ei obligatorisk trinnvurdering.' },
        { title: 'Avsluttande opplæring', body: 'Trinn 4 innleiast med kurs om bilkjøringas risiko, før kjøring i landevegsmiljø samt planlegging og kjøring i variert miljø. Det heile avsluttast med refleksjon og oppsummering. Du skal skrive ein logg om det du har opplevd og erfart på kjøreturane. Avsluttande opplæring gjennomførast når du er på førarprøvenivå – det vil seie at du kjører sjølvstendig.' }
      ]
    },
    prisar: {
      updated: 'pr. 01.01.2025',
      intro: 'Våre prisar vert oppdaterte med jamne mellomrom. Ingen lokkeprisar eller plutselege tilbod som gjer at du vert forskjellbehandla i forhold til andre elevar.\n\nVi garanterer ei ryddig, god og kjekk trafikkopplæring med trafikklærarar som er utdanna etter den norske modellen for trafikkopplæring.\n\nRING oss, så avtalar vi opplæring som er tilpassa nettopp DEG!',
      gebyrNote: 'Gebyr til Statens Vegvesen kjem i tillegg til våre prisar.',
      gebyrUrl: 'https://www.vegvesen.no/forerkort/ta-forerkort/gebyrer/'
    },
    kurs: {
      intro: 'Her finn du kommande kurs hos oss. Vel avdeling, klikk på kurset du vil delta på og meld deg på – du får stadfesting frå oss når påmeldinga er registrert.',
      empty: 'Ingen planlagde kurs akkurat no. Ta kontakt, så seier vi frå når neste kurs blir sett opp!'
    },
    pamelding: {
      intro: 'Om du fyller ut skjemaet og sender det inn, tar vi kontakt med deg og avtalar opplæring som er tilpassa deg!'
    },
    gavekort: {
      intro: 'Er du usikker på kva du skal gje i gåve? Vi har løysinga. Kjøp eit gåvekort på trafikkopplæring som kan brukast til opplæring i alle lette førarkortklassar, samt trafikalt grunnkurs og mørkekøyring.',
      how: 'Når vi har motteke bestillinga, sender vi gåvekortet og betalingsinformasjon til deg omgåande per e-post. Det er viktig at du brukar KID-nummeret når du betalar.'
    },
    kontakt: {
      intro: 'Lurer du på noko? Ring oss, send ein e-post eller bruk skjemaet – så svarar vi deg så fort vi kan.'
    }
  },

  // Prisliste – henta ordrett frå nordfjordtrafikk.no/prisar (pr. 01.01.2025)
  prices: [
    { id: 'grunnkurs', title: 'Trafikalt grunnkurs', items: [
      { label: 'Trafikalt grunnkurs med førstehjelp', price: 'kr 2 200,-' },
      { label: 'Trafikant i mørket (3 x 45 min)', price: 'kr 1 800,-' },
      { label: 'Førstehjelp (4 x 45 min)', price: 'kr 950,-' }
    ]},
    { id: 'klasse-b', title: 'Klasse B – Personbil', items: [
      { label: 'Kjøretime (45 min)', price: 'kr 900,-' },
      { label: 'Trinnvurdering Trinn 2 (45 min)', price: 'kr 900,-' },
      { label: 'Trinnvurdering Trinn 3 (60 min)', price: 'kr 1 200,-' },
      { label: 'Sikkerhetskurs på øvingsbane (4 x 45 min)', price: 'kr 5 500,-' },
      { label: 'Trinn 4 Sikkerhetskurs på veg (13 x 45 min):', price: '' },
      { label: '4.1.1 Bilkjøringens risiko', price: 'kr 1 050,-', indent: true },
      { label: '4.1.2 Kjøring i landevegsmiljø', price: 'kr 5 350,-', indent: true },
      { label: '4.1.3 Planlegging og kjøring i variert miljø', price: 'kr 3 900,-', indent: true },
      { label: '4.1.4 Oppsummering og refleksjon', price: 'kr 1 050,-', indent: true },
      { label: 'Leige av bil til oppkjøring', price: 'kr 2 850,-' },
      { label: 'Baneleige NAF Øvingsbane', price: 'kr 1 500,-' }
    ]},
    { id: 'klasse-be', title: 'Klasse BE / B96 – Personbil med hengar', items: [
      { label: 'Pris klasse BE', price: 'frå kr 8 000,-' },
      { label: 'Pris klasse B96', price: 'frå kr 6 000,-' },
      { label: 'Kjøretime (45 min)', price: 'kr 990,-' },
      { label: 'Trinnvurdering Trinn 2 (45 min)', price: 'kr 990,-' },
      { label: 'Trinnvurdering Trinn 3 (60 min)', price: 'kr 1 320,-' },
      { label: 'Sikkerhetskurs på veg (3 x 45 min)', price: 'kr 3 000,-' },
      { label: 'Lastsikringskurs (2 x 45 min)', price: 'kr 1 500,-' },
      { label: 'Leige av bil og hengar til oppkjøring', price: 'kr 2 900,-' }
    ]},
    { id: 'klasse-am146', title: 'Klasse AM146 – Tohjuls moped', items: [
      { label: 'Pris klasse AM146', price: 'frå kr 8 500,-' },
      { label: 'Kjøretimar utover det inkluderte (pr. 45 min)', price: 'kr 850,-' },
      { label: 'Inkluderer:', price: '' },
      { label: 'Grunnkurs klasse AM146 (3 x 45 min)', price: '', indent: true },
      { label: 'Trinn 2: Praktisk kjøring (2 x 45 min) + trinnvurdering (1 x 45 min)', price: '', indent: true },
      { label: 'Trinn 3: Praktisk kjøring (2 x 45 min), sikkerhetskurs i trafikk (4 x 45 min) + trinnvurdering (1 x 60 min)', price: '', indent: true },
      { label: 'Trinn 4: Sikkerhetskurs på veg (4 x 45 min)', price: '', indent: true }
    ]},
    { id: 'klasse-a1', title: 'Klasse A1 – Lett motorsykkel', items: [
      { label: 'Obligatorisk grunnkurs MC (3 x 45 min)', price: 'kr 1 500,-' },
      { label: 'Kjøretime (45 min)', price: 'kr 990,-' },
      { label: 'Trinnvurdering Trinn 2 (45 min)', price: 'kr 990,-' },
      { label: 'Trinnvurdering Trinn 3 (60 min)', price: 'kr 1 320,-' },
      { label: 'Sikkerhetskurs i trafikk (4 x 45 min)', price: 'kr 3 900,-' },
      { label: 'Sikkerhetskurs på veg (5 x 45 min)', price: 'kr 4 900,-' },
      { label: 'Leige av MC til oppkjøring', price: 'kr 2 900,-' }
    ]},
    { id: 'klasse-a2', title: 'Klasse A2 – Mellomtung motorsykkel', items: [
      { label: 'Obligatorisk grunnkurs MC (3 x 45 min)', price: 'kr 1 500,-' },
      { label: 'Kjøretime (45 min)', price: 'kr 990,-' },
      { label: 'Trinnvurdering Trinn 2 (45 min)', price: 'kr 990,-' },
      { label: 'Sikkerhetskurs presis kjøreteknikk (4 x 45 min)', price: 'kr 5 200,-' },
      { label: 'Trinnvurdering Trinn 3 (60 min)', price: 'kr 1 320,-' },
      { label: 'Sikkerhetskurs på veg (5 x 45 min)', price: 'kr 4 900,-' },
      { label: 'Leige av MC til oppkjøring', price: 'kr 2 900,-' },
      { label: 'Gebyr til NMK-bane presis kjøreteknikk', price: 'kr 995,-' }
    ]},
    { id: 'klasse-a', title: 'Klasse A – Tung motorsykkel', items: [
      { label: 'Obligatorisk grunnkurs MC (3 x 45 min)', price: 'kr 1 500,-' },
      { label: 'Kjøretime (45 min)', price: 'kr 990,-' },
      { label: 'Trinnvurdering Trinn 2 (45 min)', price: 'kr 990,-' },
      { label: 'Sikkerhetskurs presis kjøreteknikk (4 x 45 min)', price: 'kr 5 200,-' },
      { label: 'Trinnvurdering Trinn 3 (60 min)', price: 'kr 1 320,-' },
      { label: 'Trinn 4 Sikkerhetskurs på veg (8 x 45 min)', price: 'kr 7 900,-' },
      { label: 'Leige av MC til oppkjøring', price: 'kr 2 900,-' },
      { label: 'Gebyr til NMC-bane presis kjøreteknikk', price: 'kr 995,-' }
    ]},
    { id: 'klasse-s', title: 'Klasse S – Snøscooter', items: [
      { label: 'Obligatorisk grunnkurs klasse S', price: 'kr 1 500,-' },
      { label: 'Obligatoriske køyretimar', price: 'kr 8 300,-' },
      { label: 'Avgift øvingsområde', price: 'kr 800,-' }
    ]},
    { id: 'klasse-t', title: 'Klasse T – Traktor', items: [
      { label: 'Kjøretime (45 min)', price: 'kr 1 050,-' },
      { label: 'Trinnvurdering Trinn 2 (45 min)', price: 'kr 1 050,-' },
      { label: 'Trinnvurdering Trinn 3 (60 min)', price: 'kr 1 400,-' },
      { label: 'Lastsikringskurs (2 x 45 min)', price: 'kr 1 500,-' },
      { label: 'Leige av traktor til oppkjøring', price: 'kr 3 000,-' },
      { label: '50 km/t-kurs (7 x 45 min)', price: 'kr 7 300,-' }
    ]}
  ],

  team: [
    { name: 'John Ingvald Myklebust', role: 'Dagleg leiar, fagleg leiar og trafikklærar', classes: 'A1, A2, A, AM146, AM147, B og BE/B96', img: '/img/team-john.webp' },
    { name: 'Even Andreas Dispen', role: 'Fagleg leiar og trafikklærar', classes: 'A1, A2, A, AM146, B, BE/B96, S og T', img: '/img/team-even.webp' },
    { name: 'Bård Ove Bergset', role: 'Trafikklærar', classes: 'B og BE/B96', img: '/img/team-bard.webp' },
    { name: 'Robin Andreas Jørgensen', role: 'Trafikklærar', classes: 'A1, A2, A, AM146, AM147, B og BE/B96', img: '/img/team-robin.webp' },
    { name: 'Beate Haugrønning', role: 'Trafikklærar', classes: 'B', img: '/img/team-beate.webp' },
    { name: 'Johannes Urstad', role: 'Trafikklærar', classes: 'B', img: '/img/team-johannes.webp' },
    { name: 'Cathrine Breidablik', role: 'Trafikklærar', classes: 'B', img: '/img/team-cathrine.webp' },
    { name: 'Maiken Solås', role: 'Kontor- og vaffeldame', classes: 'Ho treff du på kontoret vårt på Nordfjordeid', img: '/img/team-maiken.webp' }
  ],

  // Klassar til skjema og tenesteoversikt
  classes: [
    { code: 'TG', label: 'Trafikalt Grunnkurs', icon: 'book' },
    { code: 'B-man', label: 'Klasse B Manuell – Personbil', icon: 'car' },
    { code: 'B-aut', label: 'Klasse B Automat – Personbil', icon: 'car' },
    { code: 'BE', label: 'Klasse BE – Personbil med tilhengar', icon: 'trailer' },
    { code: 'A1', label: 'Klasse A1 – Lett motorsykkel', icon: 'mc' },
    { code: 'A2', label: 'Klasse A2 – Mellomtung motorsykkel', icon: 'mc' },
    { code: 'A', label: 'Klasse A – Tung motorsykkel', icon: 'mc' },
    { code: 'AM146', label: 'Klasse AM146 – 2-hjulsmoped', icon: 'moped' },
    { code: 'AM147', label: 'Klasse AM147 – 3- og 4-hjulsmoped', icon: 'moped' },
    { code: 'S', label: 'Klasse S – Snøscooter', icon: 'snow' },
    { code: 'T', label: 'Klasse T – Traktor', icon: 'tractor' }
  ],

  courseTypes: ['Trafikalt grunnkurs', 'Trafikant i mørket', 'Førstehjelpskurs', 'Grunnkurs MC', 'Grunnkurs klasse S', 'Lastsikringskurs', 'Anna kurs']
};
