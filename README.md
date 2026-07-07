# Nordfjord Trafikk – nettside

Moderne, rask og universelt utforma nettside for Nordfjord Trafikk (trafikkskule med
avdelingar på Nordfjordeid, i Stryn og Stranda/Sykkylven) – med innebygd admin/CMS og
eit komplett verktøy for kurspåmelding.

## Teknologi

| Del | Val | Kvifor |
|---|---|---|
| Server | Node.js 22 + Express 4 | Lett, stabilt, køyrer fint på Render gratisplan |
| Malar | EJS (server-rendert) | Rask første lasting, perfekt for SEO |
| Database | PostgreSQL (Render) / SQLite lokalt | Varig lagring i drift, null oppsett lokalt |
| Frontend | Rein CSS + vanilla JS | Ingen rammeverk = små filer og gode Core Web Vitals |
| Bilete | sharp | Automatisk komprimering/skalering av opplasta bilete |

## Køyr lokalt

```bash
npm install
npm start          # http://localhost:3000
```

Utan `DATABASE_URL` blir data lagra i `data/site.db` (SQLite).

## Admin

- URL: `/admin`
- Brukarnamn: `admin`
- Passord: verdien av miljøvariabelen `ADMIN_PASSWORD`
  (lokalt utan miljøvariabel: `kosa-oss-2026` – **byt passord i admin → Innstillingar**)

I admin kan ein redigere alt innhald utan kode: tekstar, SEO-felt, prisar, tilsette,
bilete, kontaktinfo, opningstider, sosiale lenker og varsellinja som kan visast øvst
på alle sider (med valfri lenke). Kursverktøyet lèt ein opprette kurs med dato,
avdeling, pris og kapasitet – påmeldingane kjem inn i sanntid med status­handtering
og CSV-eksport. Skjema frå «Påmelding til opplæring», kontaktskjema og
gåvekort-bestillingar hamnar i eigne innboksar.

## Miljøvariablar

| Variabel | Påkravd | Forklaring |
|---|---|---|
| `DATABASE_URL` | I drift | PostgreSQL-tilkopling (Render set denne via render.yaml) |
| `SESSION_SECRET` | I drift | Signeringsnøkkel for innloggingsøkter |
| `ADMIN_PASSWORD` | Tilrådd | Startpassord for admin-brukaren (berre brukt ved første oppstart) |
| `PUBLIC_URL` | Tilrådd | Absolutt adresse til sida (canonical/og:image/sitemap) |
| `SMTP_HOST/PORT/USER/PASS` + `MAIL_TO` | Valfri | Aktiverer e-postvarsling og stadfestings-e-post |

## E-post

Alle innsendingar blir alltid lagra i admin-innboksane (dette er primærkanalen).
Om SMTP-variablane er sette, sender sida i tillegg varsel til skulen (`MAIL_TO`)
og stadfesting til den som melder seg på kurs.

## Deploy til Render

1. Push til GitHub.
2. Render-dashbordet → **New → Blueprint** → vel repoet. `render.yaml` opprettar
   webtenesta + gratis PostgreSQL og koplar dei saman.
3. Ferdig. Sida ligg på `https://nordfjordtrafikk.onrender.com`.

### Grenser på gratisplanen (viktig)

- **Dvale:** tenesta søv etter 15 min utan trafikk; første besøk etterpå tek ~30–60 s.
- **Databasen (free) blir sletta etter 30 dagar** om ein ikkje oppgraderer.
  Difor: last ned **sikkerheitskopi** i admin → Innstillingar med jamne mellomrom.
  Gjenoppretting tek sekund. (Utan database i det heile er fillagringa flyktig –
  alt admin-innhald vil då nullstillast ved omstart.)
- Opplasta bilete ligg i databasen og følgjer same regel. Standardbileta i
  `public/img/` ligg i repoet og overlever alltid.

## Struktur

```
server.js            – oppstart, tryggleik, sesjonar
src/db.js            – lagringslag (PostgreSQL/SQLite bak same API)
src/seed-content.js  – alt startinnhald (frå gamle nettsida)
src/routes/public.js – offentlege sider + skjema-API + sitemap/robots
src/routes/admin.js  – innlogging + admin-API (kurs, innboksar, innhald, bilete)
src/mail.js          – valfri SMTP-varsling
views/               – EJS-malar (public + admin)
public/              – CSS, JS, bilete, font
tools/               – eingongs-skript for biletoptimalisering
```
