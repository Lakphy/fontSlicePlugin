import path from "path";
import fs from "fs";
import webpack from "webpack";
import { fontSlicer } from "./fontSlicer";
export class FontSlicePlugin {
    constructor(options) {
        this.options = options || {
            fontDirectory: "public/web_fonts",
            assetsDirectory: ".next/static",
            tempDirectory: ".temp",
        };
    }
    options;
    apply(compiler) {
        compiler.hooks.compilation.tap("WebfontsBufferPlugin", async (compilation) => {
            compilation.hooks.processAssets.tapAsync({
                name: "WebfontsBufferPlugin",
                stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
                additionalAssets: true,
            }, async (assets, callback) => {
                const fontDirectory = this.options.fontDirectory;
                const assetsDirectory = this.options.assetsDirectory;
                const tempDirectory = this.options.tempDirectory;
                const files = fs.readdirSync(fontDirectory);
                await Promise.all(files.map(async (file) => {
                    const filePath = path.join(fontDirectory, file);
                    const fileContent = fs.readFileSync(filePath);
                    const buffer = Buffer.from(fileContent);
                    if (!fs.existsSync(assetsDirectory)) {
                        fs.mkdirSync(assetsDirectory);
                    }
                    if (!fs.existsSync(path.join(assetsDirectory, `font`))) {
                        fs.mkdirSync(path.join(assetsDirectory, `font`));
                    }
                    if (!fs.existsSync(path.join(assetsDirectory, `font/${file}`))) {
                        await fontSlicer(buffer, path.join(assetsDirectory, "font"), file, tempDirectory);
                    }
                    fs.writeFileSync(path.join(assetsDirectory, `font/${file}`), buffer);
                }));
                callback();
            });
        });
    }
}
// export default FontSlicePlugin;
