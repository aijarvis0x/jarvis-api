import prometheus, { Registry } from "prom-client"
import type { StatRepository } from "./types.js"

export class PromStatRepository implements StatRepository {
  private readonly registry: prometheus.Registry

  private counters: Map<string, prometheus.Counter> = new Map()
  private gauges: Map<string, prometheus.Gauge> = new Map()

  constructor(registry?: prometheus.Registry) {
    const mergeMetrics = Registry.merge([new prometheus.Registry()])
    this.registry = registry ?? mergeMetrics
  }

  public report() {
    return this.registry.metrics()
  }

  public count(
    id: string,
    labels: Record<string, any>,
    increase?: number
  ): void {
    const counter = this.getCounter(id, labels)
    counter.inc(labels, increase)
  }

  public measure(id: string, value: bigint, labels: Record<string, any>): void {
    const gauge = this.getGauge(id, labels)
    gauge.set(labels, Number(value))
  }

  private getCounter(
    id: string,
    labels: Record<string, any>
  ): prometheus.Counter {
    // noinspection BadExpressionStatementJS
    this.counters.get(id) ??
      this.counters.set(
        id,
        new prometheus.Counter({
          name: id,
          help: id,
          registers: [this.registry],
          labelNames: Object.keys(labels),
        })
      )

    return this.counters.get(id) as prometheus.Counter
  }

  private getGauge(id: string, labels: Record<string, any>): prometheus.Gauge {
    // noinspection BadExpressionStatementJS
    this.gauges.get(id) ??
      this.gauges.set(
        id,
        new prometheus.Gauge({
          name: id,
          help: id,
          registers: [this.registry],
          labelNames: Object.keys(labels),
        })
      )

    return this.gauges.get(id) as prometheus.Gauge
  }
}
