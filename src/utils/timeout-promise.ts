export function timeoutPromise<T>(promise: Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout>

  return Promise.race([
    promise,
    new Promise((_res, rej) => {
      timer = setTimeout(() => rej(new Error("Timeout")), timeoutMs)
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>
}
