import type { TransformElement, TransformMessage } from './types'

export function readImageUrl(element: TransformElement | undefined | null): string | undefined {
  const attrs = element?.attrs
  if (!attrs) return undefined
  const url = attrs.url ?? attrs.src ?? attrs.imageUrl
  return typeof url === 'string' && url.length > 0 ? url : undefined
}

export function readTextContent(message: TransformMessage | undefined | null): string {
  const content = message?.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  let text = ''
  for (const part of content) {
    if (part && part.type === 'text' && typeof part.text === 'string') text += part.text
  }
  return text
}

export function toTextElement(element: TransformElement, text: string): boolean {
  if (!element.attrs) element.attrs = {}
  element.type = 'text'
  element.attrs.content = text
  return true
}

export function isCharacterFlow(message: TransformMessage | undefined | null): boolean {
  if (!message || typeof message !== 'object') return false
  return !('conversationId' in message)
}
