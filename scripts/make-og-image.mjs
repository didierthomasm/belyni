// Genera public/og.jpg (1200×630) para vistas previas en WhatsApp/Facebook
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

const hero = await sharp('src/assets/img/site/heroImage.png')
  .resize(HEIGHT, HEIGHT, { fit: 'cover' })
  .toBuffer();
const logo = await sharp('src/assets/img/logo-name.png').resize({ width: 460 }).toBuffer();
const { height: logoHeight = 0 } = await sharp(logo).metadata();

await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#fbeceb' } })
  .composite([
    { input: hero, left: WIDTH - HEIGHT, top: 0 },
    { input: logo, left: 70, top: Math.round((HEIGHT - logoHeight) / 2) },
  ])
  .jpeg({ quality: 82 })
  .toFile('public/og.jpg');

console.log('public/og.jpg generado');
