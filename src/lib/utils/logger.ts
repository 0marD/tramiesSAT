type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, mensaje: string, contexto: Record<string, unknown> | undefined): void {
  if (process.env.NODE_ENV === 'production') {
    const entrada = contexto
      ? { level, mensaje, contexto, timestamp: new Date().toISOString() }
      : { level, mensaje, timestamp: new Date().toISOString() }
    console[level](JSON.stringify(entrada))
  } else {
    const prefijos: Record<LogLevel, string> = { info: '🔵', warn: '🟡', error: '🔴' }
    console[level](`${prefijos[level]} [${mensaje}]`, contexto ?? '')
  }
}

export const logger = {
  info:  (mensaje: string, contexto?: Record<string, unknown>) => log('info', mensaje, contexto),
  warn:  (mensaje: string, contexto?: Record<string, unknown>) => log('warn', mensaje, contexto),
  error: (mensaje: string, contexto?: Record<string, unknown>) => log('error', mensaje, contexto),
}
