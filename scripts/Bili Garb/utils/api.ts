import { fetch } from 'scripting'

export type SearchResult = {
  type: 'garb' | 'act' | 'error'
  name: string
  id: string
  cover?: string
}
export type CardData = {
  name?: string
} & ({ img: string; videos?: string[] } | { videos: string[]; img?: string })
export type ItemData = {
  name: string
  showExample?: boolean
  data: CardData[]
}

export const getSearchResult = async (
  kw: string,
  pn: number,
): Promise<{
  list: SearchResult[]
  hasMore: boolean
}> => {
  const resp = await fetch(
    `https://api.bilibili.com/x/garb/v2/mall/home/search?key_word=${kw}&pn=${pn}`,
  )
  if (!resp.ok) throw new Error(`search:reqError: ${resp.status}: ${resp.statusText}`)
  const resp_json = (await resp.json()) as {
    data?: {
      list: any[]
      pn: number
      ps: number
      total: number
    }
  }
  if (
    !Array.isArray(resp_json?.data?.list) ||
    typeof resp_json.data.pn !== 'number' ||
    typeof resp_json.data.ps !== 'number' ||
    typeof resp_json.data.total !== 'number'
  )
    throw new Error('search:API返回数据结构错误')
  const list: SearchResult[] = []
  for (const i of resp_json.data?.list || []) {
    let name: string
    if (typeof i?.name === 'string') name = i.name
    else if (typeof i?.group_name === 'string') name = i.group_name
    else name = '获取名称失败'
    const cover: string | undefined = i?.properties?.image_cover || undefined
    if (typeof i?.properties?.dlc_act_id === 'string') {
      list.push({
        type: 'act',
        id: i.properties.dlc_act_id,
        name,
        cover,
      })
    } else if (typeof i?.item_id === 'number' && i.item_id > 0) {
      list.push({
        type: 'garb',
        id: String(i.item_id),
        name,
        cover,
      })
    } else
      list.push({
        type: 'error',
        id: '0',
        name,
        cover,
      })
  }
  return {
    list,
    hasMore: resp_json.data.pn * resp_json.data.ps < resp_json.data.total,
  }
}

export const handleHDSLBUrl = (url: string) => {
  return url.split('@')[0].replace('http://', 'https://')
}
export const getData: {
  <T = any>(url: string, responseType?: 'json'): Promise<T>
  (url: string, responseType: 'arrayBuffer'): Promise<ArrayBuffer>
} = async (url: string, responseType: 'json' | 'arrayBuffer' = 'json') => {
  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(`resp not ok, ${resp.status}: ${resp.statusText}`)
  }
  if (responseType === 'json') {
    return (await resp.json()) as any
  } else {
    return await resp.arrayBuffer()
  }
}

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
    const data = await getData<ActAssetsData>(
      `https://api.bilibili.com/x/vas/dlc_act/asset_bag?act_id=${id}`,
    )
    if (data.code === 0 && Array.isArray(data.data?.item_list)) return data
    else throw new Error(JSON.stringify(data))
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
    const data = await getData<ActBasicData>(
      `https://api.bilibili.com/x/vas/dlc_act/act/basic?act_id=${id}`,
    )
    if (data.code === 0 && data.data?.act_title) return data
    else throw new Error(JSON.stringify(data))
  } catch (e: any) {
    console.error(`getActBasicData:fail:${id}`, String(e))
    return null
  }
}
export const getItemDataA = async (
  itemIDA: string | number,
): Promise<Record<string, any> | null | 'error'> => {
  try {
    const data = await getData<Record<string, any>>(
      `https://api.bilibili.com/x/garb/v2/user/suit/benefit?item_id=${itemIDA}&part=emoji_package`,
    )
    if (data.code === 0 && data.data?.name) return data
    else throw new Error(JSON.stringify(data))
  } catch (e: any) {
    console.error(`getItemDataA:fail:${itemIDA}`, String(e))
    return 'error'
  }
}
type GarbData = {
  code: number
  message: string
  data?: {
    item_id?: number
    suit_items?: {
      card?: {
        properties?: {
          image?: string
          image_preview_small?: string
        }
      }[]
      card_bg?: {
        properties?: {
          image?: string
          image_preview_small?: string
        }
      }[]
      emoji_package?: {
        items?: {
          name?: string
          properties?: {
            image?: string
          }
        }[]
      }[]
      play_icon?: {
        properties?: {
          drag_left_png?: string
          drag_right_png?: string
          middle_png?: string
          squared_image?: string
          static_icon_image?: string
        }
      }[]
      skin?: {
        properties?: {
          head_myself_mp4_bg?: string
          head_myself_squared_bg?: string
          image_cover?: string
          tail_bg?: string
          tail_icon_channel?: string
          tail_icon_dynamic?: string
          tail_icon_main?: string
          tail_icon_myself?: string
          tail_icon_pub_btn_bg?: string
          tail_icon_selected_channel?: string
          tail_icon_selected_dynamic?: string
          tail_icon_selected_main?: string
          tail_icon_selected_myself?: string
          tail_icon_selected_pub_btn_bg?: string
          tail_icon_selected_shop?: string
          tail_icon_shop?: string
        }
      }[]
      space_bg?: {
        properties: {
          image1_portrait?: string
          image2_portrait?: string
          image3_portrait?: string
          image4_portrait?: string
          image5_portrait?: string
          image6_portrait?: string
          image7_portrait?: string
          image8_portrait?: string
        }
      }[]
    }
  }
}
export const getGarbData = async (id: number): Promise<GarbData | null> => {
  try {
    const data = await getData<GarbData>(
      `https://api.bilibili.com/x/garb/v2/mall/suit/detail?item_id=${id}&part=suit`,
    )
    if (data.code === 0) {
      if (data.data?.item_id !== id) return null
      return data
    } else throw new Error(JSON.stringify(data))
  } catch (e: any) {
    console.error(`getGarbData:fail:${id}`, String(e))
    return null
  }
}
