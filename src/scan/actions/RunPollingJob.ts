import { performance } from "node:perf_hooks"
import { setTimeout } from "node:timers/promises"
import type winston from "winston"
import type { StatRepository } from "../repositories/index.js"

export type Handler = (items: any[]) => Promise<any>

const DEFAULT_INTERVAL = 3000

export abstract class RunPollingJob {
  private readonly interval: number
  private readonly id: string
  private statRepo?: StatRepository
  private running = false
  private paused = false
  protected abstract logger: winston.Logger

  protected abstract preHook(): Promise<void>

  protected abstract hasNext(): Promise<boolean>

  protected abstract report(): void

  protected abstract get(): Promise<any[]>

  protected abstract persist(): Promise<void>

  protected constructor(
    id: string,
    statRepo?: StatRepository,
    interval: number = DEFAULT_INTERVAL
  ) {
    this.id = id
    this.statRepo = statRepo
    this.interval = interval
    this.running = true
  }

  public async run(handlers: Handler[]): Promise<void> {
    this.logger.info("[run] Starting polling job")
    await this.preHook()

    while (this.running) {
      if (!(await this.hasNext())) {
        this.logger.info("[run] Finished processing")
        await this.stop()
        break
      }

      if (this.paused) {
        this.logger.info("[run] Paused, waiting for resume...")
        await setTimeout(this.interval)
        continue
      }

      let items: any[]

      try {
        this.report()
        const jobStartTime = performance.now()

        items = await this.get()
        await Promise.all(handlers.map((handler) => handler(items)))

        const jobEndTime = performance.now()
        const jobExecutionTime = Number(
          ((jobEndTime - jobStartTime) / 1000).toFixed(2)
        )

        this.statRepo?.measure("job_execution_time", jobExecutionTime, {
          job: this.id,
        })

        this.statRepo?.count("job_items_total", { id: this.id }, items.length)
      } catch (e: any) {
        console.error(e)

        if (e.toString().includes("No healthy providers")) {
          this.statRepo?.count("job_runs_no_healthy_total", {
            id: this.id,
            status: "error",
          })
          throw new Error(`[run] No healthy providers, job: ${this.id}`)
        }

        this.logger.error("[run] Error processing items", e)
        this.statRepo?.count("job_runs_total", { id: this.id, status: "error" })

        await setTimeout(this.interval)
        continue
      }

      await this.persist()
      this.statRepo?.count("job_runs_total", { id: this.id, status: "success" })
      await setTimeout(this.interval)
    }
  }

  public async stop(): Promise<void> {
    this.running = false
    this.statRepo?.count("job_runs_stopped", { id: this.id })
  }

  public async pause(): Promise<void> {
    this.paused = true
    this.statRepo?.count("job_runs_paused", { id: this.id })
  }

  public async resume(): Promise<void> {
    this.paused = false
    this.statRepo?.count("job_runs_resumed", { id: this.id })
  }
}
