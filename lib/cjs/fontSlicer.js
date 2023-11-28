"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fonteditor_core_1 = require("fonteditor-core");
// @ts-ignore
const google_font_unicode_range_json_1 = __importDefault(require("./google-font-unicode-range.json"));
const fontmin_1 = __importDefault(require("fontmin"));
// @ts-ignore
const buffer_to_vinyl_1 = __importDefault(require("buffer-to-vinyl"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./utils");
function fontSlicer(content, basePath, fileName, tempDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`FontSlice: 正在处理字体，首次编译可能消耗3-10分钟，请耐心等待...`);
        console.log(`FontSlice: 正在编译字体===============>`, fileName);
        const extname = path_1.default.extname(fileName).slice(1);
        if (extname !== "ttf")
            return; // 只支持ttf
        const font = fonteditor_core_1.Font.create(content, { type: extname });
        // @ts-ignore
        const charMap = font.data.cmap;
        const filteredRanges = google_font_unicode_range_json_1.default
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
        const { name: fontName } = path_1.default.parse(fileName);
        const outputFontFamily = (0, utils_1.formatFontFamily)(fontName);
        const fontSubsetMap = Object.create(null);
        if (!fs_1.default.existsSync(path_1.default.join(basePath, `${fontName}`))) {
            fs_1.default.mkdirSync(path_1.default.join(basePath, `${fontName}`));
        }
        const cssList = yield Promise.all(filteredRanges.map((range, index) => __awaiter(this, void 0, void 0, function* () {
            const _fileName = (0, utils_1.generateFontSubsetName)(fontName, index);
            fontSubsetMap[_fileName] = true;
            if (fs_1.default.existsSync(path_1.default.join(tempDirectory, `${_fileName}.woff2`))) {
                fs_1.default.copyFileSync(path_1.default.join(tempDirectory, `${_fileName}.woff2`), path_1.default.join(basePath, `${fontName}/${_fileName}.woff2`));
                return (0, utils_1.generateCss)({
                    name: _fileName,
                    fontFamily: outputFontFamily,
                    fontWeight: "normal",
                    fontStyle: "normal",
                    fontDisplay: "swap",
                    formats: ["woff2"],
                    unicodeRange: (0, utils_1.createUnicodeRange)(range),
                    fontName,
                });
            }
            const fontmin = new fontmin_1.default();
            // @ts-ignore
            fontmin.getFiles = () => {
                return buffer_to_vinyl_1.default.stream(content, _fileName);
            };
            // if (extname === 'otf') {
            //   fontmin.use(Fontmin.otf2ttf());
            // }
            fontmin.use(fontmin_1.default.glyph({
                text: (0, utils_1.unicodeToSubset)(range),
                hinting: false,
            }));
            fontmin.use(fontmin_1.default.ttf2woff2());
            fontmin.dest(tempDirectory);
            yield new Promise((resolve, reject) => {
                fontmin.run(function (err, files) {
                    if (err) {
                        reject(err);
                    }
                    // @ts-ignore
                    const buffer = files[0].contents;
                    if (!fs_1.default.existsSync(path_1.default.join(basePath, `${fontName}`))) {
                        fs_1.default.mkdirSync(path_1.default.join(basePath, `${fontName}`));
                    }
                    fs_1.default.writeFileSync(path_1.default.join(basePath, `${fontName}/${_fileName}.woff2`), buffer);
                    resolve();
                });
            });
            return (0, utils_1.generateCss)({
                name: _fileName,
                fontFamily: outputFontFamily,
                fontWeight: "normal",
                fontStyle: "normal",
                fontDisplay: "swap",
                formats: ["woff2"],
                unicodeRange: (0, utils_1.createUnicodeRange)(range),
                fontName,
            });
        })));
        const cssData = `/** generated by font-slice-loader */${cssList.join("\n")}`;
        fs_1.default.writeFileSync(path_1.default.join(basePath, `${fontName}-slice.css`), cssData);
        return content;
    });
}
exports.default = fontSlicer;
