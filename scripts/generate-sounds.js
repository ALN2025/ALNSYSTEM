/**
 * Gera sons curtos (.wav) para abrir, fechar e alerta de atraso.
 * Rode: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });

function writeWav(filePath, segments) {
  const sampleRate = 22050;
  const samples = [];

  for (const seg of segments) {
    const { freq, ms, volume = 0.35 } = seg;
    const count = Math.floor((sampleRate * ms) / 1000);
    for (let i = 0; i < count; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, i / 200, (count - i) / 200);
      samples.push(Math.sin(2 * Math.PI * freq * t) * volume * env);
    }
  }

  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((s, i) => {
    const clamped = Math.max(-1, Math.min(1, s));
    buffer.writeInt16LE(Math.floor(clamped * 32767), 44 + i * 2);
  });

  fs.writeFileSync(filePath, buffer);
}

writeWav(path.join(outDir, 'app-open.wav'), [
  { freq: 523, ms: 90, volume: 0.4 },
  { freq: 784, ms: 140, volume: 0.45 },
]);

writeWav(path.join(outDir, 'app-close.wav'), [
  { freq: 440, ms: 100, volume: 0.35 },
  { freq: 330, ms: 160, volume: 0.3 },
]);

writeWav(path.join(outDir, 'overdue_alert.wav'), [
  { freq: 880, ms: 120, volume: 0.5 },
  { freq: 0, ms: 60, volume: 0 },
  { freq: 988, ms: 180, volume: 0.55 },
]);

console.log('Sons gerados em assets/sounds/');
