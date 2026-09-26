import type { Context } from 'koishi'
import { Bridge } from './bridge'
import { LOG_KEY, STARTUP_HINT } from './constants'
import { createSettings } from './settings'
import { Tracer } from './tracer'

export function apply(ctx: Context, raw: Record<string, any>) {
  const settings = createSettings(raw)
  const tracer = new Tracer(ctx, () => {
    const config = settings()
    return { debug: config.debug, traceKinds: config.traceKinds }
  })
  const bridge = new Bridge(ctx, settings, tracer)

  tracer.sync()
  if (settings().debug) tracer.write('hook', '调试日志已开启')

  ctx.inject(['chatluna'], () => {
    bridge.install()
    ctx.logger(LOG_KEY).info(STARTUP_HINT)
  })

  ctx.on('dispose', () => {
    bridge.uninstall()
  })
}
