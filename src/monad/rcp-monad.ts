import { Web3 } from 'web3';
import { MintNftABI } from './abi/mint-nft.abi.js';
import { MarketABI } from './abi/market.abi.js';

const MONAD_RPC = process.env.CHAIN_NETWORK === "mainnet" ? "https://rpc.monad.xyz" : "https://testnet-rpc.monad.xyz";
const NETWORK_NAME = "Monad Testnet";

// Khởi tạo Web3 instance bằng cách truyền trực tiếp RPC URL
export const web3 = new Web3(new Web3.providers.HttpProvider(MONAD_RPC));

// Tạo contract instance với ABI và địa chỉ contract
export const MintNftContract = new web3.eth.Contract(
    MintNftABI,
    String(process.env.NFT_CONTRACT_ADDRESS)
);

export const MarketContract = new web3.eth.Contract(
    MarketABI,
    String(process.env.MARKET_CONTRACT_ADDRESS)
);

// Hàm trả về URL của giao dịch
export function getTransactionUrl(txHash: string): string {
    return `https://testnet.monadexplorer.com/tx/${txHash}`;
}

// Hàm trả về URL của địa chỉ ví
export function getAddressUrl(address: string): string {
    return `https://testnet.monadexplorer.com/address/${address}`;
}
