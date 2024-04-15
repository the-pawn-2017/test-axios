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

