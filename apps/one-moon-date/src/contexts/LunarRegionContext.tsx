import React, {createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode} from 'react';
import {saveLunarRegion, loadLunarRegion} from '../utils/storage';
import {getDeviceLunarRegion} from '../utils/deviceLocale';
import type {LunarRegion, LunarRegionContextValue} from '../types';

const AVAILABLE_REGIONS: LunarRegion[] = ['kr', 'cn'];

const LunarRegionContext = createContext<LunarRegionContextValue | undefined>(undefined);

interface LunarRegionProviderProps {
  children: ReactNode;
}

export const LunarRegionProvider = ({children}: LunarRegionProviderProps) => {
  // 직접 고르기 전까지는 기기 지역을 따른다 (위젯도 같은 규칙으로 판정)
  const [region, setRegion] = useState<LunarRegion>(getDeviceLunarRegion);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLunarRegion()
      .then((savedRegion) => {
        if (savedRegion) {
          setRegion(savedRegion);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const changeRegion = useCallback(async (newRegion: LunarRegion) => {
    const previousRegion = region;
    setRegion(newRegion);
    // 저장에 실패하면 재시작 후 값이 되돌아가므로 화면도 이전 기준으로 맞춘다
    if (!(await saveLunarRegion(newRegion))) {
      setRegion(previousRegion);
    }
  }, [region]);

  const value = useMemo<LunarRegionContextValue>(() => ({
    region,
    changeRegion,
    availableRegions: AVAILABLE_REGIONS,
    isLoading,
  }), [region, changeRegion, isLoading]);

  return (
    <LunarRegionContext.Provider value={value}>
      {children}
    </LunarRegionContext.Provider>
  );
};

export const useLunarRegion = (): LunarRegionContextValue => {
  const context = useContext(LunarRegionContext);
  if (!context) {
    throw new Error('useLunarRegion must be used within LunarRegionProvider');
  }
  return context;
};
