import {
  GeometryReader,
  Image,
  LazyVGrid,
  NavigationLink,
  NavigationStack,
  ScrollView,
  Text,
} from 'scripting'
import { ItemData } from '../utils/api'
import { ImageView, Video } from './ImageView'
import { getGridItem } from '../utils'

export function ItemView({ data }: { data: ItemData }) {
  return (
    <GeometryReader>
      {(proxy) => (
        <NavigationStack>
          <ScrollView
            navigationTitle={data.name}
            navigationBarTitleDisplayMode={'inline'}
            // toolbar={{
            //   navigation: <Button systemImage="chevron.left" title="返回" action={dismiss} />,
            // }}
            scrollDismissesKeyboard={'immediately'}
          >
            <LazyVGrid
              columns={getGridItem(proxy.size.width, 3, [
                [2700, 10],
                [2400, 9],
                [2100, 8],
                [1800, 7],
                [1500, 6],
                [1200, 5],
                [900, 4],
              ])}
              padding={10}
            >
              {data.data.map((v) => (
                <NavigationLink destination={<ImageView name={v.name || data.name} data={v} />}>
                  {v.img ? (
                    <Image
                      imageUrl={v.img + '@416w_624h.webp'}
                      placeholder={<Text>加载中...</Text>}
                      scaleToFit
                      resizable
                    />
                  ) : v.videos ? (
                    <Video url={v.videos[0]} showcase={true} />
                  ) : (
                    <Text>加载中...</Text>
                  )}
                </NavigationLink>
              ))}
            </LazyVGrid>
          </ScrollView>
        </NavigationStack>
      )}
    </GeometryReader>
  )
}
