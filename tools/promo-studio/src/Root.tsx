import { Composition, Folder } from 'remotion'
import { CatGamePromo } from './cat-game/CatGamePromo'
import { Thumbnail } from './cat-game/Thumbnail'
import { Thumbnail2 } from './cat-game/Thumbnail2'
import { FeatureGraphic, StoreIcon, StoreShot } from './cat-game/store/StoreAssets'

const storeShots = [
  { shot: 's1-landing.png', line1: '상황만 알려주면', line2: '고양이가 알아서 결정해요' },
  { shot: 's2-select.png', line1: '성격 다섯 가지 중에서', line2: '우리 고양이를 골라요' },
  { shot: 'x-chat1.png', line1: '택배 상자가 왔다면?', line2: '행동별 확률까지 보여줘요' },
  { shot: 's3-decision.png', line1: '바퀴벌레가 나타났다!', line2: '고양이의 결정은?' },
]

/**
 * 프로젝트(앱)마다 <Folder>와 컴포지션 id 접두사(CatGame...)로 묶는다. 새 앱을 추가할 때는
 * src/<앱이름>/ 폴더와 public/<앱이름>/ 폴더를 만들고 여기에 <Folder>를 하나 더 둔다.
 */
export const RemotionRoot = () => {
  return (
    <>
      <Folder name="cat-game">
        <Composition id="CatGamePromo" component={CatGamePromo} durationInFrames={510} fps={30} width={1080} height={1920} />
        {/*
          <Still>가 아니라 <Composition>으로 등록한다. Thumbnail 안 SpriteDeco 아이콘들은
          스프링 팝인 애니메이션이 있는데, <Still>은 항상 frame 0만 렌더해서 delay가 있는
          아이콘들이 애니메이션 시작 전(투명) 상태로 찍혀 하나도 안 보였다.
          `remotion still ... --frame=40`처럼 애니메이션이 다 끝난 프레임을 지정해서 찍는다.
        */}
        <Composition id="CatGameThumbnail" component={Thumbnail} durationInFrames={60} fps={30} width={1080} height={1920} />
        <Composition id="CatGameThumbnail2" component={Thumbnail2} durationInFrames={60} fps={30} width={1080} height={1920} />
        <Composition id="CatGameStoreIcon" component={StoreIcon} durationInFrames={1} fps={30} width={512} height={512} />
        <Composition id="CatGameFeatureGraphic" component={FeatureGraphic} durationInFrames={1} fps={30} width={1024} height={500} />
        {storeShots.map((props, i) => (
          <Composition
            key={props.shot}
            id={`CatGameStoreShot${i + 1}`}
            component={StoreShot}
            durationInFrames={1}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={props}
          />
        ))}
      </Folder>
    </>
  )
}
