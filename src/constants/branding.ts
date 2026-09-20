export const BRAND = {
  appName: 'Meu Controle',
  appNamePro: 'Meu Controle Pro',
  signature: 'A.L.N SYSTEM',
  devSignature: 'Dev ⩿ A.L.N/⪀',
  version: '1.0.0',
  tagline: 'Seu controle pessoal — offline, sem planilha',
  taglinePro: 'Acesso total — offline, sem planilha',
  role: 'Controle Financeiro',
};

export function getAppDisplayName(isPremium: boolean): string {
  return isPremium ? BRAND.appNamePro : BRAND.appName;
}

export function getAppTagline(isPremium: boolean): string {
  return isPremium ? BRAND.taglinePro : BRAND.tagline;
}

export const BANNER = {
  accent: '#E07A5F',
  background: '#2C2C32',
  line1: 'A . L . N',
  line2: 'S Y S T E M',
};

export const LOGO_BANNER_WIDTH = 72;

export const LOGO_LINES = [
  ' █████╗      ██╗          ███╗   ██╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗',
  '██╔══██╗     ██║          ████╗  ██║    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║',
  '███████║     ██║          ██╔██╗ ██║    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║',
  '██╔══██║     ██║          ██║╚██╗██║    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║',
  '██║  ██║     ███████╗     ██║ ╚████║    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║',
  '╚═╝  ╚═╝ ██║ ╚══════╝ ██║ ╚═╝  ╚═══╝    ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝',
];

export const LOGO_LINES_COMPACT = [
  '╔══════════════════════════╗',
  '║      A . L . N           ║',
  '║      S Y S T E M         ║',
  '╚══════════════════════════╝',
];

/** Linhas do quadrinho com a assinatura do dev (cabeçalho). */
export function getSignatureBoxLines(): string[] {
  return [
    '╔══════════════════════════╗',
    `║  ${BRAND.devSignature}  ║`,
    '╚══════════════════════════╝',
  ];
}

export function repeatChar(char: string, count: number): string {
  return char.repeat(count);
}
