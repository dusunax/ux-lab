import { loadFont } from '@remotion/google-fonts/NotoSansKR'

// Black Han Sans는 한글 자소 조합에 따라 렌더링이 깨지는 경우가 있어, 한글이 안정적으로 나오는
// Noto Sans KR(900, 가장 굵은 무게)로 통일한다. 타이틀·자막·라벨 전부 이 폰트 하나만 쓴다.
export const { fontFamily: displayFont } = loadFont('normal', { weights: ['900'], subsets: ['korean', 'latin'] })
