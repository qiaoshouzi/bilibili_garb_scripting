import { encWbi } from './encWbi'
import { getData, getCookie, getWbiKeys } from './getData'

export type SearchResult = {
  type: 'garb' | 'act' | 'error'
  name: string
  id: string
  cover?: string
}

export const getSearchResult = async (
  kw: string,
  pn: number,
): Promise<{
  list: SearchResult[]
  hasMore: boolean
}> => {
  const resp = await getData<{
    data?: {
      list: any[]
      pn: number
      ps: number
      total: number
    }
  }>(
    'searchGarb',
    'GET',
    `https://api.bilibili.com/x/garb/v2/mall/home/search?key_word=${kw}&pn=${pn}`,
  )
  if (
    !Array.isArray(resp.body?.data?.list) ||
    typeof resp.body.data.pn !== 'number' ||
    typeof resp.body.data.ps !== 'number' ||
    typeof resp.body.data.total !== 'number'
  )
    throw new Error('search:API返回数据结构错误')
  const list: SearchResult[] = []
  for (const i of resp.body.data?.list || []) {
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
    hasMore: resp.body.data.pn * resp.body.data.ps < resp.body.data.total,
  }
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
          room_id: number
        }[]
      }
}
export type SearchUserResult = {
  mid: number
  username: string
  avatar: string
  rid: number
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
    const cookies = await getCookie(count > 0)
    const wbiKeys = await getWbiKeys(cookies, count > 0)
    count++
    const params = { search_type: 'bili_user', keyword, page: String(pn) }
    const query = encWbi(params, wbiKeys.imgKey, wbiKeys.subKey)

    const resp = await getData<SearchUserData>(
      'searchUser',
      'GET',
      'https://api.bilibili.com/x/web-interface/wbi/search/type?' + query,
      {
        headers: {
          Referer: 'https://search.bilibili.com/',
          Cookie: cookies,
        },
      },
    )
    if (resp.body.code !== 0 || 'v_voucher' in resp.body.data) {
      console.log(JSON.stringify(resp.body))
      continue
    }
    if (Number.isInteger(resp.body.data.page) && !resp.body.data.result)
      throw new Error('没有搜索到相关用户')
    return {
      list: resp.body.data.result.map((v) => {
        let avatar = v.upic.replace('http://', 'https://')
        if (avatar.startsWith('//')) avatar = 'https:' + avatar
        return {
          mid: v.mid,
          username: v.uname,
          avatar,
          rid: v.room_id,
        }
      }),
      hasMore: resp.body.data.numPages > resp.body.data.page,
      pn: resp.body.data.page,
    }
  }
  throw new Error('getSearchUserResult Fail 出现未知错误')
}
