import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useDarkMode} from '../../contexts/DarkModeContext';

export const DarkModeToggle = () => {
  const {darkMode, toggleDarkMode} = useDarkMode();
  const isDarkMode = darkMode;

  return (
    <TouchableOpacity
      style={styles.iconButton}
      onPress={toggleDarkMode}>
      <Text style={[styles.iconText, isDarkMode && styles.iconTextDark]}>
        {isDarkMode ? '🌙' : '☀️'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  iconTextDark: {
    opacity: 0.9,
  },
});
