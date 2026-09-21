import type { ActionId } from './actions'
import type { CatTypeId } from './catTypes'

/** 타입(성격) × 행동별 고양이 울음소리. 같은 조합이 반복되면 번갈아 사용한다. */
const SOUNDS: Record<CatTypeId, Record<ActionId, string[]>> = {
  timid: {
    hide: ['냐앙...', '냐아앙...!'],
    investigate: ['냥...?', '냐앙...?'],
    play: ['냥...! 냥...', '냐앙, 냥...'],
    eat: ['냥... 냠...', '냐앙... 냠냠...'],
    sleep: ['쿨... 냐앙...', '냐아...'],
    cuddle: ['냐앙... 골골...', '냥... 냥...'],
    hiss: ['하...악...!', '냐앙!! 하악...'],
    ignore: ['냐앙...', '...냥...'],
  },
  playful: {
    hide: ['냥냥!', '냐옹? 냥!'],
    investigate: ['냥냥? 냥!', '냐옹냐옹?'],
    play: ['냥냥냥! 냐옹!', '냐옹 냥! 냥냥!'],
    eat: ['냥냥! 냠냠!', '냐옹냐옹 냠!'],
    sleep: ['냥... 쿨...', '냐옹... 쿨쿨...'],
    cuddle: ['냥냥~ 냐옹!', '냐옹 냥냥~'],
    hiss: ['하악! 냥!', '냐악! 냥냥!'],
    ignore: ['냥? 냥냥!', '냐옹~ 냥!'],
  },
  aloof: {
    hide: ['...냥.', '흥. 냐옹.'],
    investigate: ['냥?', '...냐옹?'],
    play: ['냥. 냥.', '...냐옹. 냥.'],
    eat: ['냐옹.', '...냥. 냠.'],
    sleep: ['쿨... 냥.', '...냐옹.'],
    cuddle: ['...냐옹. 냥.', '냥. (골골)'],
    hiss: ['하악.', '냐악. 하악.'],
    ignore: ['냥.', '흥.', '...냐옹.'],
  },
  glutton: {
    hide: ['냐옹...?', '냥... 냠?'],
    investigate: ['냐옹~? 냥냥?', '냥? 냠냠?'],
    play: ['냐옹~ 냥냥!', '냥냥~ 냐옹!'],
    eat: ['냐옹~ 냠냠 냥!', '냐아아옹~ 냠냠!'],
    sleep: ['냐옹~... 쿨...', '냠... 냥... 쿨...'],
    cuddle: ['냐옹~ 냥냥~', '냐아옹~ 골골~'],
    hiss: ['냐악! 냥!', '하악! 냐옹!'],
    ignore: ['냐옹~', '냥... 냠...'],
  },
  explorer: {
    hide: ['냥?!', '냐옹...?'],
    investigate: ['냥? 냐옹?', '냐옹! 냥냥?'],
    play: ['냐옹! 냥냥!', '냥! 냐옹 냥!'],
    eat: ['냥! 냠냠!', '냐옹 냠!'],
    sleep: ['냥... 쿨...', '냐옹... 쿨...'],
    cuddle: ['냥냥~ 냐옹!', '냐옹~ 냥!'],
    hiss: ['하악! 냥!', '냐악!'],
    ignore: ['냥. 냐옹.', '냐옹~'],
  },
}

export function catSound(typeId: CatTypeId, action: ActionId, turnId: number): string {
  const options = SOUNDS[typeId][action]
  return options[turnId % options.length]
}
