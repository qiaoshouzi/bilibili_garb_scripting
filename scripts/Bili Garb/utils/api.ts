import { fetch } from 'scripting'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'

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
    const data = await getData<UpData>(
      `https://api.bilibili.com/x/upowerv2/gw/rights/guide?up_mid=${mid}`,
    )
    if (
      data.code === 0 &&
      data.data?.up?.up_mid === Number(mid) &&
      Array.isArray(data.data.rights)
    ) {
      const list: CardData[] = []
      for (const i of data.data.rights) {
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
    } else if (data.code === 203010) return []
    else throw new Error(JSON.stringify(data))
  } catch (e: any) {
    console.error(`getUpData:fail:${mid}`, String(e))
    return null
  }
}

export const getBiliCookie = async (force = false) => {
  try {
    if (!force) {
      const localData = Storage.get<string>('bili_cookie')
      if (localData) {
        console.log('getBiliCookie HIT cache')
        return localData
      }
    }
    console.log('getBiliCookie MISS cache', force)
    const resp = await fetch('https://bilibili.com', {
      headers: {
        'User-Agent': UA,
      },
    })
    const cookie = resp.cookies.map((v) => `${v.name}=${v.value}`).join('; ')
    Storage.set('bili_cookie', cookie)
    return cookie
  } catch (e) {
    throw new Error(`getBiliCookieFail: ${String(e)}`)
  }
}
export type BiliWbiKeys = {
  imgKey: string
  subKey: string
}
export const getBiliWbiKeys = async (cookies: string, force = false): Promise<BiliWbiKeys> => {
  try {
    if (!force) {
      const localData = Storage.get<BiliWbiKeys>('bili_wbiKeys')
      if (localData) {
        console.log('getBiliWbiKeys HIT cache')
        return localData
      }
    }
    console.log('getBiliWbiKeys MISS cache', force)
    const resp = await fetch('https://api.bilibili.com/x/web-interface/nav', {
      headers: {
        'User-Agent': UA,
        Referer: 'https://search.bilibili.com/',
        Cookie: cookies,
      },
    })
    const resp_json = (await resp.json()) as {
      data: {
        wbi_img: {
          img_url: string
          sub_url: string
        }
      }
    }
    const imgUrl = resp_json.data.wbi_img.img_url
    const imgKey = imgUrl.slice(imgUrl.lastIndexOf('/') + 1, imgUrl.lastIndexOf('.'))
    const subUrl = resp_json.data.wbi_img.sub_url
    const subKey = subUrl.slice(subUrl.lastIndexOf('/') + 1, subUrl.lastIndexOf('.'))
    const result = { imgKey, subKey }
    Storage.set('bili_wbiKeys', result)
    return result
  } catch (e) {
    throw new Error(`getBiliWbiKeysFail: ${String(e)}`)
  }
}
const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28,
  14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54,
  21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
]
const getMixinKey = (orig: string) =>
  mixinKeyEncTab
    .map((n) => orig[n])
    .join('')
    .slice(0, 32)
const encWbi = (params: Record<string, string>, img_key: string, sub_key: string) => {
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g

  Object.assign(params, { wts: curr_time }) // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object.keys(params)
    .sort()
    .map((key) => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')
  const wbi_sign = Crypto.md5(Data.fromRawString(query + mixin_key) as Data).toHexString() // 计算 w_rid

  return query + '&w_rid=' + wbi_sign
}
export type SearchUserData = {
  code: number
  data:
    | { v_voucher: string }
    | {
        page: number
        numPages: number
        result: {
          mid: number
          uname: string
          upic: string
        }[]
      }
}
export type SearchUserResult = {
  mid: number
  username: string
  avatar: string
}
export const getSearchUserResult = async (
  keyword: string,
  pn: number,
): Promise<{
  list: SearchUserResult[]
  hasMore: boolean
  pn: number
}> => {
  let count = 0
  while (count <= 1) {
    const cookies = await getBiliCookie(count > 0)
    const wbiKeys = await getBiliWbiKeys(cookies, count > 0)
    count++
    const params = { search_type: 'bili_user', keyword, page: String(pn) }
    const query = encWbi(params, wbiKeys.imgKey, wbiKeys.subKey)
    const resp = await fetch('https://api.bilibili.com/x/web-interface/wbi/search/type?' + query, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://search.bilibili.com/',
        Cookie: cookies,
      },
    })
    const resp_json = (await resp.json()) as SearchUserData
    if (resp_json.code !== 0 || 'v_voucher' in resp_json.data) {
      console.log(JSON.stringify(resp_json))
      continue
    }
    if (Number.isInteger(resp_json.data.page) && !resp_json.data.result)
      throw new Error('没有搜索到相关用户')
    return {
      list: resp_json.data.result.map((v) => {
        let avatar = v.upic.replace('http://', 'https://')
        if (avatar.startsWith('//')) avatar = 'https:' + avatar
        return {
          mid: v.mid,
          username: v.uname,
          avatar,
        }
      }),
      hasMore: resp_json.data.numPages > resp_json.data.page,
      pn: resp_json.data.page,
    }
  }
  throw new Error('getSearchUserResult Fail 出现未知错误')
}
