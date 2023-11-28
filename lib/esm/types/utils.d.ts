export declare function formatFontFamily(input: string): string;
export declare function unicodeToSubset(unicodes: any): string;
export declare const generateFontSubsetName: (fontFileName: string, index: number) => string;
export declare function createUnicodeRange(list: number[]): string[];
export declare const formatMap: {
    ttf: string;
    otf: string;
    svg: string;
    eot: string;
    woff: string;
    woff2: string;
};
export declare function generateCss({ name, fontFamily, fontWeight, fontStyle, fontDisplay, formats, unicodeRange, fontName, }: {
    name: any;
    fontFamily: any;
    fontWeight: any;
    fontStyle: any;
    fontDisplay: any;
    formats: any;
    unicodeRange: any;
    fontName: any;
}): string;
//# sourceMappingURL=utils.d.ts.map