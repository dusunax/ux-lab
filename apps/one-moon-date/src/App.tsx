import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {I18nProvider} from './i18n';
import {DarkModeProvider} from './contexts/DarkModeContext';
import {MainScreen} from './screens/MainScreen';

const App = () => {
  return (
    <SafeAreaProvider>
      <DarkModeProvider>
        <I18nProvider>
          <MainScreen />
        </I18nProvider>
      </DarkModeProvider>
    </SafeAreaProvider>
  );
};

export default App;
