import {
  Text,
  Image,
  VStack,
  Script,
  Button,
  GridItem,
  useState,
  LazyVGrid,
  ScrollView,
  Navigation,
  NavigationStack,
  GeometryReader,
  NavigationLink,
  useCallback,
} from 'scripting'
import { SearchResult, getSearchResult } from './utils/api'
import { PackageView } from './views/PageView'

function View() {
  const [kw, setKw] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult[]>([])
  const [hasMoreResult, setHasMoreResult] = useState(false)
  const [errMsg, setErrMsg] = useState<string>()
  const [pn, setPn] = useState(1)
  const dismiss = Navigation.useDismiss()
  const getLength = (w: number) => {
    const breakpoints = [
      [900, 4],
      [500, 3],
    ]
    for (const [minWidth, value] of breakpoints) {
      if (w >= minWidth) return value
    }
    return 2
  }
  const handleSearch = useCallback(
    async (isNew = false) => {
      const i = kw.trim()
      if (i === '') return
      try {
        setErrMsg(undefined)
        const nextPn = isNew ? 1 : pn + 1
        const result = await getSearchResult(i, nextPn)
        setPn(nextPn)
        setSearchResult((pre) => [...(isNew ? [] : pre), ...result.list])
        setHasMoreResult(result.hasMore)
      } catch (e) {
        console.error(e)
        setErrMsg(String(e))
      }
    },
    [kw],
  )
  return (
    <GeometryReader>
      {(proxy) => {
        return (
          <NavigationStack>
            <ScrollView
              navigationTitle="哔哩装扮"
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
              onSubmit={{
                triggers: 'search',
                action: () => handleSearch(true),
              }}
            >
              {errMsg !== undefined && <Text>{errMsg}</Text>}
              {searchResult.length > 0 && errMsg === undefined && (
                <LazyVGrid
                  columns={Array.from<GridItem>({ length: getLength(proxy.size.width) }).fill({
                    size: { type: 'flexible', max: 'infinity' },
                  })}
                  padding={{
                    horizontal: 10,
                  }}
                  spacing={10}
                >
                  {searchResult.map((v) =>
                    v.cover ? (
                      <VStack>
                        <NavigationLink
                          destination={<PackageView type={v.type} id={v.id} name={v.name} />}
                        >
                          <Image
                            imageUrl={v.cover + '@416w_624h_1e_1c.webp'}
                            placeholder={<Text>加载中...</Text>}
                            scaleToFill
                            resizable
                          />
                        </NavigationLink>
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
                  title="加载更多"
                  systemImage="arrow.2.circlepath"
                  buttonStyle="glassProminent"
                  buttonBorderShape="capsule"
                  padding={{
                    bottom: 10,
                  }}
                  action={handleSearch}
                />
              )}
            </ScrollView>
          </NavigationStack>
        )
      }}
    </GeometryReader>
  )
}

async function run() {
  await Navigation.present({
    element: <View />,
  })

  Script.exit()
}
run()
