import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {I18nProvider} from './i18n';
import {DarkModeProvider} from './contexts/DarkModeContext';
import {LunarRegionProvider} from './contexts/LunarRegionContext';
import {MainScreen} from './screens/MainScreen';
import {ErrorBoundary} from './components/ErrorBoundary';

const App = () => {
  return (
    <SafeAreaProvider>
      <DarkModeProvider>
        <I18nProvider>
          <LunarRegionProvider>
            <ErrorBoundary>
              <MainScreen />
            </ErrorBoundary>
          </LunarRegionProvider>
        </I18nProvider>
      </DarkModeProvider>
    </SafeAreaProvider>
  );
};

export default App;
