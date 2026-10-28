package com.onemoondate.widget;

import java.util.Calendar;

/**
 * 한국 음력 변환 클래스
 * 1900년 ~ 2100년 범위의 음력 계산을 지원
 */
public class LunarCalculator {

    // 음력 데이터 테이블 (1900-2100), 한국 표준시 기준 (중국 음력과 합삭 날짜가 다른 해가 있음)
    // 1900-2049는 한국천문연구원 데이터, 2050-2100은 KST 합삭·중기 천문 계산값
    private static final int[] LUNAR_DATA = {
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x0da95, 0x0b550, 0x056a0, 0x0ada2, 0x095d0, 0x04bb7, // 1910-1919
        0x049b0, 0x0a4b0, 0x0b4b5, 0x06a90, 0x0ad40, 0x0bb54, 0x02b60, 0x095b0, 0x05372, 0x04970, // 1920-1929
        0x06566, 0x0e4a0, 0x0ea50, 0x16a95, 0x05b50, 0x02b60, 0x18ae3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
        0x0d4a0, 0x1d8a6, 0x0b690, 0x056d0, 0x125b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0d557, // 1940-1949
        0x0b4a0, 0x0b550, 0x15555, 0x04db0, 0x025b0, 0x18573, 0x052b0, 0x0a9b8, 0x06950, 0x06aa0, // 1950-1959
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05270, 0x07263, 0x0d950, 0x06b57, 0x056a0, // 1960-1969
        0x09ad0, 0x04dd5, 0x04ae0, 0x0a4e0, 0x0d4d4, 0x0d250, 0x0d598, 0x0b540, 0x0d6a0, 0x195a6, // 1970-1979
        0x095b0, 0x049b0, 0x0a9b4, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0b756, 0x02b60, 0x095b0, // 1980-1989
        0x04b75, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06d98, 0x05ad0, 0x02b60, 0x096e5, 0x092e0, // 1990-1999
        0x0c960, 0x0e954, 0x0d4a0, 0x0da50, 0x07552, 0x056c0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
        0x0a950, 0x0b4a0, 0x1b4a3, 0x0b550, 0x055d9, 0x04ba0, 0x0a5b0, 0x05575, 0x052b0, 0x0a950, // 2010-2019
        0x0b954, 0x06aa0, 0x0ad50, 0x06b52, 0x04b60, 0x0a6e6, 0x0a570, 0x05270, 0x06a65, 0x0d930, // 2020-2029
        0x05aa0, 0x0b6a3, 0x096d0, 0x04afb, 0x04ae0, 0x0a4d0, 0x1d0d6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
        0x0b6a0, 0x096d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0b250, 0x1b255, 0x06d40, 0x0ada0, // 2040-2049
        0x18b63, 0x09570, 0x14978, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1aac4, 0x0ab60, // 2050-2059
        0x09370, 0x052e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0aad0, 0x095d4, // 2060-2069
        0x092d0, 0x0c9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
        0x0b2b3, 0x0a930, 0x07557, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054f4, 0x05260, // 2080-2089
        0x0e968, 0x0d530, 0x05aa0, 0x1aaa6, 0x096d0, 0x04ae0, 0x0aae4, 0x0a4d0, 0x0d260, 0x0f253, // 2090-2099
        0x0d520, // 2100
    };

    private static final int BASE_YEAR = 1900;
    private static final int BASE_JULIAN_DAY = toJulianDay(1900, 1, 31);

    /**
     * 양력 날짜를 율리우스 일수로 변환 (시간대와 무관하게 정확한 일 수 계산)
     */
    private static int toJulianDay(int year, int month, int day) {
        int a = (14 - month) / 12;
        int y = year + 4800 - a;
        int m = month + 12 * a - 3;
        return day + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045;
    }

    /**
     * 음력 날짜 결과 클래스
     */
    public static class LunarDate {
        public int year;
        public int month;
        public int day;
        public boolean isLeapMonth;
        public int leapMonth;

        @Override
        public String toString() {
            String monthStr = isLeapMonth ? "윤" + month : String.valueOf(month);
            return year + "년 " + monthStr + "월 " + day + "일";
        }
    }

    /**
     * 특정 연도의 윤달 월 반환
     */
    private static int getLeapMonth(int year) {
        return LUNAR_DATA[year - BASE_YEAR] & 0xf;
    }

    /**
     * 특정 연도의 윤달 일수 반환
     */
    private static int getLeapDays(int year) {
        if (getLeapMonth(year) == 0) {
            return 0;
        }
        return (LUNAR_DATA[year - BASE_YEAR] & 0x10000) != 0 ? 30 : 29;
    }

    /**
     * 특정 연도의 총 일수 반환
     */
    private static int getYearDays(int year) {
        int sum = 348; // 29일 * 12개월
        int info = LUNAR_DATA[year - BASE_YEAR];

        for (int i = 0x8000; i > 0x8; i >>= 1) {
            if ((info & i) != 0) {
                sum += 1;
            }
        }

        return sum + getLeapDays(year);
    }

    /**
     * 특정 연도, 월의 일수 반환
     * bit[4-15]가 각 월의 대소를 나타냄 (bit 15 = 1월, bit 4 = 12월)
     * JavaScript 버전과 동일한 로직 사용: 0x10000 >> month
     */
    private static int getMonthDays(int year, int month) {
        if (year < BASE_YEAR || year > 2100) {
            return 30;
        }
        int info = LUNAR_DATA[year - BASE_YEAR];
        int bitMask = 0x10000 >> month;
        return (info & bitMask) != 0 ? 30 : 29;
    }

    /**
     * 양력을 음력으로 변환
     * 율리우스 일수를 사용하여 시간대와 무관하게 정확한 계산
     */
    public static LunarDate solarToLunar(int solarYear, int solarMonth, int solarDay) {
        int targetJulianDay = toJulianDay(solarYear, solarMonth, solarDay);
        int offset = targetJulianDay - BASE_JULIAN_DAY;

        if (offset < 0) {
            android.util.Log.w("LunarCalculator", "음수 offset: " + offset + " (입력: " + solarYear + "/" + solarMonth + "/" + solarDay + ")");
            return null;
        }

        int days = offset;
        int lunarYear = BASE_YEAR;

        int yearDays;
        while (lunarYear <= 2100 && days >= (yearDays = getYearDays(lunarYear))) {
            days -= yearDays;
            lunarYear++;
        }

        int leapMonth = getLeapMonth(lunarYear);
        int lunarMonth = 1;
        int lunarDay = 1;
        boolean isLeapMonth = false;

        int monthDays;
        for (int month = 1; month <= 12; month++) {
            monthDays = getMonthDays(lunarYear, month);

            if (days < monthDays) {
                lunarMonth = month;
                lunarDay = days + 1;
                isLeapMonth = false;
                break;
            }
            days -= monthDays;

            if (month == leapMonth) {
                monthDays = getLeapDays(lunarYear);
                if (days < monthDays) {
                    lunarMonth = month;
                    lunarDay = days + 1;
                    isLeapMonth = true;
                    break;
                }
                days -= monthDays;
            }
        }

        LunarDate result = new LunarDate();
        result.year = lunarYear;
        result.month = lunarMonth;
        result.day = lunarDay;
        result.isLeapMonth = isLeapMonth;
        result.leapMonth = leapMonth;

        return result;
    }

    /**
     * 오늘의 음력 날짜 반환
     */
    public static LunarDate getTodayLunar() {
        Calendar cal = Calendar.getInstance();
        return solarToLunar(
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH) + 1,
            cal.get(Calendar.DAY_OF_MONTH)
        );
    }

    /**
     * 간지(干支) 계산
     */
    public static String getGanZhi(int year) {
        String[] heavenlyStems = {"경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"};
        String[] earthlyBranches = {"신", "유", "술", "해", "자", "축", "인", "묘", "진", "사", "오", "미"};

        int stemIndex = year % 10;
        int branchIndex = year % 12;

        return heavenlyStems[stemIndex] + earthlyBranches[branchIndex];
    }

    /**
     * 띠 계산
     */
    public static String getZodiac(int year) {
        String[] zodiacAnimals = {"원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"};
        return zodiacAnimals[year % 12];
    }
}
