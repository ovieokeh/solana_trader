export const createLogger =
  (id: string) =>
  (...args: any) => {
    console.info(`>>>>> [${id}]`, ...args)
  }
