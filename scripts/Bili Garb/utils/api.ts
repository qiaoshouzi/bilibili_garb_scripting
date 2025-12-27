import { fetch } from 'scripting'

export type SearchResult = {
  type: 'garb' | 'act' | 'error'
  name: string
  id: string
  cover?: string
}
export type CardData = {
  name: string
  img: string
  videos?: string[]
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
export const getGarbResult = async (id: string): Promise<CardData[]> => {
  const resp = await fetch(`https://api.bilibili.com/x/garb/v2/mall/suit/detail?item_id=${id}`)
  if (!resp.ok) throw new Error(`search:reqError: ${resp.status}: ${resp.statusText}`)
  const resp_json = await resp.json()
  const spaceBg = resp_json?.data?.suit_items?.space_bg
  if (!Array.isArray(spaceBg)) throw new Error('search:API返回数据结构错误')
  const list: CardData[] = []
  for (const i of spaceBg) {
    const properties = i?.properties
    if (typeof properties !== 'object') continue
    list.push(
      ...Object.entries(properties)
        .filter(([key]) => /image\d_portrait/.test(key))
        .map(([_, value]) => value)
        .filter((v): v is string => typeof v === 'string')
        .map((v) => ({
          name: 'img',
          img: v,
        })),
    )
  }
  if (list.length <= 0) throw new Error('404 NotFound')
  return list
}
export const getActResult = async (id: string): Promise<CardData[]> => {
  const resp = await fetch(`https://api.bilibili.com/x/vas/dlc_act/asset_bag?act_id=${id}`)
  if (!resp.ok) throw new Error(`search:reqError: ${resp.status}: ${resp.statusText}`)
  const resp_json = await resp.json()
  const list: CardData[] = []
  for (const i of resp_json?.data?.item_list || []) {
    const cardItem = i?.card_item
    const name = cardItem?.card_name
    const img = cardItem?.card_img
    if (typeof name !== 'string' || typeof img !== 'string') continue
    const videosValue = cardItem?.video_list
    let videos: string[] | undefined = undefined
    if (Array.isArray(videosValue))
      if (videosValue.every((item): item is string => typeof item === 'string'))
        videos = videosValue
    list.push({
      name,
      img,
      videos,
    })
  }
  for (const i of resp_json?.data?.collect_list || []) {
    if (i?.redeem_item_type != 1) continue
    const cardItem = i?.card_item?.card_type_info
    const name = cardItem?.name
    const img = cardItem?.overview_image
    if (typeof name !== 'string' || typeof img !== 'string') continue
    const videosValue = cardItem?.content?.animation?.animation_video_urls
    let videos: string[] | undefined = undefined
    if (Array.isArray(videosValue))
      if (videosValue.every((item): item is string => typeof item === 'string'))
        videos = videosValue
    list.push({
      name,
      img,
      videos,
    })
  }
  if (list.length <= 0) throw new Error('404 NotFound')
  return list
}
