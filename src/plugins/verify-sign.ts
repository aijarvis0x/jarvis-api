import { ethers } from 'ethers';


export function verifySignature(message: string, signature: string, expectedAddress?: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if(recoveredAddress == expectedAddress) {
        return true
      }
      return false;
    } catch (error) {
      console.error("verifySignature failed:", error);
      return false
    }
  }