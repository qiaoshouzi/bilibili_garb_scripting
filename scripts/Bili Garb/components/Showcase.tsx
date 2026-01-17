import { Image, useState } from 'scripting'

export function Showcase({ type, url }: { type: 'video' | 'image'; url: string }) {
  const [test, setTest] = useState(0)
  if (type === 'image')
    return (
      <Image
        imageUrl={url + '@832w_1248h.webp'}
        scaleToFill
        resizable
        padding={{
          horizontal: 10,
        }}
      />
    )
  // return (
  //       {tabIndex === 0 && (
  //         <Image
  //           imageUrl={data.img + '@832w_1248h.webp'}
  //           placeholder={<Text>加载中...</Text>}
  //           scaleToFill
  //           resizable
  //           padding={{
  //             horizontal: 10,
  //           }}
  //         />
  //       )}
  //       {tabIndex === 1 && data.videos && <Video url={data.videos[0]} />}
  // )
}
