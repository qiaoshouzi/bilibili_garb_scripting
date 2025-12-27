import {
  Text,
  Image,
  VStack,
  Script,
  Button,
  useState,
  LazyVGrid,
  ScrollView,
  Navigation,
  NavigationStack,
} from 'scripting'
import { SearchResult, getSearchResult } from './utils/api'
import { PackageView } from './views/PageView'

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
      <ScrollView
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
            systemImage="magnifyingglass"
            buttonStyle="borderedProminent"
            buttonBorderShape="capsule"
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
            padding={10}
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
            title="加载更多"
            systemImage="arrow.2.circlepath"
            buttonStyle="borderedProminent"
            buttonBorderShape="capsule"
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
      </ScrollView>
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
