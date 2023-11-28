export function formatFontFamily(input: string) {
  if (input.indexOf(" ") > -1) return `'${input}'`;
  return input;
}
export function unicodeToSubset(unicodes: any) {
  if (Array.isArray(unicodes)) {
    return unicodes
      .map((code) => {
        return String.fromCharCode(parseInt(code));
      })
      .join("");
  }
  return String.fromCharCode(parseInt(unicodes));
}
export const generateFontSubsetName = (fontFileName: string, index: number) =>
  `${fontFileName}.${index + 1}`;
export function createUnicodeRange(list: number[]) {
  const result: string[] = [];
  const workflow: number[] = [];
  const doWork = () => {
    if (workflow.length === 0) return;
    if (workflow.length > 2) {
      const first = workflow[0];
      const last = workflow[workflow.length - 1];
      result.push(`U+${first.toString(16)}-${last.toString(16)}`);
      workflow.splice(0, workflow.length);
    }
    workflow.forEach((item) => {
      result.push(`U+${item.toString(16)}`);
    });
    workflow.splice(0, workflow.length);
    return;
  };
  for (let i = 0, len = list.length; i < len; i++) {
    const last = workflow[workflow.length - 1];
    if (list[i] !== last + 1) {
      doWork();
    }
    workflow.push(list[i]);
  }
  doWork();
  return result;
}
export const formatMap = {
  ttf: "truetype",
  otf: "opentype",
  svg: "svg",
  eot: "embedded-opentype",
  woff: "woff",
  woff2: "woff2",
};
export function generateCss({
  name,
  fontFamily,
  fontWeight,
  fontStyle,
  fontDisplay,
  formats,
  unicodeRange,
  fontName,
}) {
  const src = formats
    .map((format) => {
      const type = formatMap[format];
      if (!type) {
        console.warn("不支持的格式" + format);
        return "";
      }
      return `url("./${fontName}/${name}.${format}") format("${type}")`;
    })
    .filter(Boolean)
    .join(",\n");

  return `@font-face {
      font-family: ${fontFamily};
      src: ${src};
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      font-display: ${fontDisplay};
      unicode-range: ${unicodeRange};
    }`;
}
