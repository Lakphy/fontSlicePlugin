import path from "path";
import { Font } from "fonteditor-core";
// @ts-ignore
import unicodeRanges from "./google-font-unicode-range.json";
import Fontmin from "fontmin";
// @ts-ignore
import bufferToVinyl from "buffer-to-vinyl";
import fs from "fs";
import { createUnicodeRange, formatFontFamily, generateCss, generateFontSubsetName, unicodeToSubset, } from "./utils";
async function fontSlicer(content, basePath, fileName, tempDirectory) {
    console.log(`FontSlice: 正在处理字体，首次编译可能消耗3-10分钟，请耐心等待...`);
    console.log(`FontSlice: 正在编译字体===============>`, fileName);
    const extname = path.extname(fileName).slice(1);
    if (extname !== "ttf")
        return; // 只支持ttf
    const font = Font.create(content, { type: extname });
    // @ts-ignore
    const charMap = font.data.cmap;
    const filteredRanges = unicodeRanges
        .map((item) => {
        const { unicodes, subset } = item;
        const result = [];
        for (let i = 0, len = unicodes.length; i < len; i++) {
            const code = Number(unicodes[i]);
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
    const cssList = await Promise.all(filteredRanges.map(async (range, index) => {
        const _fileName = generateFontSubsetName(fontName, index);
        fontSubsetMap[_fileName] = true;
        if (fs.existsSync(path.join(tempDirectory, `${_fileName}.woff2`))) {
            fs.copyFileSync(path.join(tempDirectory, `${_fileName}.woff2`), path.join(basePath, `${fontName}/${_fileName}.woff2`));
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
        // @ts-ignore
        fontmin.getFiles = () => {
            return bufferToVinyl.stream(content, _fileName);
        };
        // if (extname === 'otf') {
        //   fontmin.use(Fontmin.otf2ttf());
        // }
        fontmin.use(Fontmin.glyph({
            text: unicodeToSubset(range),
            hinting: false,
        }));
        fontmin.use(Fontmin.ttf2woff2());
        fontmin.dest(tempDirectory);
        await new Promise((resolve, reject) => {
            fontmin.run(function (err, files) {
                if (err) {
                    reject(err);
                }
                // @ts-ignore
                const buffer = files[0].contents;
                if (!fs.existsSync(path.join(basePath, `${fontName}`))) {
                    fs.mkdirSync(path.join(basePath, `${fontName}`));
                }
                fs.writeFileSync(path.join(basePath, `${fontName}/${_fileName}.woff2`), buffer);
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
    }));
    const cssData = `/** generated by font-slice-loader */${cssList.join("\n")}`;
    fs.writeFileSync(path.join(basePath, `${fontName}-slice.css`), cssData);
    return content;
}
export default fontSlicer;