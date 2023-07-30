// src/global.d.ts
export { };
declare global {
    interface Window {
        ethereum: any; // 全局变量名
        web3: any;
        Buffer: any;
    }
}