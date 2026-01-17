import { Image, LazyVGrid, NavigationLink, NavigationStack, ScrollView, Text } from 'scripting'
import { ItemData } from '../utils/api'
import { ImageView, Video } from './ImageView'

export function ItemView({ data }: { data: ItemData }) {
  return (
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
          columns={[
            { size: { type: 'flexible', max: 'infinity' } },
            { size: { type: 'flexible', max: 'infinity' } },
            { size: { type: 'flexible', max: 'infinity' } },
          ]}
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
  )
}
