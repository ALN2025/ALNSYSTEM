import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const pairs = [
  ['assets/icon.png', 'assets/aln-pc.ico'],
  ['assets/android-icon-foreground.png', 'assets/aln-apk.ico'],
];

for (const [src, dest] of pairs) {
  const input = path.join(root, src);
  const output = path.join(root, dest);
  if (!fs.existsSync(input)) {
    console.warn('Skip (missing):', src);
    continue;
  }
  const buf = await pngToIco(input);
  fs.writeFileSync(output, buf);
  console.log('OK:', dest, `(${buf.length} bytes)`);
}
