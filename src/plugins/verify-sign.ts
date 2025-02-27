import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

/**
 * Verifies a personal message signature.
 * @param message - The original message that was signed.
 * @param signature - The Base64-encoded signature to verify.
 * @param expectedAddress - (Optional) The expected Sui address of the signer.
 * @returns A boolean indicating whether the signature is valid.
 */
export const verifySignature = async (
    message: string,
    signature: string,
    expectedAddress?: string
): Promise<boolean> => {
    try {
        // Encode the message as a Uint8Array
        const messageBytes = new TextEncoder().encode(message);

        // Verify the signature
        const publicKey = await verifyPersonalMessageSignature(messageBytes, signature);

        // If an expected address is provided, verify it matches the signer's address
        if (expectedAddress && !publicKey.verifyAddress(expectedAddress)) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to verify signature:', error);
        return false;
    }
};
