const userAgent = navigator.userAgent || ''

// 版本号比较
export const semverCompare = (
  verionA: string,
  versionB: string
): -1 | 0 | 1 => {
  // eslint-disable-next-line no-restricted-properties
  const { isNaN } = window
  const splitA = verionA.split('.')
  const splitB = versionB.split('.')

  for (let i = 0; i < 3; i++) {
    const snippetA = Number(splitA[i])
    const snippetB = Number(splitB[i])

    if (snippetA > snippetB) return 1
    if (snippetB > snippetA) return -1

    // e.g. '1.0.0-rc' -- Number('0-rc') = NaN
    if (!isNaN(snippetA) && isNaN(snippetB)) return 1
    if (isNaN(snippetA) && !isNaN(snippetB)) return -1
  }

  return 0
}

// 版本判断
const common = (reg: RegExp, mark: string) => {
  const ua = userAgent.toLowerCase()
  const match = reg.exec(ua)
  const v = match?.[1].split(mark)[0]
  return v
}

export const getIosV = () => {
  const v = common(/os\s([\w_]+)/, '_')
  return Number(v)
}

export const getAndroidV = () => {
  const v = common(/android\s([\w.]+)/, '.')
  return Number(v)
}

/**
 * 获取 微信 版本号
 */
export const getWeChatVersion = (): string => {
  const version = navigator.appVersion.match(
    /micromessenger\/(\d+\.\d+\.\d+)/i
  ) as string[]
  return version[1]
}

export const isAndroid = /android/i.test(userAgent)

export const isIos = /iphone|ipad|ipod/i.test(userAgent)

export const isWechat = /micromessenger\/([\d.]+)/i.test(userAgent)

export const isWeibo = /(weibo).*weibo__([\d.]+)/i.test(userAgent)

export const isBaidu = /(baiduboxapp)\/([\d.]+)/i.test(userAgent)

export const isQQ = /qq\/([\d.]+)/i.test(userAgent)

export const isQQBrowser = /(qqbrowser)\/([\d.]+)/i.test(userAgent)

export const isQzone = /qzone\/.*_qz_([\d.]+)/i.test(userAgent)

// 安卓 chrome 浏览器，包含 原生chrome浏览器、三星自带浏览器、360浏览器以及早期国内厂商自带浏览器
export const isOriginalChrome =
  /chrome\/[\d.]+ mobile safari\/[\d.]+/i.test(userAgent) &&
  isAndroid &&
  userAgent.indexOf('Version') < 0

const browserType = (name: string) => {
  return userAgent.includes(name)
}

export function checkPlatform() {
  let container = 0

  const containerList = [
    {
      name: 'MicroMessenger',
      type: 1
    },
    {
      name: 'Twitterbot',
      type: 2
    },
    {
      name: 'FBAV',
      type: 3
    },
    {
      name: 'WhatsApp',
      type: 4
    },
    {
      name: 'LINE',
      type: 5
    }
  ]

  for (const i of containerList) {
    if (browserType(i.name)) {
      container = i.type
      return container
    }
  }
}
