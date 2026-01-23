import { getData } from './getData'

export type ActAssetsData = {
  code: number
  message: string
  data?: {
    item_list?: {
      card_item?: {
        card_name?: string
        card_img?: string
        video_list?: string[]
      }
    }[]
    collect_list?: {
      redeem_item_type?: number
      redeem_item_name?: string
      redeem_item_id?: string
    }[]
    lottery_simple_list?: {
      lottery_id: number
      lottery_name: string
    }[]
  }
}
export const getActAssetsData = async (id: string): Promise<ActAssetsData | null> => {
  try {
    const resp = await getData<ActAssetsData>(
      'actAssets',
      'GET',
      `https://api.bilibili.com/x/vas/dlc_act/asset_bag?act_id=${id}`,
    )
    if (resp.body.code === 0 && Array.isArray(resp.body.data?.item_list)) return resp.body
    else throw new Error(JSON.stringify(resp.body))
  } catch (e: any) {
    console.error(`getActBasicData:fail:${id}`, String(e))
    return null
  }
}
export type ActBasicData = {
  code: number
  message: string
  data?: {
    act_title: string
    collector_medal_info: string
    product_introduce: string
    related_mids?: string[]
    related_user_infos?: Record<
      string, // uid
      {
        uid: number
        nickname: string
        avatar: string
      }
    >
    lottery_list?: {
      lottery_id: string
    }[]
  }
}
export type ActCollectorMedalInfo = {
  image: string
}[]
export const getActBasicData = async (id: string): Promise<ActBasicData | null> => {
  try {
    const resp = await getData<ActBasicData>(
      'actBasic',
      'GET',
      `https://api.bilibili.com/x/vas/dlc_act/act/basic?act_id=${id}`,
    )
    if (resp.body.code === 0 && resp.body.data?.act_title) return resp.body
    else throw new Error(JSON.stringify(resp))
  } catch (e: any) {
    console.error(`getActBasicData:fail:${id}`, String(e))
    return null
  }
}
