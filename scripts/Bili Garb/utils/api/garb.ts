import { getData } from './getData'

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
    const resp = await getData<GarbData>(
      'garb',
      'GET',
      `https://api.bilibili.com/x/garb/v2/mall/suit/detail?item_id=${id}&part=suit`,
    )
    if (resp.body.code === 0) {
      if (resp.body.data?.item_id !== id) return null
      return resp.body
    } else throw new Error(JSON.stringify(resp.body))
  } catch (e: any) {
    console.error(`getGarbData:fail:${id}`, String(e))
    return null
  }
}
