import { Button, Divider, Menu, Navigation } from 'scripting'
import { LoginView } from '../views/LoginView'

export default function MenuButton({
  logged,
  setLogged,
}: {
  logged?: boolean
  setLogged?: (v: boolean) => any
}) {
  return (
    <Menu title="更多">
      <Button title="前往官网" action={() => Safari.present('https://b23.cfm.moe', false)} />
      <Divider />
      <Button
        title={logged ? '退出登陆' : '登陆'}
        role={logged ? 'destructive' : 'confirm'}
        action={async () => {
          if (logged) {
            const index = await Dialog.actionSheet({
              title: '退出登陆',
              message: '确定要退出登陆吗？',
              cancelButton: false,
              actions: [{ label: '取消' }, { label: '退出登陆', destructive: true }],
            })
            if (index === 1) {
              Keychain.remove('bili_cookie_secret')
              setLogged?.(false)
            }
          } else
            Navigation.present({
              element: <LoginView setLogged={setLogged} />,
            })
        }}
      />
    </Menu>
  )
}
