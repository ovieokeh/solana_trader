export const createLogger =
  (id: string) =>
  (...args: any) => {
    console.info(`[${new Date().toISOString()}] [${id}]`, ...args)
  }
