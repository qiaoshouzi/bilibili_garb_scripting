import { getData } from './getData'

export const getItemDataA = async (
  itemIDA: string | number,
): Promise<Record<string, any> | null | 'error'> => {
  try {
    const resp = await getData<Record<string, any>>(
      'itemA',
      'GET',
      `https://api.bilibili.com/x/garb/v2/user/suit/benefit?item_id=${itemIDA}&part=emoji_package`,
    )
    if (resp.body.code === 0 && resp.body.data?.name) return resp.body
    else throw new Error(JSON.stringify(resp.body))
  } catch (e: any) {
    console.error(`getItemDataA:fail:${itemIDA}`, String(e))
    return 'error'
  }
}
