"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readChatLuna = readChatLuna;
exports.readTransformer = readTransformer;
exports.supportsImageInput = supportsImageInput;
const constants_1 = require("./constants");
function readChatLuna(ctx) {
    const service = ctx.chatluna;
    return service && typeof service === 'object' ? service : undefined;
}
function readTransformer(ctx) {
    const transformer = readChatLuna(ctx)?.messageTransformer;
    if (!transformer || typeof transformer.intercept !== 'function')
        return undefined;
    return transformer;
}
function supportsImageInput(ctx, model) {
    if (!model || typeof model !== 'string')
        return false;
    const findModel = readChatLuna(ctx)?.platform?.findModel;
    if (typeof findModel !== 'function')
        return false;
    const capabilities = findModel(model)?.value?.capabilities;
    if (!Array.isArray(capabilities))
        return false;
    return capabilities.includes(constants_1.IMAGE_INPUT_CAPABILITY);
}
//# sourceMappingURL=chatluna.js.map