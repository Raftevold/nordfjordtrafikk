// Konverterer originalbilete frå assets_original/ til optimaliserte web-versjonar i public/img/
// Køyrast éin gong lokalt: npm run optimize-images
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const SRC = 'assets_original';
const OUT = 'public/img';
mkdirSync(OUT, { recursive: true });

const jobs = [
  // [kjeldefil, ut-namn, maks-breidde, format]
  ['33fcdf_2cd1c6e5ef4645a794971eaf3dce065c~mv2.jpg', 'skulebil-foto.webp', 1600, 'webp'],
  ['33fcdf_cadf11d5357c4f04b1bccff01c7443bc~mv2.png', 'skulebil-sedan.webp', 1200, 'webp'],
  ['33fcdf_6eda551df08b4a10b75873956b567132~mv2.png', 'gavekort-banner.webp', 1200, 'webp'],
  ['33fcdf_29bee2abb2ea489fab797433d02e488d~mv2.png', 'logo-nordfjord.png', 500, 'png'],
  ['33fcdf_8638d0bd1bb7436ca9cc78936832846a~mv2.png', 'logo-storfjord.png', 500, 'png'],
  ['33fcdf_a8eaae2aee7c4bb29e6eb10b46e82c0b~mv2.png', 'logo-trafikkskulen.png', 900, 'png'],
  ['33fcdf_0db019634d684fddb193bf039428f04a~mv2.png', 'team-john.webp', 520, 'webp'],
  ['33fcdf_fb0913b2e2b9479c85a83f4c8d92e981~mv2.png', 'team-even.webp', 520, 'webp'],
  ['33fcdf_cf323127f20e454381c7c7e94dda6ba8~mv2.png', 'team-bard.webp', 520, 'webp'],
  ['33fcdf_c92901424b04471e9c66fe8e4f4456a2~mv2.png', 'team-robin.webp', 520, 'webp'],
  ['33fcdf_3a26ab7e5e3b40249e008d5ada1d3e41~mv2.png', 'team-beate.webp', 520, 'webp'],
  ['33fcdf_2e330c0e182b42298bfe2233479837ca~mv2.png', 'team-johannes.webp', 520, 'webp'],
  ['33fcdf_a7cf5f436b5c4005918f5f0c48323e9c~mv2.png', 'team-cathrine.webp', 520, 'webp'],
  ['33fcdf_d35a848e117f44d8a63db5ffcd1e602a~mv2.png', 'team-maiken.webp', 520, 'webp'],
];

for (const [src, out, width, fmt] of jobs) {
  const img = sharp(path.join(SRC, src)).resize({ width, withoutEnlargement: true });
  const dest = path.join(OUT, out);
  if (fmt === 'webp') await img.webp({ quality: 82 }).toFile(dest);
  else await img.png({ compressionLevel: 9, palette: false }).toFile(dest);
  console.log('ok', out);
}
console.log('Ferdig.');
