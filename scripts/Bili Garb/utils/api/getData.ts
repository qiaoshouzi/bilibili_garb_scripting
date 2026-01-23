import { Cookie, fetch, type HeadersInit } from 'scripting'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'

export const getData = async <T = any>(
  name: string,
  method: 'GET' | 'POST',
  url: string,
  { headers }: { headers?: HeadersInit } = {},
): Promise<{ body: T; cookies: Cookie[] }> => {
  const resp = await fetch(url, {
    method,
    headers: {
      ...(headers || {}),
      'User-Agent': UA,
    },
  })
  if (!resp.ok) throw new Error(`${name}:fetch:status ${resp.status}: ${resp.statusText}`)
  const resp_text = await resp.text()
  try {
    const resp_json = JSON.parse(resp_text) as T
    return { body: resp_json, cookies: resp.cookies }
  } catch (e: any) {
    throw new Error(`${name}:fetch:body ${resp_text}`)
  }
}

export const getCookie = async (force = false) => {
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
export const getWbiKeys = async (cookies: string, force = false): Promise<BiliWbiKeys> => {
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
        Referer: 'https://www.bilibili.com/',
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
