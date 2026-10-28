import {NativeModules, Platform} from 'react-native';
import type {LunarRegion} from '../types';

// 중국 음력(UTC+8)을 기본으로 쓰는 지역. LunarWidgetProvider의 판정과 같게 유지한다
const CN_LUNAR_COUNTRIES = ['CN', 'TW', 'HK', 'MO'];

export const getDeviceLocale = (): string => {
  if (Platform.OS === 'ios') {
    return NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      'ko';
  }
  return NativeModules.I18nManager?.localeIdentifier || 'ko';
};

// "zh_CN", "zh-Hant-TW", "zh_TW_#Hant" 형태에서 두 글자 국가 코드를 찾는다
export const getDeviceLunarRegion = (): LunarRegion => {
  const country = getDeviceLocale()
    .split(/[-_]/)
    .find((part) => /^[A-Z]{2}$/.test(part));
  return country && CN_LUNAR_COUNTRIES.includes(country) ? 'cn' : 'kr';
};
