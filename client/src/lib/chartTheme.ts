import { useTheme } from '@/context/ThemeContext';

/** Recharts colours for the current theme (SVG attributes can't use CSS variables). */
export function useChartColors() {
  const dark = useTheme().resolved === 'dark';
  return {
    grid: dark ? '#2E2E33' : '#E4E4E7',
    tick: dark ? '#A1A1AA' : '#71717A',
    ink: dark ? '#E4E4E7' : '#18181B',
    muted: dark ? '#52525B' : '#D4D4D8',
    tooltip: {
      borderRadius: 8,
      border: `1px solid ${dark ? '#3F3F46' : '#E4E4E7'}`,
      fontSize: 12,
      background: dark ? '#18181B' : '#FFFFFF',
      color: dark ? '#F4F4F5' : '#18181B',
    },
  };
}
