import type { TransformElement, TransformMessage } from './types';
export declare function readImageUrl(element: TransformElement | undefined | null): string | undefined;
export declare function readTextContent(message: TransformMessage | undefined | null): string;
export declare function toTextElement(element: TransformElement, text: string): boolean;
export declare function isCharacterFlow(message: TransformMessage | undefined | null): boolean;
//# sourceMappingURL=elements.d.ts.map