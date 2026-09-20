/** Gera payload PIX copia-e-cola (padrão EMV BACEN) para QR estático/dinâmico. */

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sanitizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 25) || 'CREDOR';
}

function sanitizeCity(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 15) || 'BRASIL';
}

export interface PixPayloadOptions {
  pixKey: string;
  merchantName: string;
  merchantCity?: string;
  /** Valor em reais — se informado, gera PIX dinâmico com valor fixo. */
  amount?: number;
  /** Identificador da cobrança (txid) — opcional, max 25 chars */
  txid?: string;
}

export function buildPixPayload(options: PixPayloadOptions): string {
  const key = options.pixKey.trim();
  if (!key) throw new Error('Chave PIX vazia');

  const name = sanitizeName(options.merchantName);
  const city = sanitizeCity(options.merchantCity ?? 'SAO PAULO');
  const hasAmount = typeof options.amount === 'number' && options.amount > 0;

  const merchantAccount = emvField(
    '26',
    emvField('00', 'br.gov.bcb.pix') + emvField('01', key)
  );

  let payload = '';
  payload += emvField('00', '01');
  payload += emvField('01', hasAmount ? '12' : '11');
  payload += merchantAccount;
  payload += emvField('52', '0000');
  payload += emvField('53', '986');

  if (hasAmount) {
    payload += emvField('54', options.amount!.toFixed(2));
  }

  payload += emvField('58', 'BR');
  payload += emvField('59', name);
  payload += emvField('60', city);

  if (options.txid?.trim()) {
    const ref = options.txid.trim().slice(0, 25);
    payload += emvField('62', emvField('05', ref));
  }

  const withCrcPlaceholder = `${payload}6304`;
  const crc = crc16ccitt(withCrcPlaceholder);
  return withCrcPlaceholder + crc;
}

export function isValidPixKey(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  if (k.includes('@')) return k.length >= 5;
  const digits = k.replace(/\D/g, '');
  if (digits.length === 11 || digits.length === 14) return true;
  if (k.startsWith('+') && digits.length >= 10) return true;
  // UUID / chave aleatória
  return k.length >= 8;
}
