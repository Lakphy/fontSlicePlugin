import path from "path";
import fs from "fs";
import webpack from "webpack";
import { fontSlicer } from "./fontSlicer";
import { FontSliceOptions } from "./type";

export class FontSlicePlugin {
  constructor(options: FontSliceOptions) {
    this.options = options || {
      fontDirectory: "public/web_fonts",
      assetsDirectory: ".next/static",
      tempDirectory: ".temp",
    };
  }
  options: FontSliceOptions;
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(
      "WebfontsBufferPlugin",
      async (compilation: webpack.Compilation) => {
        compilation.hooks.processAssets.tapAsync(
          {
            name: "WebfontsBufferPlugin",
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            additionalAssets: true,
          },
          async (assets, callback) => {
            const fontDirectory: string = this.options.fontDirectory;
            const assetsDirectory: string = this.options.assetsDirectory;
            const tempDirectory: string = this.options.tempDirectory;

            const files: string[] = fs.readdirSync(fontDirectory);
            await Promise.all(
              files.map(async (file: string) => {
                const filePath: string = path.join(fontDirectory, file);
                const fileContent = fs.readFileSync(filePath);
                const buffer: Buffer = Buffer.from(fileContent);
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

// export default FontSlicePlugin;
