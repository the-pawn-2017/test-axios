> 本文提到的方案，在[Vue + Axios全局接口防抖、节流封装实现，让你前端开发更高效 - 掘金 (juejin.cn)](https://juejin.cn/post/7225133152490160187?searchId=20240415153353ACCC2D92B1D2AC9ADD90)这篇文章上进行调整，主要区别是对`config`进行签名，防止同一url，不同参数无法正确请求。
原方案的想法相当不错，而且人家老哥也说了，要根据自己的实际情况做调整，那哥们就做一点调整。

> 目前不建议在您的生产环境中使用此方案，此方案还在我们团队内部进行试验，试好了我会把这一行删了

## 为什么调整
在我们团队的实际请求中，会多个同url的请求带上param参数，如`127.0.0.1/get?name=1`与`127.0.0.1/get?name=2`要同时发送，要是接上原方法的防抖与节流那不适用的。

## 调整了什么 
就是简单的追加MD5，及调用的方式改了一改，还有细节上做了调整，加了一点点ts类型的相关代码

## 代码，实现部分
### 配置
```typescript
import { AxiosInstance } from "axios";
import { MD5 } from "./md5";

// 防抖
function SetDebounce(axiosInstance: AxiosInstance,time:number) {
    const debounceTokenCancel = new Map<string,()=>void>()
    axiosInstance.interceptors.request.use(config => {
        const tokenKey =  MD5(JSON.stringify(config))  
        const cancel = debounceTokenCancel.get(tokenKey)
        if (cancel) {
            cancel()
        }
        return new Promise(resolve=>{
            // 定时器
            const timer = setTimeout(()=>{
                debounceTokenCancel.delete(tokenKey)
                resolve(config)
            }, time)
            // 设置取消方法
            debounceTokenCancel.set(tokenKey, ()=>{
                clearTimeout(timer)
                throw Error('防抖处理中，稍后再试')
            })
        })
    })
    return axiosInstance
}
// 节流
function SetThrottling(axiosInstance: AxiosInstance, time:number) {
    const throttlingTokenCancel = new Map<string,number>()
    axiosInstance.interceptors.request.use(config => {
        const nowTime = new Date().getTime()
        const tokenKey =  MD5(JSON.stringify(config))
        if (nowTime -  ( throttlingTokenCancel.get(tokenKey) ??  0 )   < time) {
            return Promise.reject(new Error('节流处理中，稍后再试'))
        } else {
            throttlingTokenCancel.set(tokenKey, nowTime)
        }
        return config
    })
    return axiosInstance
}

export {
    SetDebounce, SetThrottling
}
```

### 调用

```typescript
// 单个修改
SetThrottling(axios.create(),800).get("127.0.0.1:1323/t")
// 全局修改
SetThrottling(axios,800)
```

## github
[the-pawn-2017/test-axios: axios set debounce and throttling (github.com)](https://github.com/the-pawn-2017/test-axios)