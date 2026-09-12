package com.onemoondate.widget;

/**
 * 위젯 크기(dp)에 비례해 텍스트 크기(sp)를 계산한다.
 * 런처마다 "1x1"/"2x2" 셀의 실제 렌더링 크기가 달라 고정 sp는 특정 기기에서 잘림이 발생한다.
 */
final class WidgetTextSizeCalculator {

    private WidgetTextSizeCalculator() {
    }

    static float scaledSp(int currentDp, int minDp, int maxDp, float minSp, float maxSp) {
        if (maxDp <= minDp) {
            return minSp;
        }

        float ratio = (float) (currentDp - minDp) / (float) (maxDp - minDp);
        ratio = Math.max(0f, Math.min(1f, ratio));

        return minSp + (maxSp - minSp) * ratio;
    }

    // 폭이 부족한 축(가로로 안 늘어난 2xN 모양 등)에서 텍스트가 옆으로 잘리지 않도록 하는 상한.
    // widthFactor는 "이 폰트로 렌더링했을 때 sp당 필요한 가로 폭(dp)" — 실제 폭에서 계산한다.
    static float capByWidth(int availableDp, float widthFactor) {
        if (widthFactor <= 0f) {
            return Float.MAX_VALUE;
        }
        return availableDp / widthFactor;
    }

    // 세로로 남은 공간에 안전하게 들어가는 최대 폰트 크기를 구한다.
    // lineHeightFactor는 TextView 한 줄이 실제로 예약하는 세로 폭(ascent+descent+leading) / 폰트
    // 크기(보통 1.2~1.3, 글자 잉크 높이가 아니다 — 잉크 높이로 계산하면 실제로는 잘린다).
    static float fillHeightSp(float availableHeightDp, float safetyRatio, float lineHeightFactor) {
        if (lineHeightFactor <= 0f) {
            return 0f;
        }
        return Math.max(0f, availableHeightDp * safetyRatio / lineHeightFactor);
    }
}
