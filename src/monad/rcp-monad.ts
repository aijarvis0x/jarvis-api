import { ethers } from "ethers";
import { MintNftABI } from "./abi/mint-nft.abi.js";
const MONAD_RPC = process.env.CHAIN_NETWORK == "mainnet" ? "https://rpc.monad.xyz" : "https://testnet-rpc.monad.xyz";
const MONAD_CHAIN_ID = process.env.CHAIN_NETWORK == "mainnet" ? 0 : 10143
const NETWORK_NAME = "Monad Testnet";

export const monadProvider = new ethers.JsonRpcProvider(
    MONAD_RPC,
    {
        chainId: MONAD_CHAIN_ID,
        name: NETWORK_NAME,
    }
);

export const MintNftContract = new ethers.Contract(
    String(process.env.NFT_CONTRACT_ADDRESS),
    MintNftABI,
    monadProvider

)

export function getTransactionUrl(txHash: string): string {
    return `https://testnet.monadexplorer.com/tx/${txHash}`;
}

export function getAddressUrl(address: string): string {
    return `https://testnet.monadexplorer.com/address/${address}`;
}
