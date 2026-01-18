import React from 'react';
import {I18nProvider} from './i18n';
import {DarkModeProvider} from './contexts/DarkModeContext';
import {MainScreen} from './screens/MainScreen';

/**
 * 앱의 루트 컴포넌트
 */
const App = () => {
  return (
    <DarkModeProvider>
      <I18nProvider>
        <MainScreen />
      </I18nProvider>
    </DarkModeProvider>
  );
};

export default App;
