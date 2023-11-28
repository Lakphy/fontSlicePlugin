import path from "path";
import { Font } from "fonteditor-core";
import unicodeRanges from "./google-font-unicode-range.json";
import Fontmin from "fontmin";
import bufferToVinyl from "buffer-to-vinyl";
import fs from "fs";

function helloWorld() {
  console.log("Hello World from this npm package");
}
export default helloWorld;

function formatFontFamily(input) {
  if (input.indexOf(" ") > -1) return `'${input}'`;
  return input;
}
function unicodeToSubset(unicodes) {
  if (Array.isArray(unicodes)) {
    return unicodes
      .map((code) => {
        return String.fromCharCode(parseInt(code));
      })
      .join("");
  }
  return String.fromCharCode(parseInt(unicodes));
}
const generateFontSubsetName = (fontFileName, index) =>
  `${fontFileName}.${index + 1}`;
function createUnicodeRange(list) {
  const result = [];
  const workflow = [];
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
const formatMap = {
  ttf: "truetype",
  otf: "opentype",
  svg: "svg",
  eot: "embedded-opentype",
  woff: "woff",
  woff2: "woff2",
};
function generateCss({
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
async function fontSlicer(content, basePath, fileName, tempDirectory) {
  console.log(
    `FontSlice: 正在处理字体，首次编译可能消耗3-10分钟，请耐心等待...`
  );
  console.log(`FontSlice: 正在编译字体===============>`, fileName);
  const extname = path.extname(fileName).slice(1);
  if (extname !== "ttf") return; // 只支持ttf
  const font = Font.create(content, { type: extname });
  const charMap = font.data.cmap;
  const filteredRanges = unicodeRanges
    .map(({ unicodes }) => {
      const result = [];
      for (let i = 0, len = unicodes.length; i < len; i++) {
        const code = parseInt(unicodes[i]);
        if (charMap[code]) {
          result.push(code);
        }
      }
      return result;
    })
    .filter((item) => item.length > 0);
  const { name: fontName } = path.parse(fileName);
  const outputFontFamily = formatFontFamily(fontName);
  const fontSubsetMap = Object.create(null);
  if (!fs.existsSync(path.join(basePath, `${fontName}`))) {
    fs.mkdirSync(path.join(basePath, `${fontName}`));
  }
  const cssList = await Promise.all(
    filteredRanges.map(async (range, index) => {
      const _fileName = generateFontSubsetName(fontName, index);
      fontSubsetMap[_fileName] = true;
      if (fs.existsSync(path.join(tempDirectory, `${_fileName}.woff2`))) {
        fs.copyFileSync(
          path.join(tempDirectory, `${_fileName}.woff2`),
          path.join(basePath, `${fontName}/${_fileName}.woff2`)
        );
        return generateCss({
          name: _fileName,
          fontFamily: outputFontFamily,
          fontWeight: "normal",
          fontStyle: "normal",
          fontDisplay: "swap",
          formats: ["woff2"],
          unicodeRange: createUnicodeRange(range),
          fontName,
        });
      }
      const fontmin = new Fontmin();
      fontmin.getFiles = () => {
        return bufferToVinyl.stream(content, _fileName);
      };
      // if (extname === 'otf') {
      //   fontmin.use(Fontmin.otf2ttf());
      // }
      fontmin.use(
        Fontmin.glyph({
          text: unicodeToSubset(range),
          hinting: false,
        })
      );
      fontmin.use(Fontmin.ttf2woff2());
      fontmin.dest(tempDirectory);
      await new Promise((resolve, reject) => {
        fontmin.run(function (err, files) {
          if (err) {
            reject(err);
          }
          const buffer = files[0].contents;
          if (!fs.existsSync(path.join(basePath, `${fontName}`))) {
            fs.mkdirSync(path.join(basePath, `${fontName}`));
          }
          fs.writeFileSync(
            path.join(basePath, `${fontName}/${_fileName}.woff2`),
            buffer
          );
          resolve();
        });
      });
      return generateCss({
        name: _fileName,
        fontFamily: outputFontFamily,
        fontWeight: "normal",
        fontStyle: "normal",
        fontDisplay: "swap",
        formats: ["woff2"],
        unicodeRange: createUnicodeRange(range),
        fontName,
      });
    })
  );
  const cssData = `/** generated by font-slice-loader */${cssList.join("\n")}`;
  fs.writeFileSync(path.join(basePath, `${fontName}-slice.css`), cssData);
  return content;
}

class FontSlicePlugin {
  constructor(options) {
    this.options = options || {
      fontDirectory: "public/web_fonts",
      assetsDirectory: ".next/static",
      tempDirectory: ".temp",
    };
  }
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "WebfontsBufferPlugin",
      async (compilation) => {
        compilation.hooks.processAssets.tapAsync(
          {
            name: "WebfontsBufferPlugin",
            stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            additionalAssets: true,
          },
          async (assets, callback) => {
            const fontDirectory =
              this.options.fontDirectory || "public/web_fonts";
            const assetsDirectory =
              this.options.assetsDirectory || ".next/static";
            const tempDirectory = this.options.tempDirectory || ".temp";

            const files = fs.readdirSync(fontDirectory);
            const success = await Promise.all(
              files.map(async (file) => {
                const filePath = path.join(fontDirectory, file);
                const fileContent = fs.readFileSync(filePath);
                const buffer = Buffer.from(fileContent);
                if (!fs.existsSync(assetsDirectory)) {
                  fs.mkdirSync(assetsDirectory);
                }
                if (!fs.existsSync(path.join(assetsDirectory, `font`))) {
                  fs.mkdirSync(path.join(assetsDirectory, `font`));
                }
                if (
                  !fs.existsSync(path.join(assetsDirectory, `font/${file}`))
                ) {
                  await fontSlicer(
                    buffer,
                    path.join(assetsDirectory, "font"),
                    file,
                    tempDirectory
                  );
                }
                fs.writeFileSync(
                  path.join(assetsDirectory, `font/${file}`),
                  buffer
                );
              })
            );
            callback();
          }
        );
      }
    );
  }
}
