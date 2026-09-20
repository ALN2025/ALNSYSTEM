/** Publicada via GitHub Pages (pasta docs/ neste repositório). */
export const PRIVACY_POLICY_URL = 'https://aln2025.github.io/ALNSYSTEM/privacidade/';

export const SUPPORT_EMAIL = 'suporte@alnsystem.com.br';

/** ID do app na Play Store (package Android). */
export const PLAY_STORE_PACKAGE = 'com.meucontrole';

/** Produto in-app (criar na Play Console → Monetização). */
export const PLAY_PRO_PRODUCT_ID = 'meu_controle_pro';

export function getPlayStoreUrl(): string {
  return `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;
}
