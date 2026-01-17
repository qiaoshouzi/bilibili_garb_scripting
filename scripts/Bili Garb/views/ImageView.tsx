import {
  Button,
  fetch,
  HStack,
  Image,
  NavigationStack,
  Path,
  Picker,
  ScrollView,
  Text,
  useEffect,
  useMemo,
  useState,
  VideoPlayer,
  VStack,
} from 'scripting'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { CardData } from '../utils/api'

export function Video({ url, showcase }: { url: string; showcase?: boolean }) {
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
      <VideoPlayer
        player={player}
        scaleToFill={showcase !== true}
        scaleToFit={showcase === true}
        allowsHitTesting={false}
      />
    </VStack>
  )
}

export function ImageView({ name, data }: { name: string; data: CardData }) {
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false)
  const [tabIndex, setTabIndex] = useState(data.img ? 0 : 1)
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
        <HStack>
          <Button
            buttonStyle="glassProminent"
            buttonBorderShape="capsule"
            disabled={data.img === undefined || isDownloadingImage}
            action={async () => {
              if (!data.img) return
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
        {data.img !== undefined && data.videos !== undefined && (
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
        {tabIndex === 0 && data.img !== undefined && (
          <Image
            imageUrl={data.img}
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
