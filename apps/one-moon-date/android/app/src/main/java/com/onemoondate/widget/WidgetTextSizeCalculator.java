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
}
