import { useWindowDimensions, Platform } from 'react-native';

export const Breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < Breakpoints.md;
  const isTablet = width >= Breakpoints.md && width < Breakpoints.lg;
  const isDesktop = width >= Breakpoints.lg;
  const isWide = width >= Breakpoints.xl;

  const statColumns = isMobile ? 2 : isTablet ? 2 : 4;
  const statMinWidth = isMobile ? '47%' : isTablet ? '47%' : '22%';
  const contentMaxWidth = isWide ? 1280 : isDesktop ? 1080 : undefined;
  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32;
  const sidebarWidth = isTablet ? 200 : 260;

  const heroFontSize = isMobile ? 28 : isTablet ? 34 : 40;
  const titleFontSize = isMobile ? 22 : isTablet ? 26 : 32;
  const sectionGap = isMobile ? 12 : 16;

  const showFab = !isDesktop || Platform.OS !== 'web';
  const isCompact = width < Breakpoints.sm;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isCompact,
    statColumns,
    statMinWidth,
    contentMaxWidth,
    horizontalPadding,
    sidebarWidth,
    heroFontSize,
    titleFontSize,
    sectionGap,
    showFab,
  };
}
