# Font Slice Webpack Plugin

This plugin is used to split font files into single font files, so that font files can be loaded on demand in different pages.

It's my first time to write a webpack plugin. I hope it can help you.

usage:

```js
{
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.plugins.push(
      new FontSlicePlugin({
        fontDirectory: "public/web_fonts", // font directory
        assetsDirectory: ".next/static", // assets directory
        tempDirectory: ".temp", // temp directory, please make sure it's in .gitignore
      })
    );
    return config;
  };
}
```

# Use Script Instead of Plugin?

You can use font-slice-plugin in your npm script now!

`package.json`

```json
{
  "scripts": {
    "build:fonts": "node scripts/build-fonts.js"
  }
}
```

`scripts/build-fonts.js`

```js
const { fontSliceWorker } = require("font-slice-plugin");

fontSliceWorker({
  fontDirectory: "public/web_fonts", // font directory
  assetsDirectory: "public/static", // assets directory
  tempDirectory: ".temp", // temp directory, please make sure it's in .gitignore
});
```

`(in your terminal)`

```bash
npm run build:fonts
```
