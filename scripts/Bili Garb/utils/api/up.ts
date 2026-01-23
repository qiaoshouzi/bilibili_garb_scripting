import { getData } from './getData'
import { CardData } from './types'

export type UpData = {
  code: number
  message: string
  data?: {
    up?: {
      up_mid?: number
    }
    rights?: {
      right_list?: {
        right_type: 'emote'
        list?: {
          id: number
          name: string
          icon: string
        }[]
      }[]
    }[]
  }
}
export const getUpEmoteData = async (mid: string | number): Promise<CardData[] | null> => {
  try {
    const resp = await getData<UpData>(
      'up',
      'GET',
      `https://api.bilibili.com/x/upowerv2/gw/rights/guide?up_mid=${mid}`,
    )
    if (
      resp.body.code === 0 &&
      resp.body.data?.up?.up_mid === Number(mid) &&
      Array.isArray(resp.body.data.rights)
    ) {
      const list: CardData[] = []
      for (const i of resp.body.data.rights) {
        for (const ii of i.right_list ?? []) {
          if (ii.right_type !== 'emote') continue
          for (const iii of ii.list ?? []) {
            if (list.findIndex((v) => v.img === iii.icon) >= 0) continue
            list.push({
              name: iii.name,
              img: iii.icon,
            })
          }
        }
      }
      return list
    } else if (resp.body.code === 203010) return []
    else throw new Error(JSON.stringify(resp.body))
  } catch (e: any) {
    console.error(`getUpData:fail:${mid}`, String(e))
    return null
  }
}
