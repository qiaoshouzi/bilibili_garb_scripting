import { getData } from './getData'

export type LoginInfo = {
  url: string
  key: string
}
export const getLoginInfo = async (): Promise<LoginInfo | null> => {
  try {
    const resp = await getData<{
      code: number
      data?: {
        url: string
        qrcode_key: string
      }
    }>('loginInfo', 'GET', 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate', {
      headers: {
        Referer: 'https://search.bilibili.com/',
      },
    })
    if (typeof resp.body?.data?.url === 'string' && typeof resp.body.data.qrcode_key === 'string')
      return {
        url: resp.body.data.url,
        key: resp.body.data.qrcode_key,
      }
    else throw new Error(JSON.stringify(resp.body))
  } catch (e) {
    console.error('getLoginUrl:fail', String(e))
  }
  return null
}
export type LoginResult =
  | {
      code: 86038 | 86090 | 86101
      message: string
    }
  | {
      code: 0
      cookie: string
    }
export const getLoginResult = async (key: string): Promise<LoginResult | null> => {
  try {
    const resp = await getData<{
      code: number
      data?: {
        code: 0 | 86038 | 86090 | 86101
        message: string
      }
    }>(
      'loginResult',
      'GET',
      'https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=' + key,
      {
        headers: {
          Referer: 'https://search.bilibili.com/',
        },
      },
    )
    if (typeof resp.body?.data?.code === 'number') {
      if (resp.body.data.code !== 0)
        return {
          code: resp.body.data.code,
          message: resp.body.data.message,
        }
      else {
        const cookie = resp.cookies.map((v) => `${v.name}=${v.value}`).join('; ')
        return {
          code: resp.body.data.code,
          cookie,
        }
      }
    } else throw new Error(JSON.stringify(resp.body))
  } catch (e) {
    console.error('getLoginUrl:fail', String(e))
  }
  return null
}
