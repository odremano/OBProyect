import { useTheme } from '../context/ThemeContext';

export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};

import { defaultColors } from '../context/ThemeContext';
export default defaultColors;

