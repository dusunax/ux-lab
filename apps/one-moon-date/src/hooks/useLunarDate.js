import {useState, useEffect, useCallback} from 'react';
import {getTodayLunar} from '../utils/lunarCalendar';
import {useI18n} from '../i18n';

/**
 * 음력 날짜를 관리하는 커스텀 훅
 * @returns {Object} 음력 날짜 상태 및 업데이트 함수
 */
export const useLunarDate = () => {
  const [lunar, setLunar] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const {getGanZhi} = useI18n();

  /**
   * 음력 날짜 정보를 업데이트합니다
   */
  const updateLunarDate = useCallback(() => {
    const today = new Date();
    const lunarDate = getTodayLunar();
    const ganZhi = getGanZhi(lunarDate.year);

    setLunar({
      ...lunarDate,
      ...ganZhi,
      solarDate: today,
    });
  }, [getGanZhi]);

  /**
   * Pull-to-refresh 핸들러
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    updateLunarDate();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, [updateLunarDate]);

  /**
   * 컴포넌트 마운트 시 및 자정에 날짜 업데이트
   */
  useEffect(() => {
    updateLunarDate();

    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
    );
    const msUntilMidnight = midnight - now;

    const timer = setTimeout(() => {
      updateLunarDate();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [updateLunarDate]);

  return {
    lunar,
    refreshing,
    onRefresh,
  };
};
