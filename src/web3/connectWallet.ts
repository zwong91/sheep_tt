import { promises } from 'dns';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

declare global { // 声明全局变量
    interface Window { // 声明window全局变量
        ethereum: any; // 声明ethereum全局变量
    }
}

// Bsc网络ID
const Bsc_CHAIN_ID = '0x38';// BSC网络的链ID 64进制

// Bsc网络ID
const Bsc_CHAIN_ID_DECIMAL = '56';// BSC网络的链ID 10进制


// BNB合约地址
const ContractAddress = '0x55d398326f99059fF775485246999027B3197955';//BNB子代币USDT合约地址

// ERC20合约ABI（仅包含transfer函数）
const erc20Abi: AbiItem[] = [
    {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: '_to', type: 'address' },
            { name: '_value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
        ],
        name: 'transferFrom',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];


async function connectWallet() { // 连接钱包
    const { ethereum } = window; // 获取window.ethereum
    const web3 = new Web3(ethereum); // 初始化Web3

    if (!ethereum) { // 检查MetaMask是否已安装
        console.log('请安装MetaMask!')
        return;
    }
    // * 检查网络是否为BSC网络
    const chainId = await ethereum.request({ method: 'eth_chainId' }); // 获取网络ID
    if (chainId !== Bsc_CHAIN_ID) { // 检查当前网络是否为BSC网络
        console.log('添加BSC网络.....................')
        try { // 切换到BSC网络
            await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: Bsc_CHAIN_ID }] }); // 切换到BSC网络
        } catch (switchError: any) { // 捕获错误
            if (switchError.code === 4902) { // 如果错误码为4902，则尝试添加BSC网络
                try {
                    const res = await ethereum.request({
                        method: 'wallet_addEthereumChain', // 添加BSC网络
                        params: [
                            {
                                chainId: Bsc_CHAIN_ID, // BSC网络ID
                                chainName: 'Binance Smart Chain Mainnet', // BSC网络名称
                                nativeCurrency: {
                                    name: 'BNB', // BNB代币名称
                                    symbol: 'BNB', // BNB代币符号
                                    decimals: 18, // BNB代币精度
                                },
                                rpcUrls: [
                                    'https://bsc-dataseed.binance.org',
                                    'https://endpoints.omniatech.io/v1/matic/mainnet/public',
                                    'https://polygon-bor.publicnode.com',
                                    'https://polygon.llamarpc.com',
                                    'https://polygon.meowrpc.com',
                                    'https://polygon.meowrpc.com',
                                    'https://1rpc.io/matic',
                                ], // BSC网络RPC节点
                                blockExplorerUrls: [
                                    'https://bscscan.com',
                                ], // BSC网络区块浏览器
                            },
                        ],
                    });
                    console.log('添加成功.....................')
                } catch (addError) {
                    alert("添加网络失败! 为你跳转到chainlist.org，请手动添加Binance Smart Chain"); // 添加BSC网络失败
                    window.open('https://chainlist.org/chain/56', '_blank'); // 打开BSC网络添加页面
                    console.error('无法添加Binance Smart Chain:', addError); // 打印日志
                }
            } else {
                console.error('无法切换到Binance Smart Chain:', switchError); // 打印日志
            }
        }
    }


    const accounts = await ethereum.request({ method: 'eth_requestAccounts' }); // 获取账户

    const address = accounts[0]; // 获取账户地址

    const dataToSignfunc = async () => { // 请求MetaMask签名数据
        const cTimestamp = Math.floor(Date.now()).toString();
        const msg = '登录签名_7B_SWAP_' + cTimestamp; // 待签名的数据
        const sig = await web3.eth.personal.sign(msg, address, "");// 签名
        return { address, msg, sig }
    }

    // 转账
    const transferUSDT = async (recipient: string, amount: number, hashFC: (i: any) => void, verifyFC: () => void, errFC: () => void) => {
        // 检查MetaMask是否已安装
        if (!window.ethereum) {
            console.error('请先安装MetaMask插件');
            return;
        }
        try {
            // amount = 1
            const usdtContract = new web3.eth.Contract(erc20Abi, ContractAddress);
            const decimals = 18;
            // const amountInSmallestUnit = web3.utils.toBN(amount * Math.pow(10, decimals));
            // const amountInSmallestUnit = amount + "00000000000000000";
            const amountInSmallestUnit = amount + "000000000000000000";
            const gasPrice = await web3.eth.getGasPrice();

            const transaction = usdtContract.methods
                .transfer(recipient, amountInSmallestUnit.toString())
                .send({ from: address, gasPrice: gasPrice, gas: "0x" + BigInt(100000).toString(16), })

            transaction.on('transactionHash', function (hash: any) {
                hashFC(hash); // 回调函数，处理交易哈希
            });

            transaction.on('confirmation', function (confirmationNumber: any, receipt: any) {
                if (confirmationNumber === 8) {
                    // alert('成功');
                    verifyFC(); // 回调函数，处理交易确认
                }
            });

            // transaction.on('receipt', function (receipt) {
            //     if (receipt && receipt.status) {
            //         verifyFC(); // 回调函数，处理交易确认
            //         // 合约执行成功
            //         // contractExecutionSuccessful();
            //     } else {
            //         alert('USDT转账失败');
            //         // 合约执行失败
            //         // contractExecutionFailed();
            //     }
            // });

            transaction.on('error', function (error: any) {
                console.error('USDT转账失败', error);
                errFC();
                // alert('USDT转账失败');
            });
            // const transaction = usdtContract.methods
            //     .transfer(recipient, amountInSmallestUnit.toString())
            //     .send({ from: address, gasPrice: gasPrice })
            //     .on('transactionHash', function (hash: any) {
            //         hashFC(hash); // 回调函数
            //     })

            // // 监听转账等待打包事件
            // const transactionEvent = usdtContract.events.Transaction({ fromBlock: 'latest' });
            // transactionEvent.on('data', function (event: any) {
            //     buildFC(event); // 回调函数
            // });

            // // 监听转账广播事件
            // const broadcastEvent = usdtContract.events.Broadcast({ fromBlock: 'latest' });
            // broadcastEvent.on('data', function (event: any) {
            //     bcFC(event); // 回调函数
            // });

            // // 监听转账确认事件
            // const confirmationEvent = usdtContract.events.Confirmation({ fromBlock: 'latest' });
            // confirmationEvent.on('data', function (event: any) {
            //     verifyFC(event); // 回调函数
            //     console.log('确认事件：', event);
            // });
            // console.log('USDT转账成功', transaction);
            // // 取消事件监听
            // transactionEvent.removeAllListeners('data');
            // broadcastEvent.removeAllListeners('data');
            // confirmationEvent.removeAllListeners('data');
        } catch (error) {
            console.error('USDT转账失败', error);
        }
    };

    let balance = 0;// 账户余额
    let balanceChain = "0";
    try {
        const tokenContract = new web3.eth.Contract(erc20Abi, ContractAddress); // 初始化合约
        balance = await tokenContract.methods.balanceOf(address).call()  // 获取账户余额
    } catch (e) {

    }
    try {
        balanceChain = await web3.eth.getBalance(address);// 获取账户余额
    } catch (e) {

    }
    console.log('连接成功.....................')
    return { web3, address, balance, balanceChain, transferUSDT, dataToSignfunc }; // 返回web3、账户地址、账户余额、转账函数
}

export default connectWallet;
