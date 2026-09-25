import { staticFile } from 'remotion'

/** public/cat-game/ 안의 에셋 경로 */
export const asset = (path: string) => staticFile(`cat-game/${path}`)
