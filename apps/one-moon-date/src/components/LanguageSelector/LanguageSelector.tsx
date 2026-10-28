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
import type {Language} from '../../types';

const LANGUAGE_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

interface Option {
  key: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

interface OptionRowProps extends Omit<Option, 'key'> {
  isLast: boolean;
  isDarkMode: boolean;
}

const OptionRow = ({label, selected, onPress, isLast, isDarkMode}: OptionRowProps) => (
  <TouchableOpacity
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

interface SettingsSectionProps {
  icon: string;
  title?: string;
  options: Option[];
  isDarkMode: boolean;
}

const SettingsSection = ({icon, title, options, isDarkMode}: SettingsSectionProps) => (
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
      {options.map(({key, ...option}, i) => (
        <OptionRow key={key} {...option} isLast={i === options.length - 1} isDarkMode={isDarkMode} />
      ))}
    </View>
  </View>
);

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  closeLabel?: string;
  isDarkMode: boolean;
  children: React.ReactNode;
}

const SettingsModal = ({visible, onClose, closeLabel, isDarkMode, children}: SettingsModalProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    {/* 오버레이는 바깥 탭으로 닫기만 담당한다. 접근성 트리에서 빼야 VoiceOver가 항목을 하나씩 읽는다 */}
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
      accessible={false}>
      <View
        style={[styles.modalContent, isDarkMode && styles.modalContentDark]}
        accessibilityViewIsModal
        onStartShouldSetResponder={() => true}>
        {children}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}>
          <Text style={styles.closeButtonText}>{closeLabel}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

export const LanguageSelector = () => {
  const [visible, setVisible] = useState(false);
  const {darkMode: isDarkMode} = useDarkMode();
  const {language, changeLanguage, availableLanguages, t} = useI18n();
  const {region, changeRegion, availableRegions} = useLunarRegion();
  const close = () => setVisible(false);

  const languageOptions: Option[] = availableLanguages.map((lang) => ({
    key: lang,
    label: LANGUAGE_LABELS[lang] || lang.toUpperCase(),
    selected: language === lang,
    onPress: () => {
      close();
      changeLanguage(lang).catch((error) => {
        console.error('언어 변경 중 오류 발생:', error);
      });
    },
  }));

  const regionOptions: Option[] = availableRegions.map((r) => ({
    key: r,
    label: t?.[getLunarRegionLabelKey(r)] || r.toUpperCase(),
    selected: region === r,
    onPress: () => {
      close();
      changeRegion(r);
    },
  }));

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

      <SettingsModal visible={visible} onClose={close} closeLabel={t?.close} isDarkMode={isDarkMode}>
        <SettingsSection icon="🌐" title={t?.languageSection} options={languageOptions} isDarkMode={isDarkMode} />
        <SettingsSection icon="🌙" title={t?.lunarRegionSection} options={regionOptions} isDarkMode={isDarkMode} />
      </SettingsModal>
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
