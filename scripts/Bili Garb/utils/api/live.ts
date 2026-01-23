import { getData } from './getData'
import { handleHDSLBUrl } from './handleHDSLBUrl'
import { ItemData } from './types'

export type LiveEmoteData = {
  code: number
  data?: {
    data?: {
      pkg_name?: string
      pkg_type?: number
      emoticons?: {
        emoji?: string
        url?: string
      }[]
    }[]
  }
}
export const getLiveEmoteData = async (
  rid: string | number,
  cookie: string,
): Promise<ItemData[] | null> => {
  try {
    const resp = await getData<LiveEmoteData>(
      'liveEmote',
      'GET',
      `https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id=${rid}`,
      {
        headers: {
          Referer: 'https://live.bilibili.com/',
          Cookie: cookie,
        },
      },
    )
    if (resp.body.code === 0 && Array.isArray(resp.body.data?.data)) {
      const list: ItemData[] = []
      for (const i of resp.body.data.data) {
        if (i.pkg_type !== 2 || !Array.isArray(i.emoticons)) continue
        const itemData: ItemData = {
          name: i.pkg_name || '直播间专属表情包',
          showExample: true,
          data: [],
        }
        for (const ii of i.emoticons) {
          if (typeof ii.url !== 'string') continue
          itemData.data.push({
            name: ii.emoji || undefined,
            img: handleHDSLBUrl(ii.url.replace('http://', 'https://')),
          })
        }
        if (itemData.data.length > 0) list.push(itemData)
      }
      return list
    } else throw new Error(JSON.stringify(resp.body))
  } catch (e: any) {
    console.error(`getLiveEmoteData:fail:${rid}`, String(e))
    return null
  }
}
