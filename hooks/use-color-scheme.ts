import { useAppTheme } from '@/contexts/theme-context';

export const useColorScheme = () => {
  const { theme } = useAppTheme();
  return theme;
};
