import { SuiClient, SuiHTTPTransport } from "@mysten/sui/client"
import {
  fallbackTransport,
  SuiChainId,
  suiTestnetChain,
  type SuiChain,
} from "../lib/sui.js"
import { configuration } from "./config.js"

const suiMainnetChain: SuiChain = {
  id: SuiChainId.MAINNET,
  rpcUrls: [
    "https://rpc-mainnet.suiscan.xyz",
    "https://sui-mainnet.blockvision.org/v1/2TLcmZvmco3xiuwMcHAVZqT9fJQ",
    "https://internal.suivision.xyz/mainnet/api",
    "https://sui-mainnet-endpoint.blockvision.org",
    "https://sui-rpc.publicnode.com",
    "https://fullnode.mainnet.sui.io", // Not support scan
    "https://wallet-rpc.mainnet.sui.io", // Not support scan
  ],
}

export const suiChainConfiguration: SuiChain =
  configuration.environment === "testnet" ? suiTestnetChain : suiMainnetChain

export const suiClient = new SuiClient({
  transport: fallbackTransport(
    ...suiChainConfiguration.rpcUrls.map(
      (url) =>
        new SuiHTTPTransport({
          url,
        })
    )
  ),
})
