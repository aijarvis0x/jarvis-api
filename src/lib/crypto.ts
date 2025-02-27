import AES from "crypto-js/aes.js"
import Utf8 from "crypto-js/enc-utf8.js"
import * as env from "../env.js"

export function decrypt(ciphertext: string): string {
  return AES.decrypt(ciphertext, env.ENCRYPTION_KEY).toString(Utf8)
}

export function encrypt(plaintext: string): string {
  return AES.encrypt(plaintext, env.ENCRYPTION_KEY).toString()
}
