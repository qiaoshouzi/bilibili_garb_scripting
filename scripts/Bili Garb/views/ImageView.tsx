import {
  Path,
  Text,
  fetch,
  Image,
  Button,
  HStack,
  useState,
  ScrollView,
  NavigationStack,
  useMemo,
  useEffect,
  VStack,
  VideoPlayer,
  Picker,
} from 'scripting'
import { CardData } from '../utils/api'
import { LoadingSpinner } from '../components/LoadingSpinner'

function Video({ url }: { url: string }) {
  const [errMsg, setErrMsg] = useState<string>()

  const player = useMemo(() => {
    const player = new AVPlayer()
    player.setSource(url)
    // player.onTimeControlStatusChanged = setStatus
    player.onReadyToPlay = () => player.play()
    player.numberOfLoops = -1
    player.onError = (e) => setErrMsg(e)
    SharedAudioSession.setActive(true)
    SharedAudioSession.setCategory('playback', ['mixWithOthers'])
    return player
  }, [])

  useEffect(() => {
    return () => {
      player.dispose()
    }
  }, [])

  return (
    <VStack>
      {errMsg !== undefined && <Text>{errMsg}</Text>}
      <VideoPlayer player={player} scaleToFill />
    </VStack>
  )
}

export function ImageView({ name, data }: { name: string; data: CardData }) {
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)
  return (
    <NavigationStack>
      <ScrollView
        navigationTitle={data.name === 'img' ? name : data.name}
        navigationBarTitleDisplayMode={'inline'}
        // toolbar={{
        //   navigation: <Button systemImage="chevron.left" title="返回" action={dismiss} />,
        // }}
        scrollDismissesKeyboard={'immediately'}
      >
        <HStack>
          <Button
            buttonStyle="glassProminent"
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
            buttonStyle="glassProminent"
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
                const result = await Photos.saveVideo(filePath)
                if (!result) throw new Error(`保存视频失败: result false`)
                try {
                  if (filePath) await FileManager.remove(filePath)
                } catch {}
                await Dialog.alert({ title: '保存视频成功', message: '已保存到相册' })
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
        {data.videos !== undefined && (
          <HStack
            padding={{
              horizontal: 10,
            }}
          >
            <Picker
              title="Showcase Type"
              value={tabIndex}
              onChanged={setTabIndex}
              pickerStyle="segmented"
              glassEffect
            >
              <Text tag={0}>图片</Text>
              <Text tag={1}>视频</Text>
            </Picker>
          </HStack>
        )}
        {tabIndex === 0 && (
          <Image
            imageUrl={data.img + '@832w_1248h.webp'}
            placeholder={<Text>加载中...</Text>}
            scaleToFill
            resizable
            padding={{
              horizontal: 10,
            }}
          />
        )}
        {tabIndex === 1 && data.videos && <Video url={data.videos[0]} />}
      </ScrollView>
    </NavigationStack>
  )
}
