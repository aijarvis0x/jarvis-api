import { Redis } from "ioredis"

// Monkey patching BigInt serialization
if (!("toJSON" in BigInt.prototype)) {
  Object.defineProperty(BigInt.prototype, "toJSON", {
    get() {
      return () => String(this)
    },
  })
}

export interface MetadataStorage<Metadata> {
  get(id: string): Promise<Metadata | undefined>

  save(id: string, metadata: Metadata): Promise<void>
}

export class RedisMetadataStorage implements MetadataStorage<any> {
  constructor(
    private readonly client: Redis,
    private readonly chainId: string
  ) {}

  async get(id: string): Promise<any | undefined> {
    const metadata = await this.client.get(`${this.chainId}:${id}`)
    return metadata ? JSON.parse(metadata) : undefined
  }

  async save(id: string, metadata: any): Promise<void> {
    await this.client.set(`${this.chainId}:${id}`, JSON.stringify(metadata))
  }
}

export class InMemoryMetadataStorage implements MetadataStorage<any> {
  private readonly storage: Map<string, any> = new Map()

  async get(id: string): Promise<any | undefined> {
    return this.storage.get(id)
  }

  async save(id: string, metadata: any): Promise<void> {
    this.storage.set(id, metadata)
  }
}
