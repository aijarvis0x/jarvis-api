import {
  FlowProducer,
  Queue,
  Worker,
  type ConnectionOptions,
  type DefaultJobOptions,
  type FlowJob,
  type Job,
  type JobsOptions,
  type Processor,
  type QueueOptions,
  type WorkerOptions,
} from "bullmq"
import { logger } from "./logger.js"

export interface QueueJobOptions {
  id?: string
  priority?: number
  retries?: number
  delay?: number
}

export interface QueueCronJobOptions extends QueueJobOptions {
  repeat?: {
    every?: number
    pattern?: string
    limit?: number
  }
}

export type CreateFlowJobArgument<TName, TData = any> = {
  name: string
  queueName: TName
  data: TData
  options?: QueueJobOptions & {
    failParentOnFailure?: boolean
    ignoreDependencyOnFailure?: boolean
  }
}

export interface JobQueueInterface<
  TQueueName extends string,
  TData extends Record<TQueueName, unknown> = any,
  TQueueJob = { id: string; data: TData[TQueueName] },
> {
  register?(queueName: TQueueName, defaultJobOptions?: unknown): void

  work<K extends TQueueName>(
    queueName: K,
    handler: (job: TQueueJob | unknown) => Promise<void> | void,
    errorHandler?: (
      job: TQueueJob | unknown,
      error: Error
    ) => Promise<void> | void
  ): Promise<void>

  stop?(): Promise<void>

  add<K extends TQueueName>(
    queueName: TQueueName,
    jobName: string,
    data: TData[K],
    options?: QueueJobOptions
  ): Promise<void>

  addCron<K extends TQueueName>(
    queueName: K,
    jobName: string,
    data: TData[K],
    options?: QueueCronJobOptions
  ): Promise<void>

  removeCron(
    queueName: TQueueName,
    jobName: string,
    repeat?: QueueCronJobOptions["repeat"]
  ): Promise<void>
}

export type BullMQDriverOptions = Partial<QueueOptions>

export type ConnectionFactory = (name?: string) => ConnectionOptions

export class JobQueue<
  TQueueName extends string,
  TData extends Record<TQueueName, unknown> = any,
  TJob = Job<TData[TQueueName]>,
> implements JobQueueInterface<TQueueName, TData, TJob>
{
  public logger = logger.child({ module: "JobQueue" })
  private readonly jobPrefix: string

  private flowProducer: FlowProducer
  public readonly queueMap: Record<TQueueName, Queue> = {} as Record<
    TQueueName,
    Queue
  >
  public readonly workerMap: Record<TQueueName, Worker> = {} as Record<
    TQueueName,
    Worker
  >

  constructor(
    private readonly connectionFactory: ConnectionFactory,
    private readonly options?: BullMQDriverOptions
  ) {
    this.jobPrefix = options?.prefix || "bull-queue"

    this.flowProducer = new FlowProducer({
      prefix: this.jobPrefix,
      connection: this.connectionFactory("FlowProducer"),
    })

    this.flowProducer.on("error", (err) => {
      logger.error(err, "Error in flow producer")
    })
  }

  register(queueName: TQueueName, defaultJobOptions?: DefaultJobOptions): void {
    const queue = new Queue(queueName, {
      ...this.options,
      prefix: this.jobPrefix,
      connection: this.connectionFactory("Queue"),
      defaultJobOptions,
    })

    queue.on("error", (err) =>
      this.logger.error(err, "Error in job queue %s.", queueName)
    )

    // Remove deprecated priority keys
    queue
      .removeDeprecatedPriorityKey()
      .catch((err) =>
        this.logger.error(
          err,
          `Cannot remove bullmq deprecated priority keys of ${queueName}`
        )
      )

    this.queueMap[queueName] = queue
  }

  getWorker(queueName: TQueueName) {
    return this.workerMap[queueName]
  }

  async work<K extends TQueueName>(
    queueName: K,
    handler: (job: TJob) => Promise<void>,
    errorHandler?: (job: TJob, err: Error) => void,
    opts: Partial<WorkerOptions> = {}
  ) {
    const worker = new Worker(queueName, handler as Processor, {
      ...this.options,
      autorun: true,
      prefix: this.jobPrefix,
      connection: this.connectionFactory("Worker"),
      maxStalledCount: 10,
      ...opts,
    })

    worker.on("failed", (job, err) => {
      if (!job) return

      this.logger.warn(
        { payload: job.data, err },
        "Cannot execute job %s:%s in queue [%s], after [%d] attempts",
        job.name,
        job.id,
        queueName,
        job.attemptsMade
      )

      errorHandler?.(job as TJob, err)
    })

    worker.on("error", (err) => {
      this.logger.error(err, "Error in job worker %s.", queueName)
    })

    this.workerMap[queueName] = worker
  }

  async stop() {
    const queues = Object.values(this.queueMap) as Queue[]
    const workers = Object.values(this.workerMap) as Worker[]

    await Promise.all([
      ...queues.map((q) => q.close()),
      ...workers.map((w) => w.close(false)),
    ])
  }

  async pause(queueName: TQueueName) {
    await this.queueMap[queueName].pause()
  }

  async addCron<K extends TQueueName>(
    queueName: K,
    jobName: string,
    data: TData[K],
    options?: QueueCronJobOptions
  ): Promise<void> {
    if (!this.queueMap[queueName]) {
      throw new Error(
        `Queue ${queueName} is not registered, make sure you have added it as a queue provider`
      )
    }

    const queueOptions: JobsOptions = {
      jobId: options?.id,
      priority: options?.priority,
      repeat: options?.repeat,
      removeOnComplete: 100,
      removeOnFail: 500,
    }

    await this.queueMap[queueName].add(jobName, data, queueOptions)
  }

  async removeCron(
    queueName: TQueueName,
    jobName: string,
    repeat: QueueCronJobOptions["repeat"]
  ): Promise<void> {
    await this.queueMap[queueName].removeRepeatable(jobName, repeat!)
  }

  async add(
    queueName: TQueueName,
    jobName: string,
    data: TData[TQueueName],
    options?: QueueJobOptions
  ): Promise<void> {
    if (!this.queueMap[queueName]) {
      throw new Error(
        `Queue ${queueName} is not registered, make sure you have added it as a queue provider`
      )
    }

    await this.queueMap[queueName].add(jobName, data, {
      jobId: options?.id,
      ...this.buildQueueOptions(options),
    })
  }

  async addFlowJob(
    parent: CreateFlowJobArgument<TQueueName, TData[TQueueName]>,
    children: CreateFlowJobArgument<TQueueName, TData[TQueueName]>[]
  ) {
    if (!this.queueMap[parent.queueName]) {
      throw new Error(
        `Queue ${parent.queueName} is not registered, make sure you have added it as a queue provider`
      )
    }

    const buildJobFlowOptions = (
      job: CreateFlowJobArgument<string>
    ): FlowJob => ({
      name: job.name,
      queueName: job.queueName,
      data: job.data,
      opts: {
        ...this.buildQueueOptions(job?.options ?? {}),
        failParentOnFailure: false,
        ignoreDependencyOnFailure: true,
      },
    })

    await this.flowProducer.add({
      ...buildJobFlowOptions(parent),
      children: children.map((child) => buildJobFlowOptions(child)),
    })
  }

  private buildQueueOptions(options?: QueueJobOptions): JobsOptions {
    return {
      priority: options?.priority,
      attempts: options?.retries ? 1 + options?.retries : undefined,
      delay: options?.delay,
      removeOnComplete: 1000,
      removeOnFail: 500,
      backoff: {
        delay: 3000,
        type: "exponential",
      },
    }
  }
}
