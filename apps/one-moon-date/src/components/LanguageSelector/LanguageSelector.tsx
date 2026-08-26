import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import {Colors} from '../../constants/colors';
import {useI18n} from '../../i18n';
import {useDarkMode} from '../../contexts/DarkModeContext';
import type {Language} from '../../types';

const LANGUAGE_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

export const LanguageSelector = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const {darkMode: isDarkMode} = useDarkMode();
  const {language, changeLanguage, availableLanguages, t} = useI18n();

  const handleLanguageChange = (lang: Language) => {
    try {
      setModalVisible(false);
      changeLanguage(lang).catch((error) => {
        console.error('언어 변경 중 오류 발생:', error);
      });
    } catch (error) {
      console.error('언어 변경 중 오류 발생:', error);
      setModalVisible(false);
    }
  };

  const getLanguageLabel = (lang: Language): string => {
    return LANGUAGE_LABELS[lang] || lang.toUpperCase();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.langIconButton}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t?.languageSelectorLabel}>
        <Text style={[styles.langIconText, isDarkMode && styles.langIconTextDark]}>
          🌐
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.modalItem,
                  language === lang && styles.modalItemActive,
                ]}
                onPress={() => handleLanguageChange(lang)}
                accessibilityRole="button"
                accessibilityState={{selected: language === lang}}
                accessibilityLabel={getLanguageLabel(lang)}>
                <Text
                  style={[
                    styles.modalItemText,
                    isDarkMode && styles.textDark,
                    language === lang && styles.modalItemTextActive,
                  ]}>
                  {getLanguageLabel(lang)}
                </Text>
                {language === lang && (
                  <Text style={styles.modalCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  langIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langIconText: {
    fontSize: 24,
  },
  langIconTextDark: {
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 280,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow.color,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContentDark: {
    backgroundColor: Colors.card.dark,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary.light,
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemActive: {
    backgroundColor: Colors.accent.blue + '10',
  },
  modalItemText: {
    fontSize: 18,
    color: Colors.text.primary.light,
  },
  modalItemTextActive: {
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  modalCheckmark: {
    fontSize: 18,
    color: Colors.accent.blue,
    fontWeight: 'bold',
  },
  textDark: {
    color: Colors.text.primary.dark,
  },
});
