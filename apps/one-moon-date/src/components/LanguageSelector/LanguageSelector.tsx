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
import {useLunarRegion} from '../../contexts/LunarRegionContext';
import {getLunarRegionLabelKey} from '../../i18n/translations';
import type {Language, LunarRegion} from '../../types';

const LANGUAGE_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

export const LanguageSelector = () => {
  const [visible, setVisible] = useState(false);
  const {darkMode: isDarkMode} = useDarkMode();
  const {language, changeLanguage, availableLanguages, t} = useI18n();
  const {region, changeRegion, availableRegions} = useLunarRegion();
  const close = () => setVisible(false);

  const handleLanguageChange = (lang: Language) => {
    try {
      close();
      changeLanguage(lang).catch((error) => {
        console.error('언어 변경 중 오류 발생:', error);
      });
    } catch (error) {
      console.error('언어 변경 중 오류 발생:', error);
      close();
    }
  };

  const getLanguageLabel = (lang: Language): string => {
    return LANGUAGE_LABELS[lang] || lang.toUpperCase();
  };

  const handleRegionChange = (newRegion: LunarRegion) => {
    close();
    changeRegion(newRegion);
  };

  const getRegionLabel = (r: LunarRegion): string => {
    return t?.[getLunarRegionLabelKey(r)] || r.toUpperCase();
  };

  const renderOption = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
    isLast: boolean,
  ) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.modalItem,
        isDarkMode && styles.modalItemDark,
        isLast && styles.modalItemLast,
        selected && styles.modalItemActive,
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      accessibilityLabel={label}>
      <Text
        style={[
          styles.modalItemText,
          isDarkMode && styles.textDark,
          selected && styles.modalItemTextActive,
        ]}>
        {label}
      </Text>
      {selected && <Text style={styles.modalCheckmark}>✓</Text>}
    </TouchableOpacity>
  );

  // 언어와 음력 기준은 성격이 다른 설정이라 아이콘 붙은 제목과 별도 카드로 나눈다
  const renderSection = (icon: string, title: string | undefined, options: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon} accessible={false}>{icon}</Text>
        <Text
          style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}
          accessibilityRole="header">
          {title}
        </Text>
      </View>
      <View
        style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}
        accessibilityRole="radiogroup"
        accessibilityLabel={title}>
        {options}
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.langIconButton}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t?.languageSelectorLabel}>
        <Text style={[styles.langIconText, isDarkMode && styles.langIconTextDark]}>
          🌐
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}>
        {/* 오버레이는 바깥 탭으로 닫기만 담당한다. 접근성 트리에서 빼야 VoiceOver가 항목을 하나씩 읽는다 */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={close}
          accessible={false}>
          <View
            style={[styles.modalContent, isDarkMode && styles.modalContentDark]}
            accessibilityViewIsModal
            onStartShouldSetResponder={() => true}>
            {renderSection(
              '🌐',
              t?.languageSection,
              availableLanguages.map((lang, i) =>
                renderOption(
                  lang,
                  getLanguageLabel(lang),
                  language === lang,
                  () => handleLanguageChange(lang),
                  i === availableLanguages.length - 1,
                ),
              ),
            )}
            {renderSection(
              '🌙',
              t?.lunarRegionSection,
              availableRegions.map((r, i) =>
                renderOption(
                  r,
                  getRegionLabel(r),
                  region === r,
                  () => handleRegionChange(r),
                  i === availableRegions.length - 1,
                ),
              ),
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={t?.close}>
              <Text style={styles.closeButtonText}>{t?.close}</Text>
            </TouchableOpacity>
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
    width: 300,
    backgroundColor: '#E4E4EA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadow.color,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  // 다크 모드에서는 어두워진 뒤 화면과 팝업이 묻히지 않도록 배경을 한 단계 밝히고 테두리를 둔다
  modalContentDark: {
    backgroundColor: '#242427',
    borderWidth: 1,
    borderColor: '#4A4A50',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3C3C43',
  },
  sectionTitleDark: {
    color: Colors.text.light,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D1D8',
    overflow: 'hidden',
  },
  sectionCardDark: {
    backgroundColor: '#333338',
    borderColor: '#4A4A50',
  },
  closeButton: {
    paddingTop: 2,
    paddingBottom: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent.blue,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemDark: {
    borderBottomColor: '#46464C',
  },
  modalItemLast: {
    borderBottomWidth: 0,
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
