import {
  Button,
  HStack,
  List,
  Navigation,
  NavigationStack,
  Spacer,
  Text,
  useEffect,
  useState,
} from 'scripting'
import { sleep } from '../utils'
import { getLoginInfo, getLoginResult, LoginInfo } from '../utils/api'

type State = 'waiting' | 'waitingConfirm' | 'success' | 'expired' | 'logged'
const getStateText = (state?: State) => {
  switch (state) {
    case undefined:
      return '获取登陆信息中~'
    case 'waiting':
      return '等待打开APP'
    case 'waitingConfirm':
      return '等待确认'
    case 'success':
      return '登陆成功, 请关闭窗口'
    case 'expired':
      return '已过期'
    case 'logged':
      return '已登陆'
    default:
      return state
  }
}

export function LoginView({ setLogged }: { setLogged?: (state: boolean) => any }) {
  const [state, setState] = useState<State>()
  const [errMsg, setErrMsg] = useState<string>()
  const [loginInfo, setLoginInfo] = useState<LoginInfo>()
  const dismiss = Navigation.useDismiss()
  const jump = (url: string) => Safari.openURL('bilibili://browser/?url=' + encodeURIComponent(url))

  useEffect(() => {
    const main = async () => {
      setState(undefined)
      setErrMsg(undefined)
      setLoginInfo(undefined)
      if (Keychain.contains('bili_cookie_secret')) {
        setState('logged')
        setErrMsg('请先退出登陆当前账号')
        return
      }
      const loginInfo = await getLoginInfo()
      if (!loginInfo) {
        setErrMsg('获取登陆信息失败, 请查看日志, 或关闭后重新尝试')
        return
      }
      setLoginInfo(loginInfo)
      await jump(loginInfo.url)

      let errCount = 0
      let init = false
      while (errCount <= 2) {
        if (init) await sleep(1500)
        init = true
        const loginResult = await getLoginResult(loginInfo.key)
        if (!loginResult) {
          errCount++
          continue
        }
        errCount = 0
        if (loginResult.code === 86038) {
          setState('expired')
          setErrMsg('请关闭后重试')
          return
        } else if (loginResult.code === 86101) {
          setState('waiting')
          continue
        } else if (loginResult.code === 86090) {
          setState('waitingConfirm')
          continue
        } else if (loginResult.code === 0) {
          const result = Keychain.set('bili_cookie_secret', loginResult.cookie)
          if (!result) {
            setErrMsg('登陆成功, 但是保存登陆信息失败')
            return
          }
          setLogged?.(true)
          setState('success')
          return
        }
      }
      if (errCount > 0) setErrMsg('获取登陆状态失败, 请检查日志, 或关闭后重新尝试')
    }
    main()
  }, [])
  return (
    <NavigationStack>
      <List
        navigationTitle="登陆"
        navigationBarTitleDisplayMode={'inline'}
        toolbar={{
          cancellationAction: <Button title="关闭" action={dismiss} />,
        }}
      >
        <HStack>
          <Text>登陆状态</Text>
          <Spacer />
          <Text>{errMsg ? '出现错误' : getStateText(state)}</Text>
        </HStack>
        <HStack>
          <Text>错误信息</Text>
          <Spacer />
          <Text>{errMsg ?? '无错误'}</Text>
        </HStack>
        <Button
          title="跳转登陆"
          buttonStyle="borderless"
          disabled={
            !loginInfo ||
            errMsg !== undefined ||
            (state !== 'waitingConfirm' && state !== 'waiting')
          }
          action={() => loginInfo && jump(loginInfo.url)}
        />
      </List>
    </NavigationStack>
  )
}
