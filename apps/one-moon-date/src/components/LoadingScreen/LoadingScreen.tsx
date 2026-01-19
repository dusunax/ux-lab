import React from 'react';
import {View, Text, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../../constants/colors';
import {useI18n} from '../../i18n';
import {useDarkMode} from '../../contexts/DarkModeContext';

export const LoadingScreen = () => {
  const {darkMode: isDarkMode} = useDarkMode();
  const {t} = useI18n();

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? Colors.background.dark : Colors.background.light}
      />
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, isDarkMode && styles.textDark]}>
          {t?.loading || '불러오는 중...'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  containerDark: {
    backgroundColor: Colors.background.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  textDark: {
    color: Colors.text.primary.dark,
  },
});
