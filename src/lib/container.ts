import {
  asClass,
  asFunction,
  asValue,
  createContainer,
  InjectionMode,
} from "awilix"

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface ContainerRegistry {}

export type Container = typeof container

const container = createContainer<ContainerRegistry>({
  strict: true,
  injectionMode: InjectionMode.CLASSIC,
})

export { container, asFunction, asValue, asClass }
