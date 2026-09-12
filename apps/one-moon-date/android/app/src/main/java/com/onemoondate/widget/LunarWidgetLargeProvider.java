package com.onemoondate.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.widget.RemoteViews;

import com.onemoondate.R;

import java.util.Calendar;

/**
 * 음력 위젯 프로바이더 (2x2 대형)
 * 홈 화면에 오늘의 음력 날짜를 크게 표시하는 위젯
 */
public class LunarWidgetLargeProvider extends AppWidgetProvider {

    private static final String ACTION_UPDATE_WIDGET = "com.onemoondate.ACTION_UPDATE_WIDGET_LARGE";
    private static final String PREFS_NAME = "com.onemoondate.preferences";
    private static final String KEY_LANGUAGE = "language";
    private static final String KEY_DARK_MODE = "darkMode";
    private static final String ASYNC_STORAGE_PREFS_NAME = "ReactNativeAsyncStorage";

    // MIN 값은 LunarWidgetProvider의 MAX 값과 맞춰 1x1→2x2 전환 지점이 자연스럽게 이어지게 한다.
    // day는 헤더를 뺀 나머지 세로 공간을 채우는 폰트 크기를 직접 역산한다(2x3/3x2처럼 가로·세로가
    // 따로 늘어나도 대응 가능). 월도 세로 길이만 기준으로 삼는다 — 가로 기준으로 하면 폭만 늘어난
    // 모양(3x2 등)에서 헤더가 덩달아 커져 day 영역을 잡아먹는 역효과가 있었다.
    private static final int MIN_CELL_DP = 110;
    private static final int MAX_CELL_DP = 300;
    private static final float MIN_MONTH_SP = 26f;
    private static final float MAX_MONTH_SP = 38f;

    // widget_layout_large.xml의 padding과 맞춰야 한다.
    private static final float MONTH_LINE_HEIGHT_FACTOR = 1.35f;
    private static final int HEADER_PADDING_TOP_DP = 12;
    private static final int HEADER_PADDING_BOTTOM_DP = 10;
    private static final int DAY_PADDING_BOTTOM_DP = 5;
    // 레슨런: 글자 잉크(획) 높이 비율(1 미만)로 나누면 실기기에서 위아래가 잘린다.
    // TextView 줄 높이는 폰트 크기의 1.2~1.3배라 1보다 큰 값으로 나눠야 안전하다.
    private static final float DAY_SAFETY_RATIO = 0.85f;
    private static final float DAY_LINE_HEIGHT_FACTOR = 1.3f;
    private static final float DAY_WIDTH_FACTOR = 1.12f;
    private static final float MONTH_WIDTH_FACTOR = 3.25f;
    private static final int WIDTH_SAFETY_MARGIN_DP = 8;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                           int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        scheduleMidnightUpdate(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        cancelMidnightUpdate(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (ACTION_UPDATE_WIDGET.equals(intent.getAction()) ||
            Intent.ACTION_TIME_CHANGED.equals(intent.getAction()) ||
            Intent.ACTION_TIMEZONE_CHANGED.equals(intent.getAction()) ||
            Intent.ACTION_DATE_CHANGED.equals(intent.getAction()) ||
            Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, LunarWidgetLargeProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);

            for (int appWidgetId : appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }

            if (ACTION_UPDATE_WIDGET.equals(intent.getAction()) ||
                Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
                scheduleMidnightUpdate(context);
            }
        }
    }

    private static String getSavedLanguage(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String language = prefs.getString(KEY_LANGUAGE, null);

        if (language != null && (language.equals("ko") || language.equals("en") || language.equals("ja"))) {
            return language;
        }

        try {
            SharedPreferences asyncPrefs = context.getSharedPreferences(ASYNC_STORAGE_PREFS_NAME, Context.MODE_PRIVATE);
            String asyncLang = asyncPrefs.getString("@onemoondate:language", null);
            if (asyncLang != null && (asyncLang.equals("ko") || asyncLang.equals("en") || asyncLang.equals("ja"))) {
                prefs.edit().putString(KEY_LANGUAGE, asyncLang).apply();
                return asyncLang;
            }
        } catch (Exception e) {
        }

        return "ko";
    }

    private static boolean getSavedDarkMode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean darkMode = prefs.getBoolean(KEY_DARK_MODE, false);

        if (prefs.contains(KEY_DARK_MODE)) {
            return darkMode;
        }

        try {
            SharedPreferences asyncPrefs = context.getSharedPreferences(ASYNC_STORAGE_PREFS_NAME, Context.MODE_PRIVATE);
            String darkModeStr = asyncPrefs.getString("@onemoondate:darkMode", null);
            if (darkModeStr != null) {
                boolean isDark = darkModeStr.equals("dark");
                prefs.edit().putBoolean(KEY_DARK_MODE, isDark).apply();
                return isDark;
            }
        } catch (Exception e) {
        }

        return false;
    }

    private static String formatMonthText(String language, int month, boolean isLeapMonth) {
        String leapPrefix = "";
        String monthSuffix = "";

        switch (language) {
            case "en":
                leapPrefix = isLeapMonth ? "Leap " : "";
                monthSuffix = "";
                return leapPrefix + "M" + month;
            case "ja":
                leapPrefix = isLeapMonth ? "閏" : "";
                monthSuffix = "月";
                return leapPrefix + month + monthSuffix;
            case "ko":
            default:
                leapPrefix = isLeapMonth ? "윤" : "";
                monthSuffix = "월";
                return leapPrefix + month + monthSuffix;
        }
    }

    private static int getColorSafely(Context context, int colorResId) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                return context.getResources().getColor(colorResId, null);
            } else {
                return context.getResources().getColor(colorResId);
            }
        } catch (Exception e) {
            android.util.Log.e("LunarWidgetLarge", "색상 가져오기 실패: " + colorResId, e);
            return 0xFF000000;
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            Calendar cal = Calendar.getInstance();
            int currentYear = cal.get(Calendar.YEAR);
            int currentMonth = cal.get(Calendar.MONTH) + 1;
            int currentDay = cal.get(Calendar.DAY_OF_MONTH);

            LunarCalculator.LunarDate lunar = LunarCalculator.solarToLunar(
                currentYear,
                currentMonth,
                currentDay
            );

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout_large);

            if (lunar == null) {
                android.util.Log.e("LunarWidgetLarge", "음력 계산 실패: " + currentYear + "/" + currentMonth + "/" + currentDay);
                views.setTextViewText(R.id.widget_month, "오류");
                views.setTextViewText(R.id.widget_day, "?");
                appWidgetManager.updateAppWidget(appWidgetId, views);
                return;
            }

            String language = getSavedLanguage(context);
            boolean isDarkMode = getSavedDarkMode(context);

            int backgroundColor;
            if (isDarkMode) {
                backgroundColor = getColorSafely(context, R.color.card_dark);
            } else {
                backgroundColor = getColorSafely(context, R.color.white);
            }
            views.setInt(R.id.widget_container, "setBackgroundColor", backgroundColor);

            String monthText = formatMonthText(language, lunar.month, lunar.isLeapMonth);
            views.setTextViewText(R.id.widget_month, monthText);

            Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
            int minWidthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, MIN_CELL_DP);
            int minHeightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, MIN_CELL_DP);
            int availableWidthDp = Math.max(minWidthDp - WIDTH_SAFETY_MARGIN_DP, 1);

            float rawMonthSp = WidgetTextSizeCalculator.scaledSp(minHeightDp, MIN_CELL_DP, MAX_CELL_DP, MIN_MONTH_SP, MAX_MONTH_SP);
            float monthSp = Math.min(rawMonthSp, WidgetTextSizeCalculator.capByWidth(availableWidthDp, MONTH_WIDTH_FACTOR));

            float headerHeightDp = monthSp * MONTH_LINE_HEIGHT_FACTOR + HEADER_PADDING_TOP_DP + HEADER_PADDING_BOTTOM_DP;
            float dayAreaHeightDp = Math.max(minHeightDp - headerHeightDp - DAY_PADDING_BOTTOM_DP, 1f);
            float daySpFromHeight = WidgetTextSizeCalculator.fillHeightSp(dayAreaHeightDp, DAY_SAFETY_RATIO, DAY_LINE_HEIGHT_FACTOR);
            float daySpFromWidth = WidgetTextSizeCalculator.capByWidth(availableWidthDp, DAY_WIDTH_FACTOR);
            float daySp = Math.min(daySpFromHeight, daySpFromWidth);

            views.setTextViewTextSize(R.id.widget_month, TypedValue.COMPLEX_UNIT_SP, monthSp);
            views.setTextViewTextSize(R.id.widget_day, TypedValue.COMPLEX_UNIT_SP, daySp);

            views.setTextViewText(R.id.widget_day, String.valueOf(lunar.day));
            int textColor;
            if (isDarkMode) {
                textColor = getColorSafely(context, R.color.text_primary_dark);
            } else {
                textColor = getColorSafely(context, R.color.text_primary_light);
            }
            views.setTextColor(R.id.widget_day, textColor);

            Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (intent != null) {
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
            }

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            android.util.Log.e("LunarWidgetLarge", "위젯 업데이트 실패", e);
        }
    }

    private void scheduleMidnightUpdate(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        Intent intent = new Intent(context, LunarWidgetLargeProvider.class);
        intent.setAction(ACTION_UPDATE_WIDGET);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            1,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Calendar midnight = Calendar.getInstance();
        midnight.add(Calendar.DAY_OF_YEAR, 1);
        midnight.set(Calendar.HOUR_OF_DAY, 0);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 5);
        midnight.set(Calendar.MILLISECOND, 0);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        midnight.getTimeInMillis(),
                        pendingIntent
                    );
                } else {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        midnight.getTimeInMillis(),
                        pendingIntent
                    );
                }
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    midnight.getTimeInMillis(),
                    pendingIntent
                );
            }
        } catch (SecurityException e) {
            android.util.Log.w("LunarWidgetLarge", "정확한 알람 권한 없음, 일반 알람 사용", e);
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                midnight.getTimeInMillis(),
                pendingIntent
            );
        }
    }

    private void cancelMidnightUpdate(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        Intent intent = new Intent(context, LunarWidgetLargeProvider.class);
        intent.setAction(ACTION_UPDATE_WIDGET);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            1,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        alarmManager.cancel(pendingIntent);
    }
}
