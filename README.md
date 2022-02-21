<!-- @format -->

# weakup

## 基本功能

通过 web 唤醒 App 并根据情况跳转到指定路径，传递指定参数。

页面状态：跳转成功保持当前页面，跳转失败打开 App 下载页或其他页面

## 使用姿势

准备中

# 唤醒相关知识

## 可以使用的几种唤醒链接

### Url Scheme

iOS 和 Android 都支持，只需 APP 开发时注册 Scheme

### Universal Link

iOS9 开始支持，基于 HTTPS 的唯一 URL 防止其他 App 注册 Scheme 对链接进行拦截，通过 apple-app-site-association 文件配置应用信息及可处理的 Universal Link。对比起以往所使用的 URL Scheme, 这种新特性在实现 web-app 的无缝链接时能够提供极佳的用户体验。

### AppLink

Android6.0 开始支持，通过 assetlinks.json 文件配置应用信息。
引导：一般 App（微信、微博、百度）和浏览器（UC、QQ）都会尽可能限制用户跳出减少流失，所以对 Scheme 和 Link 做了刻意限制或不进行支持。对应方案就是页面中引导用户出受限环境去浏览器，常见微信中让用户『右上角 → 浏览器中打开』，（iOS 微信已从 2019.7.16 发布的 7.0.5 版本支持 ulink）

### 链接格式

```js
scheme:  应用名://[path][?query]
link:    https://                与普通url一致 更加安全，
intent：`intent://share_link/code=${code}#Intent;scheme=${res.schema};package=com.zhihu;S.browser_fallback_url=${`https://a.smart321.com/${res.schema}`};end"`
share_link/code=${code}： 路径及参数
res.schema：schema的名称
com.zhihu：应用的包名称
https://a.smart321.com/${res.schema}：唤醒失败的跳转链接
```

## 各种链接的优缺点

#### Link

**优点**

唤醒失败：会将 Link 链接当作正常链接访问，可将该链接设置为服务地址，处理未唤醒后的业务逻辑，一般处理为重定向到 App 下载页面 唤醒成功：停在当前页面，或者设置定时器跳转到指定页面体验好唤醒无弹框一致性安卓与 ios 系统，可使用同一条唤醒链接，体验一致

**缺点**

与服务商交互 Link 唤醒会触发各自服务商的服务，服务商服务波动会影响唤醒几率。如安卓服务商谷歌的服务在中国是禁用的，故安卓的 AppLink 在国内的唤醒几率极低，除非你的客户开启 vpn（国内个人翻墙是犯法的哦～），除非你业务像我一样，大部分客户在国外，不受影响与后端交互需要公司后端或前端部署或新增服务，处理唤醒失败的逻辑。依赖服务的稳定性。如服务崩溃或未部署，页面会显示 404 版本限制 1、 Universal Link IOS9 以上，AppLink 安卓 6.0 以上。 2、UniversalLink：IOS < 13.0 有弹框，IOS >= 13.0 没有弹出框，直接打开应用

#### Scheme

**优点**

不受服务影响 Scheme 是通过 App 在本地的注册表中的链接比对进行唤醒的，不受服务的稳定性的影响。可以通过 Web Api 网页是否切换到后台判断是否唤醒。不受版本限制安卓、ios 通用切不受版本限制

**缺点**

体验差 Scheme 唤醒时会弹出弹框，询问是否打开 App，这在安卓设备上最为常见。如果用户点击不允许，大部分浏览器会记住选择，再点击唤醒时便默认不会唤醒 App

#### 共同的问题

- 网页端是无法获取到手机中是否安装该 App 的。对于 App 是否真正被唤醒，网页端是无法捕捉到的
- 在不同浏览器、不同容器、浏览器的不同版本中的表现情况不一致

## 实现唤醒并解决问题

### 无法捕捉是否安装、唤醒 App

一般使用 onpagehide、visibilitychange、webkitvisibilitychange 判断网页是否切换到后台，如果切换到后台，则认为 App 已经被打开。
点击唤醒链接 2 秒后，自动跳转到下载页面。如果页面隐藏了，则清除定时器，停留在当前页面。这个定时器的间隔时间要根据实际情况去控制，如果间隔时间大于 App 的启动时间，则 App 未被唤醒，就直接跳转到下载页面了。如果间隔时间过长，则会有明显的等待时间，然后跳转到下载页，用户体验不好。
说白了就是猜，根据唤醒 App 的时间猜，使其适应大部分场景，增加成功几率，无法达到 100%。
目前通过技术优化只能是多测试相应版本的浏览器的表现，维护一个精准的匹配库。

### 唤醒逻辑

唤醒：清除定时器，停在当前页面
未唤醒：跳转到下载页面

```js
// 页面隐藏时触发,清除定时器
window.onpagehide = function () {
  if (timeout) {
    clearTimeout(timeout);
  }
};

// 页面的可见状态变化时，会触发
const visibilitychange = function () {
  const tag = document.hidden || document.webkitHidden;
  if (tag && timeout) {
    clearTimeout(timeout);
  }
};

document.addEventListener('visibilitychange', visibilitychange, false);
// 兼容多的浏览器事件
document.addEventListener('webkitvisibilitychange', visibilitychange, false);
```

### 在不同浏览器、不同容器、浏览器的不同版本中的表现情况

在谷歌、Safari、夸克浏览器中

出现是否打开该应用的弹框，如果选择的不允许，并且记住操作。则下次打开该唤醒链接时，即使 App 存 在，也不会唤醒 App
在不同的版本版本中，出现有些版本可唤醒，有些唤醒不了

容器中对唤醒链接都是有限制的。

多数容器都会限制唤醒链接，以避免用户跳出应用，做用户留存
微信：7.0.3 版本以上，对 Link 的唤醒的限制放开，以前的版本是无法唤醒。有一种方法就是和他们合作或者购买三方公司的唤醒服务。
例：知乎在微信等容器中可以无障碍唤醒，这是与这些容器有合作，知乎的唤醒链接在容器的白名单中，唤醒无限制
所以我们在开发中需要做的就是区分: 移动端、浏览器端、容器（如微信、Facebook）、系统及版本、用户所在国区。根据不同场景调整唤醒链接、场景处理

### 唤醒方式

#### Iframe

```js
// 只在 Android 系统可用，IOS Safari 是不支持的，可以解决 Scheme 打开后404页面的问题
// 在 Iframe 中打开该链接，并且隐藏该错误页面
var _iframe = document.createElement('iframe');
_iframe.src = scheme;
_iframe.style.display = 'none';
document.body.appendChild(_iframe);
```

#### window.top.location.href

```js
window.top.location.href = url;
```

#### a 标签

```js
<a href="<scheme域名>://<path>">打开APP</a>
```

#### Intent

```js
// 在安卓手机的 Chrome 浏览器或者安卓手机浏览器上面，可以 Intent 方式唤醒
intent:
HOST/URI-path
#Intent;
  package=[string];             //  Android App包名
  action=[string];
  category=[string];
  component=[string];
  scheme=xxxx;                  // 协议头
  S.browser_fallback_url=[url]  // 可选，Scheme 启动客户端失败时的跳转页，一般为下载页，需编码
end;

<!--Intent方式呼端-->
<a href="intent://<role>/<path>#Intent;scheme=<scheme>;package=com.domain;S.browser_fallback_url=[url];end">打开APP</a>
```

#### 使用第三服务、包

- callapp-lib
- openinstall
- web-open-app
  友盟服务（付费）

这些包中的逻辑也是以上述的方法进行封装，不一样的是，它兼容的浏览器更加广泛，经过一定人数、一定次数和时间的检验，可以满足多数时候的需要。

第三方包往往满足不了业务的需求，大部分都是处理唤醒、唤醒失败之后的跳转。

例：如果在容器中，提示使用浏览器打开。这些可以通过自己的容器判断，确定是否弹出提示
这里我的处理方法是将 callapp-lib 修改，在失败的回调函数中处理业务，优化了传参，保留了唤醒方式和一部分的浏览器判断类型。IOS 与 Android 的 Link 链接一致，同时也是我们线上服务的域名，用于处理唤醒失败

可参考文章：

- [常用的唤醒 APP 的方式](https://haorooms.com/post/app_wakeup)
- [H5 唤起 APP 指南](https://suanmei.github.io/2018/08/23/h5_call_app/)
- [iOS 唤起 APP 之 Universal Link(通用链接)](https://www.cnblogs.com/guoshaobin/p/11164000.html)
- [安卓官网](https://developer.android.com/training/app-links)
