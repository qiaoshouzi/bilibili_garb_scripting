import {
  Text,
  List,
  Path,
  fetch,
  Image,
  VStack,
  Script,
  Button,
  useState,
  LazyVGrid,
  useEffect,
  Navigation,
  NavigationStack,
} from 'scripting'

type SearchResult = {
  type: 'garb' | 'act' | 'error'
  name: string
  id: string
  cover?: string
}
type CardData = {
  name: string
  img: string
  videos?: string[]
}
const getSearchResult = async (
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
const getGarbResult = async (id: string): Promise<CardData[]> => {
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
const getActResult = async (id: string): Promise<CardData[]> => {
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
function ImageView({ data }: { data: CardData }) {
  const dismiss = Navigation.useDismiss()
  return (
    <NavigationStack>
      <List
        navigationTitle={data.name}
        navigationBarTitleDisplayMode={'inline'}
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />,
        }}
        scrollDismissesKeyboard={'immediately'}
      >
        <Button
          title="下载图片"
          action={async () => {
            try {
              const resp = await fetch(data.img)
              if (!resp.ok) throw new Error(`respError:${resp.status}:${resp.statusText}`)
              const resp_data = await resp.data()
              const result = await Photos.savePhoto(resp_data)
              if (!result) throw new Error('保存图片失败')
              await Dialog.alert({ title: '保存图片成功', message: '已保存到相册' })
            } catch (e) {
              await Dialog.alert({ title: '保存图片失败', message: String(e) })
            }
          }}
        />
        <Button
          title="下载视频"
          action={async () => {
            if (!data.videos) return
            try {
              const extname = Path.extname(data.videos[0]).split('?')[0]
              const filePath = Path.join(FileManager.temporaryDirectory, Date.now() + extname)
              const resp = await fetch(data.videos[0])
              if (!resp.ok) throw new Error(`respError:${resp.status}:${resp.statusText}`)
              const resp_data = await resp.data()
              await FileManager.writeAsData(filePath, resp_data)
              await QuickLook.previewURLs([filePath])
              await FileManager.remove(filePath)
            } catch (e) {
              await Dialog.alert({ title: '保存视频失败', message: String(e) })
            }
          }}
          disabled={data.videos === undefined || data.videos.length === 0}
        />
        <Image
          imageUrl={data.img + '@832w_1248h.webp'}
          placeholder={<Text>加载中...</Text>}
          scaleToFill
          resizable
        />
      </List>
    </NavigationStack>
  )
}
function PackageView({ type, id, name }: { type: SearchResult['type']; id: string; name: string }) {
  const [list, setList] = useState<CardData[]>([])
  const [errMsg, setErrMsg] = useState<string>()
  const dismiss = Navigation.useDismiss()
  useEffect(() => {
    const main = async () => {
      try {
        if (type === 'garb') {
          const result = await getGarbResult(id)
          setList(result)
        } else if (type === 'act') {
          const result = await getActResult(id)
          setList(result)
        } else {
          throw new Error('package type is error')
        }
      } catch (e) {
        console.error(e)
        setErrMsg(String(e))
      }
    }
    main()
  }, [])
  return (
    <NavigationStack>
      <List
        navigationTitle={name}
        navigationBarTitleDisplayMode={'inline'}
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />,
        }}
        scrollDismissesKeyboard={'immediately'}
      >
        {errMsg !== undefined && <Text>{errMsg}</Text>}
        {list.length > 0 && errMsg === undefined && (
          <LazyVGrid
            columns={[
              { size: { type: 'flexible', max: 'infinity' } },
              { size: { type: 'flexible', max: 'infinity' } },
              { size: { type: 'flexible', max: 'infinity' } },
            ]}
          >
            {list.map((v) => (
              <Button
                action={() => {
                  Navigation.present({
                    element: <ImageView data={v} />,
                  })
                }}
                buttonStyle="plain"
              >
                <Image
                  imageUrl={v.img + '@416w_624h.webp'}
                  placeholder={<Text>加载中...</Text>}
                  scaleToFill
                  resizable
                />
              </Button>
            ))}
          </LazyVGrid>
        )}
      </List>
    </NavigationStack>
  )
}
function View() {
  const [kw, setKw] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult[]>([])
  const [hasMoreResult, setHasMoreResult] = useState(false)
  const [errMsg, setErrMsg] = useState<string>()
  const dismiss = Navigation.useDismiss()
  let pn = 1
  return (
    <NavigationStack>
      <List
        navigationTitle="主页"
        navigationBarTitleDisplayMode={'inline'}
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />,
        }}
        scrollDismissesKeyboard={'immediately'}
        searchable={{
          value: kw,
          onChanged: setKw,
          placement: 'navigationBarDrawer',
          prompt: '装扮名称',
          presented: {
            value: showSearch,
            onChanged: (v) => {
              if (v === false) {
                setKw('')
                setSearchResult([])
                setHasMoreResult(false)
                setErrMsg(undefined)
              }
              setShowSearch(v)
            },
          },
        }}
      >
        {showSearch && (
          <Button
            title="搜索"
            action={async () => {
              const i = kw.trim()
              if (i === '') return
              try {
                setErrMsg(undefined)
                pn = 1
                const result = await getSearchResult(i, pn)
                setSearchResult(result.list)
                setHasMoreResult(result.hasMore)
              } catch (e) {
                console.error(e)
                setErrMsg(String(e))
              }
            }}
          />
        )}
        {errMsg !== undefined && <Text>{errMsg}</Text>}
        {searchResult.length > 0 && errMsg === undefined && (
          <LazyVGrid
            columns={[
              { size: { type: 'flexible', max: 'infinity' } },
              { size: { type: 'flexible', max: 'infinity' } },
            ]}
          >
            {searchResult.map((v) =>
              v.cover ? (
                <VStack>
                  <Button
                    action={() => {
                      Navigation.present({
                        element: <PackageView type={v.type} id={v.id} name={v.name} />,
                      })
                    }}
                    buttonStyle="plain"
                  >
                    <Image
                      imageUrl={v.cover + '@416w_624h.webp'}
                      placeholder={<Text>加载中...</Text>}
                      scaleToFill
                      resizable
                    />
                  </Button>
                  <Text font={{ name: 'subheadline', size: 14 }} lineLimit={1}>
                    {v.name}
                  </Text>
                </VStack>
              ) : undefined,
            )}
          </LazyVGrid>
        )}
        {hasMoreResult && (
          <Button
            title="更多"
            action={async () => {
              const i = kw.trim()
              if (i === '') return
              try {
                setErrMsg(undefined)
                pn++
                const result = await getSearchResult(i, pn)
                setSearchResult((pre) => [...pre, ...result.list])
                setHasMoreResult(result.hasMore)
              } catch (e) {
                console.error(e)
                setErrMsg(String(e))
              }
            }}
          />
        )}
      </List>
    </NavigationStack>
  )
}

async function run() {
  await Navigation.present({
    element: <View />,
  })

  Script.exit()
}
run()
