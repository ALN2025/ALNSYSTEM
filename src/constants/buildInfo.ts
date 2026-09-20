/** Atualizado automaticamente pelo COMPILAR-APK.bat */
export const BUILD_INFO = {
  builtAt: '2026-09-20 17:33:46',
  builtAtPtBr: '20/09/2026 17:33',
  label: 'Release local APK',
} as const;

/** Data/hora da compilacao em portugues (ex.: 12/09/2026 17:48). */
export function getBuildDateLabel(): string {
  return BUILD_INFO.builtAtPtBr || BUILD_INFO.builtAt;
}
