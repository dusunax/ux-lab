# promo-studio

앱 홍보용 쇼츠/릴스 영상, 썸네일, 스토어 리스팅 에셋(아이콘·피처 그래픽·스크린샷)을 Remotion으로
만드는 도구입니다. 앱마다 폴더를 나눠 쓰며, 현재는 `cat-game`(고양이의 결정)이 있습니다.

## 구조

```
src/
  Root.tsx          컴포지션 등록. 앱마다 <Folder name="앱">과 id 접두사(CatGame...)로 묶는다
  shared/           앱과 무관한 코드 (safezone, font, decorate의 겹침 회피 로직)
  cat-game/         cat-game 전용 (theme, 컴포지션, components, store/, asset 경로 헬퍼)
public/cat-game/    cat-game 에셋 (sprites, backgrounds, screens, store-src) — 커밋하지 않음
storyboard/         cat-game.md 처럼 <앱>.md
out/                산출물 — 커밋하지 않음. YYMMDD_<앱>_<항목> 이름
```

새 앱을 추가할 때는 `src/<앱>/`, `public/<앱>/`, `storyboard/<앱>.md`를 만들고 `Root.tsx`에
`<Folder>`를 하나 더 둡니다. 앱에 묶이지 않는 코드만 `shared/`에 둡니다.

## 준비

```bash
cd tools/promo-studio
npm install            # pnpm workspace 밖이라 npm으로 독립 설치 (루트 lockfile 보호)
```

`public/`은 용량 때문에 커밋하지 않습니다. 렌더 전에 앱 에셋을 복사하고 실제 화면을 다시 캡처하세요.

```bash
mkdir -p public/cat-game/{sprites,backgrounds,screens,store-src}
cp ../../apps/cat-game/public/sprites/*.png public/cat-game/sprites/
cp ../../apps/cat-game/public/backgrounds/*.webp public/cat-game/backgrounds/
# public/cat-game/screens/*.png (430x932), public/cat-game/store-src/*.png (3x 캡처)는
# 배포 URL을 Playwright로 캡처. ui-board.png, profile-playful.png도 public/cat-game/에 둔다
```

## 렌더

```bash
npx remotion render src/index.ts CatGamePromo out/260923_cat-game_promo.mp4
npx remotion still  src/index.ts CatGameThumbnail out/260924_cat-game_thumbnail.png --frame=40
npx remotion still  src/index.ts CatGameFeatureGraphic out/260925_cat-game_feature-graphic-1024x500.png --frame=0
```

cat-game 컴포지션 id: `CatGamePromo`, `CatGameThumbnail`, `CatGameThumbnail2`, `CatGameStoreIcon`,
`CatGameFeatureGraphic`, `CatGameStoreShot1`\~`CatGameStoreShot4`.
전체 제작 절차는 our-claude의 `shorts-promo-video` 스킬을 참고하세요.
