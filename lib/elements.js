"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readImageUrl = readImageUrl;
exports.readTextContent = readTextContent;
exports.toTextElement = toTextElement;
exports.isCharacterFlow = isCharacterFlow;
function readImageUrl(element) {
    const attrs = element?.attrs;
    if (!attrs)
        return undefined;
    const url = attrs.url ?? attrs.src ?? attrs.imageUrl;
    return typeof url === 'string' && url.length > 0 ? url : undefined;
}
function readTextContent(message) {
    const content = message?.content;
    if (typeof content === 'string')
        return content;
    if (!Array.isArray(content))
        return '';
    let text = '';
    for (const part of content) {
        if (part && part.type === 'text' && typeof part.text === 'string')
            text += part.text;
    }
    return text;
}
function toTextElement(element, text) {
    if (!element.attrs)
        element.attrs = {};
    element.type = 'text';
    element.attrs.content = text;
    return true;
}
function isCharacterFlow(message) {
    if (!message || typeof message !== 'object')
        return false;
    return !('conversationId' in message);
}
//# sourceMappingURL=elements.js.map