import {
  useState,
  useEffect,
  NavigationStack,
  ScrollView,
  Text,
  LazyVGrid,
  Image,
  NavigationLink,
} from 'scripting'
import { CardData, getActResult, getGarbResult, SearchResult } from '../utils/api'
import { ImageView } from './ImageView'

export function PackageView({
  type,
  id,
  name,
}: {
  type: SearchResult['type']
  id: string
  name: string
}) {
  const [list, setList] = useState<CardData[]>([])
  const [errMsg, setErrMsg] = useState<string>()
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
      <ScrollView
        navigationTitle={name}
        navigationBarTitleDisplayMode={'inline'}
        // toolbar={{
        //   navigation: <Button systemImage="chevron.left" title="返回" action={dismiss} />,
        // }}
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
            padding={10}
          >
            {list.map((v) => (
              <NavigationLink destination={<ImageView data={v} />}>
                <Image
                  imageUrl={v.img + '@416w_624h.webp'}
                  placeholder={<Text>加载中...</Text>}
                  scaleToFill
                  resizable
                />
              </NavigationLink>
            ))}
          </LazyVGrid>
        )}
      </ScrollView>
    </NavigationStack>
  )
}
