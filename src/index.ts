import * as Browser from './browser';
import {
  evokeByLocation,
  evokeByTagA,
  evokeByIFrame,
  checkOpen,
} from './evoke';
import { CallappConfig, CallappOptions } from './types';
const container = Browser.checkPlatform();

class CallApp {
  private readonly options: CallappOptions & { timeout: number };

  // Create an instance of CallApp
  constructor(options: CallappOptions) {
    const defaultOptions = { timeout: 2000 };
    this.options = Object.assign(defaultOptions, options);
  }

  checkOpen(failure: () => void): void {
    const { logFunc, timeout } = this.options;

    return checkOpen(() => {
      if (typeof logFunc !== 'undefined') {
        logFunc('failure');
      }

      failure();
    }, timeout);
  }

  // 唤端失败跳转 app store
  fallToAppStore(): void {
    this.checkOpen(() => {
      evokeByLocation(this.options.appstore);
    });
  }

  // 唤端失败跳转通用(下载)页
  fallToFbUrl(): void {
    this.checkOpen(() => {
      evokeByLocation(this.options.fallback);
    });
  }

  // 唤端失败调用自定义回调函数
  fallToCustomCb(callback: () => void): void {
    this.checkOpen(() => {
      callback();
    });
  }

  /**
   * 唤起客户端
   * 根据不同 browser 执行不同唤端策略
   */
  open(config: CallappConfig): void {
    const { logFunc } = this.options;
    const { scheme, universalLink, appLink, intent, callback } = config;
    const supportUniversal = typeof universalLink !== 'undefined';

    if (typeof logFunc !== 'undefined') {
      logFunc('pending');
    }
    console.log(config);

    if (Browser.isIos) {
      // ios qq 禁止了 universalLink 唤起app，安卓不受影响 - 18年12月23日
      // ios qq 浏览器禁止了 universalLink - 19年5月1日
      // ios 微信自 7.0.5 版本放开了 Universal Link 的限制
      // ios 微博禁止了 universalLink
      if (
        (Browser.isWechat &&
          Browser.semverCompare(Browser.getWeChatVersion(), '7.0.5') === -1) ||
        Browser.isWeibo ||
        !supportUniversal ||
        Browser.isQQ ||
        Browser.isQQBrowser ||
        Browser.isQzone ||
        Browser.getIosV() < 9
      ) {
        evokeByTagA(scheme);
      } else {
        evokeByTagA(universalLink || scheme);
      }
      // Android
      // 国内的applink需要访问谷歌服务，受国家屏蔽外网影响。国内的link唤醒几率非常小。
    } else if (Browser.isAndroid) {
      if (container && container !== 1 && Browser.getAndroidV() >= 6) {
        evokeByLocation(appLink);
      } else {
        evokeByLocation(scheme);
      }
    }

    if (typeof callback !== 'undefined') {
      this.fallToCustomCb(callback);
    }
  }
}

export default CallApp;
