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
const fs_1 = __importDefault(require("fs"));
const webpack_1 = __importDefault(require("webpack"));
const fontSlicer_1 = __importDefault(require("./fontSlicer"));
class FontSlicePlugin {
    constructor(options) {
        this.options = options || {
            fontDirectory: "public/web_fonts",
            assetsDirectory: ".next/static",
            tempDirectory: ".temp",
        };
    }
    apply(compiler) {
        compiler.hooks.compilation.tap("WebfontsBufferPlugin", (compilation) => __awaiter(this, void 0, void 0, function* () {
            compilation.hooks.processAssets.tapAsync({
                name: "WebfontsBufferPlugin",
                stage: webpack_1.default.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
                additionalAssets: true,
            }, (assets, callback) => __awaiter(this, void 0, void 0, function* () {
                const fontDirectory = this.options.fontDirectory;
                const assetsDirectory = this.options.assetsDirectory;
                const tempDirectory = this.options.tempDirectory;
                const files = fs_1.default.readdirSync(fontDirectory);
                yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                    const filePath = path_1.default.join(fontDirectory, file);
                    const fileContent = fs_1.default.readFileSync(filePath);
                    const buffer = Buffer.from(fileContent);
                    if (!fs_1.default.existsSync(assetsDirectory)) {
                        fs_1.default.mkdirSync(assetsDirectory);
                    }
                    if (!fs_1.default.existsSync(path_1.default.join(assetsDirectory, `font`))) {
                        fs_1.default.mkdirSync(path_1.default.join(assetsDirectory, `font`));
                    }
                    if (!fs_1.default.existsSync(path_1.default.join(assetsDirectory, `font/${file}`))) {
                        yield (0, fontSlicer_1.default)(buffer, path_1.default.join(assetsDirectory, "font"), file, tempDirectory);
                    }
                    fs_1.default.writeFileSync(path_1.default.join(assetsDirectory, `font/${file}`), buffer);
                })));
                callback();
            }));
        }));
    }
}
exports.default = FontSlicePlugin;
