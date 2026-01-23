import {
  Button,
  GeometryReader,
  HStack,
  Image,
  LazyVGrid,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  Picker,
  Script,
  ScrollView,
  Text,
  VStack,
  useCallback,
  useState,
} from 'scripting'
import MenuButton from './components/MenuButton'
import { getGridItem } from './utils'
import { SearchResult, SearchUserResult, getSearchResult, getSearchUserResult } from './utils/api'
import { PackageView } from './views/PageView'

function SearchResultView({
  hasMoreResult,
  width,
  searchResult,
  handleSearch,
  errMsg,
  logged,
  setLogged,
  loading,
}: {
  hasMoreResult: boolean
  width: number
  searchResult: SearchResult[]
  handleSearch: (isNew?: boolean) => Promise<void>
  errMsg?: string
  logged: boolean
  setLogged: (v: boolean) => any
  loading?: boolean
}) {
  return (
    <ScrollView>
      {loading && searchResult.length === 0 && <Text>加载中~</Text>}
      {searchResult.length > 0 && errMsg === undefined && (
        <LazyVGrid
          columns={getGridItem(width)}
          padding={{
            horizontal: 10,
          }}
          spacing={10}
        >
          {searchResult.map((v) =>
            v.cover ? (
              <VStack>
                <NavigationLink
                  destination={
                    <PackageView
                      type={v.type}
                      id={v.id}
                      name={v.name}
                      logged={logged}
                      setLogged={setLogged}
                      width={width}
                    />
                  }
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
          title={loading ? '加载中~' : '加载更多'}
          systemImage="arrow.2.circlepath"
          buttonStyle="glassProminent"
          buttonBorderShape="capsule"
          padding={{ bottom: 10 }}
          action={handleSearch}
          disabled={loading}
        />
      )}
    </ScrollView>
  )
}

function SearchUserResultView({
  searchUserResult,
  hasMoreResult,
  handleSearch,
  errMsg,
  logged,
  setLogged,
  loading,
  width,
}: {
  searchUserResult: SearchUserResult[]
  hasMoreResult: boolean
  handleSearch: (isNew?: boolean) => Promise<void>
  errMsg?: string
  logged: boolean
  setLogged: (v: boolean) => any
  loading?: boolean
  width: number
}) {
  return (
    <List>
      {loading && searchUserResult.length === 0 && <Text>加载中~</Text>}
      {searchUserResult.length > 0 &&
        errMsg === undefined &&
        searchUserResult.map((v) => (
          <NavigationLink
            destination={
              <PackageView
                type="user"
                id={[String(v.mid), String(v.rid)]}
                name={v.username}
                logged={logged}
                setLogged={setLogged}
                width={width}
              />
            }
          >
            <HStack
              fixedSize={{ horizontal: false, vertical: true }}
              frame={{ maxHeight: 'infinity' }}
            >
              <Image
                imageUrl={v.avatar}
                scaleToFit={true}
                resizable
                aspectRatio={{ contentMode: 'fit' }}
                frame={{ height: 30, width: 30 }}
                placeholder={
                  <Image
                    systemName="person.crop.circle" // 使用 SF Symbol
                    resizable
                    scaleToFit
                  />
                }
              />
              <Text>{v.username}</Text>
            </HStack>
          </NavigationLink>
        ))}
      {hasMoreResult && (
        <HStack alignment="center">
          <Button
            title={loading ? '加载中~' : '加载更多'}
            systemImage="arrow.2.circlepath"
            // buttonStyle="borderless"
            action={handleSearch}
            disabled={loading}
          />
        </HStack>
      )}
    </List>
  )
}

function View() {
  const [kw, setKw] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult[]>([])
  const [searchUserResult, setSearchUserResult] = useState<SearchUserResult[]>([])
  const [hasMoreResult, setHasMoreResult] = useState(false)
  const [errMsg, setErrMsg] = useState<string>()
  const [pn, setPn] = useState(1)
  const [tabIndex, setTabIndex] = useState(0)
  const [logged, setLogged] = useState(Keychain.contains('bili_cookie_secret'))
  const [loading, setLoading] = useState(false)
  const dismiss = Navigation.useDismiss()
  const handleSearch = useCallback(
    async (isNew = false) => {
      const i = kw.trim()
      if (i === '') return
      try {
        setErrMsg(undefined)
        setLoading(true)
        const nextPn = isNew ? 1 : pn + 1
        if (tabIndex === 0) {
          if (isNew) {
            setSearchResult([])
            setHasMoreResult(false)
          }
          const result = await getSearchResult(i, nextPn)
          setSearchResult((pre) => [...(isNew ? [] : pre), ...result.list])
          setHasMoreResult(result.hasMore)
        } else if (tabIndex === 1) {
          if (isNew) {
            setSearchUserResult([])
            setHasMoreResult(false)
          }
          const result = await getSearchUserResult(i, nextPn)
          setSearchUserResult((pre) => [...(isNew ? [] : pre), ...result.list])
          setHasMoreResult(result.hasMore)
        }
        setPn(nextPn)
      } catch (e) {
        console.error(e)
        setErrMsg(String(e))
      } finally {
        setLoading(false)
      }
    },
    [kw, tabIndex, pn],
  )
  return (
    <GeometryReader>
      {(proxy) => {
        return (
          <NavigationStack>
            <VStack
              navigationTitle="哔哩装扮"
              navigationBarTitleDisplayMode={'inline'}
              toolbar={{
                confirmationAction: <MenuButton logged={logged} setLogged={setLogged} />,
                cancellationAction: <Button title="关闭" action={dismiss} />,
              }}
              scrollDismissesKeyboard={'immediately'}
              searchable={{
                value: kw,
                onChanged: setKw,
                placement: 'navigationBarDrawer',
                prompt: tabIndex === 0 ? '装扮名称' : '用户名/UID',
                presented: {
                  value: showSearch,
                  onChanged: (v) => {
                    if (v === false) {
                      setKw('')
                      setSearchResult([])
                      setSearchUserResult([])
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
              <HStack
                padding={{
                  horizontal: 10,
                }}
              >
                <Picker
                  title="Search Type"
                  value={tabIndex}
                  onChanged={(v: number) => {
                    setKw('')
                    setSearchResult([])
                    setSearchUserResult([])
                    setHasMoreResult(false)
                    setErrMsg(undefined)
                    setShowSearch(false)
                    setTabIndex(v)
                  }}
                  pickerStyle="segmented"
                  glassEffect
                >
                  <Text tag={0}>装扮&收藏集</Text>
                  <Text tag={1}>充电表情包</Text>
                </Picker>
              </HStack>
              {errMsg !== undefined && <Text>{errMsg}</Text>}
              {tabIndex === 0 && (
                <SearchResultView
                  width={proxy.size.width}
                  searchResult={searchResult}
                  hasMoreResult={hasMoreResult}
                  handleSearch={handleSearch}
                  errMsg={errMsg}
                  logged={logged}
                  setLogged={setLogged}
                  loading={loading}
                />
              )}
              {tabIndex === 1 && (
                <SearchUserResultView
                  searchUserResult={searchUserResult}
                  handleSearch={handleSearch}
                  hasMoreResult={hasMoreResult}
                  errMsg={errMsg}
                  logged={logged}
                  setLogged={setLogged}
                  loading={loading}
                  width={proxy.size.width}
                />
              )}
            </VStack>
          </NavigationStack>
        )
      }}
    </GeometryReader>
  )
}

async function run() {
  await Navigation.present({
    modalPresentationStyle: 'fullScreen',
    element: <View />,
  })

  Script.exit()
}
run()
