import { Image, useState } from 'scripting'

export function LoadingSpinner() {
  const [test, setTest] = useState(0)
  return (
    <Image
      systemName="arrow.2.circlepath"
      rotationEffect={test}
      onAppear={() => {
        withAnimation(Animation.linear(1).repeatForever(false), () => {
          setTest(360)
        })
      }}
    />
  )
}
