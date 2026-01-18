import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Modal, FlatList, StyleSheet} from 'react-native';
import {Colors} from '../../constants/colors';

/**
 * 선택 피커 컴포넌트
 * @param {any} value - 현재 선택된 값
 * @param {any[]} options - 선택 가능한 옵션 배열
 * @param {Function} onSelect - 선택 시 호출되는 콜백 함수
 * @param {string} label - 라벨 텍스트
 * @param {boolean} isDarkMode - 다크 모드 여부
 */
export const PickerSelect = ({value, options, onSelect, label, isDarkMode}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    setModalVisible(false);
  };

  const initialScrollIndex = Math.max(0, options.indexOf(value) - 3);

  return (
    <View style={styles.pickerWrapper}>
      <Text style={[styles.pickerLabel, isDarkMode && styles.textMuted]}>
        {label}
      </Text>
      <TouchableOpacity
        style={[styles.pickerButton, isDarkMode && styles.pickerButtonDark]}
        onPress={() => setModalVisible(true)}>
        <Text style={[styles.pickerButtonText, isDarkMode && styles.textDark]}>
          {value}
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
            <FlatList
              data={options}
              keyExtractor={(item) => item.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item === value && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}>
                  <Text
                    style={[
                      styles.modalItemText,
                      isDarkMode && styles.textDark,
                      item === value && styles.modalItemTextSelected,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              initialScrollIndex={initialScrollIndex}
              getItemLayout={(_, index) => ({length: 56, offset: 56 * index, index})}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerButton: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  pickerButtonDark: {
    backgroundColor: '#1A1A1A',
    borderColor: '#404040',
  },
  pickerButtonText: {
    fontSize: 24,
    color: Colors.text.primary.light,
    fontWeight: '500',
  },
  textDark: {
    color: Colors.text.primary.dark,
  },
  textMuted: {
    color: Colors.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 240,
    maxHeight: 400,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: '#2D2D2D',
  },
  modalItem: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalItemSelected: {
    backgroundColor: Colors.accent.blue + '20',
  },
  modalItemText: {
    fontSize: 24,
    color: Colors.text.primary.light,
  },
  modalItemTextSelected: {
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});
