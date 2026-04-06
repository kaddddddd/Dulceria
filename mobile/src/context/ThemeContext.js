import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ C: isDark ? darkColors : lightColors, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
