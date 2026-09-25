import { Composition } from 'remotion'
import { CatGamePromo } from './CatGamePromo'
import { Thumbnail } from './Thumbnail'
import { Thumbnail2 } from './Thumbnail2'
import { FeatureGraphic, StoreIcon, StoreShot } from './store/StoreAssets'

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CatGamePromo"
        component={CatGamePromo}
        durationInFrames={510}
        fps={30}
        width={1080}
        height={1920}
      />
      {/*
        <Still>가 아니라 <Composition>으로 등록한다. Thumbnail 안 SpriteDeco 아이콘들은
        스프링 팝인 애니메이션이 있는데, <Still>은 항상 frame 0만 렌더해서 delay가 있는
        아이콘들이 애니메이션 시작 전(투명) 상태로 찍혀 하나도 안 보였다.
        `remotion still ... --frame=40`처럼 애니메이션이 다 끝난 프레임을 지정해서 찍는다.
      */}
      <Composition id="Thumbnail" component={Thumbnail} durationInFrames={60} fps={30} width={1080} height={1920} />
      <Composition id="Thumbnail2" component={Thumbnail2} durationInFrames={60} fps={30} width={1080} height={1920} />
      <Composition id="StoreIcon" component={StoreIcon} durationInFrames={1} fps={30} width={512} height={512} />
      <Composition id="FeatureGraphic" component={FeatureGraphic} durationInFrames={1} fps={30} width={1024} height={500} />
      <Composition
        id="StoreShot1"
        component={StoreShot}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ shot: 's1-landing.png', line1: '상황만 알려주면', line2: '고양이가 알아서 결정해요' }}
      />
      <Composition
        id="StoreShot2"
        component={StoreShot}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ shot: 's2-select.png', line1: '성격 다섯 가지 중에서', line2: '우리 고양이를 골라요' }}
      />
      <Composition
        id="StoreShot3"
        component={StoreShot}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ shot: 'x-chat1.png', line1: '택배 상자가 왔다면?', line2: '행동별 확률까지 보여줘요' }}
      />
      <Composition
        id="StoreShot4"
        component={StoreShot}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ shot: 's3-decision.png', line1: '바퀴벌레가 나타났다!', line2: '고양이의 결정은?' }}
      />
    </>
  )
}
