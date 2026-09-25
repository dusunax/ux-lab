# promo-studio

앱 홍보용 쇼츠/릴스 영상, 썸네일, 스토어 리스팅 에셋(아이콘·피처 그래픽·스크린샷)을 Remotion으로
만드는 도구입니다. 현재 대상은 `apps/cat-game`(고양이의 결정)입니다.

## 준비

```bash
cd tools/promo-studio
npm install            # pnpm workspace 밖이라 npm으로 독립 설치 (루트 lockfile 보호)
```

`public/`은 용량 때문에 커밋하지 않습니다. 렌더 전에 앱 에셋을 복사하고 실제 화면을 다시 캡처하세요.

```bash
mkdir -p public/sprites public/backgrounds public/screens public/store-src
cp ../../apps/cat-game/public/sprites/*.png public/sprites/
cp ../../apps/cat-game/public/backgrounds/*.webp public/backgrounds/
# public/screens/*.png (430x932), public/store-src/*.png (3x 캡처)는 배포 URL을 Playwright로 캡처
```

## 렌더

산출물은 `out/`(gitignore)에 `YYMMDD_<프로젝트>_<항목>` 이름으로 저장합니다.

```bash
npx remotion render src/index.ts CatGamePromo out/260923_cat-game_promo.mp4
npx remotion still  src/index.ts Thumbnail    out/260924_cat-game_thumbnail.png --frame=40
npx remotion still  src/index.ts FeatureGraphic out/260925_cat-game_feature-graphic-1024x500.png --frame=0
```

컴포지션 id: `CatGamePromo`, `Thumbnail`, `Thumbnail2`, `StoreIcon`, `FeatureGraphic`, `StoreShot1~4`.
스토리보드는 `storyboard/`에 있습니다. 전체 제작 절차는 our-claude의 `shorts-promo-video` 스킬을 참고하세요.
