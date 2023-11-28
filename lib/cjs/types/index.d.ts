import webpack from "webpack";
import { FontSliceOptions } from "./type";
declare class FontSlicePlugin {
    options: FontSliceOptions;
    constructor(options: FontSliceOptions);
    apply(compiler: webpack.Compiler): void;
}
export default FontSlicePlugin;
//# sourceMappingURL=index.d.ts.map