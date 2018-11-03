import qs from 'qs'

import { listenForNextMessageData } from './helpers.web'

const callbackURL = ''

function popupWindow(url: string, title: string, w: number, h: number) {
  const left = (window.screen.width - w) / 2
  const top = (window.screen.height - h) / 2
  return window.open(
    url,
    title,
    `resizable=yes, width=${w}, height=${h}, top=${top}, left=${left}`,
  )
}

export async function executeOAuth(serverURL: string, scopes: string[]) {
  const scopesStr = (scopes || []).join(' ')
  const querystring = qs.stringify({
    scope: scopesStr,
    callback_url: callbackURL,
    origin: window.location.origin || window.location.href,
  })

  // console.log('[OAUTH] Opening popup...')
  const popup = popupWindow(
    `${serverURL}/?${querystring}`,
    'Login with GitHub',
    500,
    600,
  )

  try {
    const data = await listenForNextMessageData(popup)
    // console.log('[OAUTH] Received data:', data)

    if (!(data && data.access_token)) {
      throw new Error('Login failed: No access token received.')
    }

    return data
  } catch (e) {
    if (popup) popup.close()
    throw e
  }
}
