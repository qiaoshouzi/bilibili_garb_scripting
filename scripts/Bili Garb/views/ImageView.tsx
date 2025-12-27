import {
  Path,
  Text,
  fetch,
  Image,
  Button,
  HStack,
  useState,
  Navigation,
  ScrollView,
  NavigationStack,
} from 'scripting'
import { CardData } from '../utils/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function ImageView({ data }: { data: CardData }) {
  const dismiss = Navigation.useDismiss()
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false)
  return (
    <NavigationStack>
      <ScrollView
        navigationTitle={data.name}
        navigationBarTitleDisplayMode={'inline'}
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />,
        }}
        scrollDismissesKeyboard={'immediately'}
      >
        <HStack>
          <Button
            buttonStyle="borderedProminent"
            buttonBorderShape="capsule"
            disabled={isDownloadingImage}
            action={async () => {
              setIsDownloadingImage(true)
              try {
                const resp = await fetch(data.img)
                if (!resp.ok) throw new Error(`respError:${resp.status}:${resp.statusText}`)
                const resp_data = await resp.data()
                const result = await Photos.savePhoto(resp_data)
                if (!result) throw new Error('保存图片失败')
                await Dialog.alert({ title: '保存图片成功', message: '已保存到相册' })
              } catch (e) {
                await Dialog.alert({ title: '保存图片失败', message: String(e) })
              } finally {
                setIsDownloadingImage(false)
              }
            }}
          >
            <HStack>
              {isDownloadingImage ? <LoadingSpinner /> : <Image systemName="arrow.down.circle" />}
              <Text>下载图片</Text>
            </HStack>
          </Button>
          <Button
            buttonStyle="borderedProminent"
            buttonBorderShape="capsule"
            disabled={data.videos === undefined || data.videos.length === 0 || isDownloadingVideo}
            action={async () => {
              if (!data.videos) return
              setIsDownloadingVideo(true)
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
              } finally {
                setIsDownloadingVideo(false)
              }
            }}
          >
            <HStack>
              {isDownloadingVideo ? <LoadingSpinner /> : <Image systemName="arrow.down.circle" />}
              <Text>下载视频</Text>
            </HStack>
          </Button>
        </HStack>
        <Image
          imageUrl={data.img + '@832w_1248h.webp'}
          placeholder={<Text>加载中...</Text>}
          scaleToFill
          resizable
          padding={10}
        />
      </ScrollView>
    </NavigationStack>
  )
}
