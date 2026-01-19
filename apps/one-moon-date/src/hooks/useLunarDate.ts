import {useState, useEffect, useCallback} from 'react';
import {getTodayLunar} from '../utils/lunarCalendar';
import {useI18n} from '../i18n';
import type {LunarDate} from '../types';

interface UseLunarDateReturn {
  lunar: LunarDate | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export const useLunarDate = (): UseLunarDateReturn => {
  const [lunar, setLunar] = useState<LunarDate | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const {getGanZhi} = useI18n();

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    updateLunarDate();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, [updateLunarDate]);

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
    const msUntilMidnight = midnight.getTime() - now.getTime();

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
