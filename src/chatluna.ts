import type { Context } from 'koishi'
import { IMAGE_INPUT_CAPABILITY } from './constants'
import type { ChatLunaLike, MessageTransformerLike } from './types'

export function readChatLuna(ctx: Context): ChatLunaLike | undefined {
  const service = (ctx as any).chatluna
  return service && typeof service === 'object' ? (service as ChatLunaLike) : undefined
}

export function readTransformer(ctx: Context): MessageTransformerLike | undefined {
  const transformer = readChatLuna(ctx)?.messageTransformer
  if (!transformer || typeof transformer.intercept !== 'function') return undefined
  return transformer
}

export function supportsImageInput(ctx: Context, model: unknown): boolean {
  if (!model || typeof model !== 'string') return false
  const findModel = readChatLuna(ctx)?.platform?.findModel
  if (typeof findModel !== 'function') return false
  const capabilities = findModel(model)?.value?.capabilities
  if (!Array.isArray(capabilities)) return false
  return capabilities.includes(IMAGE_INPUT_CAPABILITY)
}
