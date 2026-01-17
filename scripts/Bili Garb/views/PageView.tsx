import {
  HStack,
  Image,
  List,
  NavigationLink,
  NavigationStack,
  Text,
  useEffect,
  useState,
} from 'scripting'
import {
  ActAssetsData,
  ActCollectorMedalInfo,
  CardData,
  getActAssetsData,
  getActBasicData,
  getGarbData,
  getItemDataA,
  handleHDSLBUrl,
  ItemData,
  SearchResult,
} from '../utils/api'
import { ItemView } from './ItemView'

const ACT_REDEEM_ITEM_TYPE = [2, 3, 5, 10, 15]
const getTotalProcess = (data: ActAssetsData) => {
  let count = 0
  for (const i of data.data?.collect_list ?? []) {
    const t = Number(i?.redeem_item_type)
    if (ACT_REDEEM_ITEM_TYPE.includes(t)) count += String(i.redeem_item_id).split('&').length
  }
  return count
}

export function PackageView({
  type,
  id,
  name,
}: {
  type: SearchResult['type']
  id: string
  name: string
}) {
  const [title, setTitle] = useState(name)
  const [list, setList] = useState<ItemData[]>([])
  const [errMsg, setErrMsg] = useState<string>()
  const [process, setProcess] = useState<[number, number]>()
  useEffect(() => {
    const main = async () => {
      const tmpList: ItemData[] = []
      try {
        if (type === 'act') {
          setProcess([0, 2])
          const actBasicData = await getActBasicData(id)
          if (!actBasicData) throw new Error('获取 actBasicData 失败, 请检查日志')
          setProcess((pre) => (pre ? [pre[0] + 1, pre[1]] : pre))
          // Title
          if (typeof actBasicData.data?.act_title === 'string')
            setTitle(actBasicData.data.act_title)
          // 勋章
          if (actBasicData.data?.collector_medal_info) {
            const list: string[] = []
            const result = JSON.parse(
              actBasicData.data.collector_medal_info,
            ) as ActCollectorMedalInfo
            for (const i of result) list.push(handleHDSLBUrl(i.image))
            tmpList.push({
              name: '勋章',
              showExample: true,
              data: list.map((v) => ({
                img: v,
              })),
            })
          }

          const actAssetsData = await getActAssetsData(id)
          if (!actAssetsData) throw new Error('获取 actAssetsData 失败, 请检查日志')
          // 卡牌
          if (actAssetsData.data?.item_list) {
            const list: CardData[] = []
            for (const i of actAssetsData.data.item_list) {
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
            if (list.length > 0)
              tmpList.push({
                name: '卡牌',
                data: list,
              })
          }
          setProcess((pre) => (pre ? [pre[0], pre[1] + getTotalProcess(actAssetsData)] : pre))
          setProcess((pre) => (pre ? [pre[0] + 1, pre[1]] : pre))

          if (!Array.isArray(actAssetsData.data?.collect_list))
            throw new Error('获取 actAssetsData.data.collect_list 格式错误, 请向开发者反馈')
          for (const i of actAssetsData.data.collect_list) {
            const t = Number(i?.redeem_item_type)
            if (ACT_REDEEM_ITEM_TYPE.includes(t)) {
              let tmpChildItem: ItemData | undefined = i.redeem_item_name
                ? {
                    name: i.redeem_item_name,
                    data: [],
                  }
                : undefined
              for (const itemID of String(i.redeem_item_id).split('&')) {
                const itemData = await getItemDataA(itemID)
                setProcess((pre) => (pre ? [pre[0] + 1, pre[1]] : pre))
                if (!itemData || itemData === 'error')
                  throw new Error(`获取 itemData:${itemID} 失败, 请检查日志`)
                if (t === 2 || t === 10) {
                  // 表情包
                  const emoji = itemData?.data?.suit_items?.emoji
                  if (!Array.isArray(emoji)) continue
                  if (!tmpChildItem)
                    tmpChildItem = {
                      name: '表情包',
                      data: [],
                    }
                  tmpChildItem.showExample = true
                  for (const ii of emoji) {
                    const img = ii?.properties?.image
                    if (typeof img === 'string')
                      tmpChildItem.data.push({
                        name: ii?.name?.replace(/\[[^_]+_(.*?)\]/g, '$1'),
                        img: handleHDSLBUrl(img),
                      })
                  }
                } else if (t === 3) {
                  // 头像框
                  const img = itemData?.data?.properties?.image
                  if (typeof img !== 'string') continue
                  if (!tmpChildItem)
                    tmpChildItem = {
                      name: '头像框',
                      data: [],
                    }
                  tmpChildItem.data.push({
                    img: handleHDSLBUrl(img),
                  })
                } else if (t === 5) {
                  // 主题
                  const partID = itemData?.data?.part_id
                  const data = itemData?.data?.properties
                  if (!data || !Number.isInteger(partID)) continue
                  if (!tmpChildItem)
                    tmpChildItem = {
                      name: '主题',
                      data: [],
                    }
                  if (partID === 9) {
                    // 主题
                    const head_myself_mp4_bg = data?.head_myself_mp4_bg || null
                    if (typeof head_myself_mp4_bg === 'string')
                      tmpChildItem.data.push({
                        videos: [head_myself_mp4_bg],
                      })
                    const list = {
                      head_myself_squared_bg: data?.head_myself_squared_bg || null,
                      image_cover: data?.image_cover || null,
                      tail_bg: data?.tail_bg || null,
                      tail_icon_channel: data?.tail_icon_channel || null,
                      tail_icon_dynamic: data?.tail_icon_dynamic || null,
                      tail_icon_main: data?.tail_icon_main || null,
                      tail_icon_myself: data?.tail_icon_myself || null,
                      tail_icon_pub_btn_bg: data?.tail_icon_pub_btn_bg || null,
                      tail_icon_selected_channel: data?.tail_icon_selected_channel || null,
                      tail_icon_selected_dynamic: data?.tail_icon_selected_dynamic || null,
                      tail_icon_selected_main: data?.tail_icon_selected_main || null,
                      tail_icon_selected_myself: data?.tail_icon_selected_myself || null,
                      tail_icon_selected_pub_btn_bg: data?.tail_icon_selected_pub_btn_bg || null,
                      tail_icon_selected_shop: data?.tail_icon_selected_shop || null,
                      tail_icon_shop: data?.tail_icon_shop || null,
                    }
                    for (const i of Object.values(list)) {
                      if (typeof i !== 'string') continue
                      tmpChildItem.data.push({
                        img: handleHDSLBUrl(i),
                      })
                    }
                  } else if (partID === 11) {
                    // play_icon
                    const list = {
                      drag_left_png: data?.drag_left_png,
                      drag_right_png: data?.drag_right_png,
                      middle_png: data?.middle_png,
                      squared_image: data?.squared_image,
                      static_icon_image: data?.static_icon_image,
                    }
                    for (const i of Object.values(list))
                      if (typeof i === 'string')
                        tmpChildItem.data.push({
                          img: handleHDSLBUrl(i),
                        })
                  }
                } else if (t === 15) {
                  // 动态表情包
                  const emoji = itemData?.data?.suit_items?.emoji
                  if (!Array.isArray(emoji)) continue
                  if (!tmpChildItem)
                    tmpChildItem = {
                      name: '动态表情包',
                      data: [],
                    }
                  tmpChildItem.showExample = true
                  for (const i of emoji) {
                    const resultName = i?.name?.replace(/\[[^_]+_(.*?)\]/g, '$1') ?? undefined
                    const img = i?.properties?.image_gif ?? i?.properties?.img
                    if (typeof img !== 'string') continue
                    tmpChildItem.data.push({
                      name: resultName,
                      img: handleHDSLBUrl(img),
                    })
                  }
                }
              }
              if (tmpChildItem && tmpChildItem.data.length > 0) tmpList.push(tmpChildItem)
            }
          }
        } else if (type === 'garb') {
          setProcess([0, 1])
          const garbData = await getGarbData(Number(id))
          setProcess((pre) => (pre ? [pre[0] + 1, pre[1]] : pre))
          if (!garbData) throw new Error('获取 garbData 失败, 请检查日志')
          const suitItems = garbData.data?.suit_items
          if (!suitItems) throw new Error('garbData.suit_items 格式错误, 请类型开发者')
          // card & card_bg
          const cardItem: ItemData = {
            name: '动态&评论 卡片',
            showExample: true,
            data: [],
          }
          for (const i of [...(suitItems.card ?? []), ...(suitItems.card_bg ?? [])]) {
            const img = i.properties?.image_preview_small ?? i.properties?.image
            if (typeof img !== 'string') continue
            cardItem.data.push({
              img: handleHDSLBUrl(img),
            })
          }
          if (cardItem.data.length > 0) tmpList.push(cardItem)
          // emoji
          const emojiItem: ItemData = {
            name: '表情包',
            showExample: true,
            data: [],
          }
          for (const _ of suitItems.emoji_package ?? []) {
            for (const ii of _.items ?? []) {
              const name = ii.name?.replace(/\[[^_]+_(.*?)\]/g, '$1')
              const img = ii.properties?.image
              if (typeof img !== 'string') continue
              emojiItem.data.push({
                name,
                img: handleHDSLBUrl(img),
              })
            }
          }
          if (emojiItem.data.length > 0) tmpList.push(emojiItem)
          // play_icon
          const playIconItem: ItemData = {
            name: '播放进度条',
            showExample: true,
            data: [],
          }
          for (const i of suitItems.play_icon ?? []) {
            const list = {
              drag_left_png: i.properties?.drag_left_png,
              drag_right_png: i.properties?.drag_right_png,
              middle_png: i.properties?.middle_png,
              squared_image: i.properties?.squared_image,
              static_icon_image: i.properties?.static_icon_image,
            }
            for (const i of Object.values(list))
              if (typeof i === 'string')
                playIconItem.data.push({
                  img: handleHDSLBUrl(i),
                })
          }
          if (playIconItem.data.length > 0) tmpList.push(playIconItem)
          // skin
          const skinItem: ItemData = {
            name: '主题',
            data: [],
          }
          for (const i of suitItems.skin ?? []) {
            const head_myself_mp4_bg = i.properties?.head_myself_mp4_bg || null
            if (typeof head_myself_mp4_bg === 'string')
              skinItem.data.push({
                videos: [head_myself_mp4_bg],
              })
            const list = {
              head_myself_squared_bg: i.properties?.head_myself_squared_bg || null,
              image_cover: i.properties?.image_cover || null,
              tail_bg: i.properties?.tail_bg || null,
              tail_icon_channel: i.properties?.tail_icon_channel || null,
              tail_icon_dynamic: i.properties?.tail_icon_dynamic || null,
              tail_icon_main: i.properties?.tail_icon_main || null,
              tail_icon_myself: i.properties?.tail_icon_myself || null,
              tail_icon_pub_btn_bg: i.properties?.tail_icon_pub_btn_bg || null,
              tail_icon_selected_channel: i.properties?.tail_icon_selected_channel || null,
              tail_icon_selected_dynamic: i.properties?.tail_icon_selected_dynamic || null,
              tail_icon_selected_main: i.properties?.tail_icon_selected_main || null,
              tail_icon_selected_myself: i.properties?.tail_icon_selected_myself || null,
              tail_icon_selected_pub_btn_bg: i.properties?.tail_icon_selected_pub_btn_bg || null,
              tail_icon_selected_shop: i.properties?.tail_icon_selected_shop || null,
              tail_icon_shop: i.properties?.tail_icon_shop || null,
            }
            for (const i of Object.values(list)) {
              if (typeof i !== 'string') continue
              skinItem.data.push({
                img: handleHDSLBUrl(i),
              })
            }
          }
          if (skinItem.data.length > 0) tmpList.push(skinItem)
          // 卡牌
          const spaceBgItem: ItemData = {
            name: '卡牌',
            data: [],
          }
          for (const i of suitItems.space_bg ?? []) {
            const list = [
              i.properties.image1_portrait,
              i.properties.image2_portrait,
              i.properties.image3_portrait,
              i.properties.image4_portrait,
              i.properties.image5_portrait,
              i.properties.image6_portrait,
              i.properties.image7_portrait,
              i.properties.image8_portrait,
            ].map((v) => v || null)
            for (const i of list)
              if (typeof i === 'string')
                spaceBgItem.data.push({
                  img: handleHDSLBUrl(i),
                })
          }
          if (spaceBgItem.data.length > 0) tmpList.push(spaceBgItem)
        } else throw new Error('package type is error')
        if (tmpList.length > 0) setList(tmpList)
        else throw new Error('结果为空')
      } catch (e) {
        console.error(e)
        setErrMsg(String(e))
      }
    }
    main()
  }, [])
  return (
    <NavigationStack navigationTitle={title} navigationBarTitleDisplayMode={'inline'}>
      {errMsg !== undefined && <Text>{errMsg}</Text>}
      {list.length === 0 && <Text>{`加载中 ${process && `(${process[0]}/${process[1]})`}`}</Text>}
      {list.length > 0 && (
        <List>
          {list.map((v) => (
            <NavigationLink destination={<ItemView data={v} />}>
              <HStack
                fixedSize={{ horizontal: false, vertical: true }}
                frame={{ maxHeight: 'infinity' }}
              >
                <Text>{v.name}</Text>
                {v.showExample === true && typeof v.data[0].img === 'string' && (
                  <Image
                    imageUrl={v.data[0].img}
                    scaleToFit={true}
                    resizable
                    aspectRatio={{ contentMode: 'fit' }}
                    frame={{ height: 30 }}
                  />
                )}
              </HStack>
            </NavigationLink>
          ))}
        </List>
      )}
    </NavigationStack>
  )
}
