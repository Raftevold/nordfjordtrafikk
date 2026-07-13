# Bytteplan: nordfjordtrafikk.no → ny nettside

Kartlagt 13.07.2026 via offentlege DNS-/Norid-oppslag. Alt her er verifisert fakta.

## Dagens oppsett (kartlagt)

| Kva | Verdi | Kjelde |
|---|---|---|
| Registrar (.no) | **Domeneshop AS** (reg42-NORID) | Norid RDAP |
| Domene registrert | 05.11.2016 | Norid RDAP |
| Namnetenarar (DNS) | ns8.wixdns.net / ns9.wixdns.net (**Wix styrer DNS**) | NS-oppslag |
| Web (apex) | A → 185.230.63.107/.171/.186 (Wix) | A-oppslag |
| Web (www) | CNAME → cdn1.wixdns.net (Wix) | CNAME-oppslag |
| **E-post** | MX → mx.domeneshop.no (+ mx01–mx04) → **Domeneshop-epost** | MX-oppslag |
| SPF | `v=spf1 include:_spf.domeneshop.no ~all` | TXT-oppslag |
| DKIM | RSA-nøkkel publisert (Domeneshop) | TXT-oppslag |
| DMARC | **Manglar** (forbetringspunkt) | _dmarc-oppslag |
| Andre underdomene | Ingen i bruk (mail/webmail/smtp osb. finst ikkje) | oppslag |

## Kva dette betyr (dei gode nyheitene)

1. **Ingen domeneoverføring trengst** – domenet ligg alt hos Domeneshop.
2. **E-posten (post@nordfjordtrafikk.no) er hos Domeneshop, ikkje Wix** – han blir
   ikkje rørt av nettsidebytet så lenge MX/SPF/DKIM-postane blir vidareførte.
3. Det einaste som må endrast er **namnetenarane** (frå Wix til Domeneshop sine)
   og web-postane (peike til Render). Alt skjer i Domeneshop-panelet.

## Kva vi treng frå Nordfjord Trafikk

- **Tilgang til Domeneshop-kontoen** der domenet ligg (innlogging, eller at dei
  gjer endringane sjølve etter denne oppskrifta). Spør: *«Kven administrerer
  Domeneshop-kontoen for nordfjordtrafikk.no?»*
- Alternativ ved kontobyte: Domeneshop har eige skjema for å flytte domene til
  ein annan Domeneshop-konto (krev samtykke frå noverande kontohaldar).
  Tilråding: la Nordfjord Trafikk stå som eigar (holder) uansett.
- **Wix-kontoen**: berre for å seie opp abonnementet ETTER at alt er flytta.

## Byte-dag, steg for steg (~30 min arbeid + DNS-venting)

1. **Render**: kople på betalt PostgreSQL (~7 $/mnd) og legg inn `DATABASE_URL`
   (sjå README-sjekklista). Gjer dette FØRST så innhald ikkje går tapt.
2. **Render**: Settings → Custom Domains → legg til `nordfjordtrafikk.no` og
   `www.nordfjordtrafikk.no`. Render viser då kva A-/CNAME-verdiar som skal brukast
   og ordnar HTTPS-sertifikat automatisk.
3. **Domeneshop-panelet**: byt namnetenarar frå ns8/ns9.wixdns.net til Domeneshop
   sine eigne (standard: ns1.hyp.net / ns2.hyp.net / ns3.hyp.net). E-postpostane
   (MX/SPF/DKIM) for Domeneshop-epost blir normalt sette automatisk når ein brukar
   deira DNS – **verifiser at MX framleis peikar på mx.domeneshop.no**.
4. **Domeneshop DNS**: legg inn web-postane frå steg 2:
   - `www` → CNAME → `nordfjordtrafikk.onrender.com`
   - apex (`@`) → A → IP-en Render oppgjev
5. **Render**: sett miljøvariabelen `PUBLIC_URL=https://www.nordfjordtrafikk.no`
   (påverkar canonical/og:image/sitemap) og deploy på nytt.
6. **Vent på DNS** (minuttar til nokre timar). Verifiser:
   - [ ] https://www.nordfjordtrafikk.no viser nye sida med gyldig sertifikat
   - [ ] Send og ta imot e-post til post@nordfjordtrafikk.no (skal vere upåverka)
   - [ ] Kontaktskjema/kurspåmelding kjem inn i admin
7. **Etterpå**: sei opp Wix-abonnementet (IKKJE før alt over er verifisert).
8. **Bonus same dag**: legg til DMARC-post i Domeneshop DNS
   (`_dmarc` TXT `v=DMARC1; p=none; rua=mailto:post@nordfjordtrafikk.no`)
   – betre leveringsevne og innsyn, heilt ufarleg start-policy.

## Attende-plan (om noko går gale)

Byt namnetenarane tilbake til ns8/ns9.wixdns.net i Domeneshop-panelet – gamle
Wix-sida og alle DNS-postar der ligg urørte til abonnementet blir sagt opp.
