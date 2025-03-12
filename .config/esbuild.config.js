import { build } from "esbuild";
// import { copy } from "esbuild-plugin-copy";

await build({
	entryPoints: ["src/cli.js"],
  bundle: true,
  outfile: "bin/cli.js",
  platform: "node",
  minify: true,
  format: "esm",
  target: "es2022",
  banner: {
    js: `import { createRequire } from "module";
         import path from "path"; 
         import url from "url"; 
         const require = createRequire(import.meta.url); 
         const __filename = url.fileURLToPath(import.meta.url); 
         const __dirname = path.dirname(__filename);`
  },
  define: {
	  "process.env.HASHINAMI_APP_MODE": "'prod'",
  },
  external: [
	  "smartwrap",
	  "pythonia",
	  "ffmpeg-ffprobe-static"
	],
  //sourcemap: "linked",
  legalComments: "none",
  logLevel: "info",
  metafile: true,
  /*
  plugins: [
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./node_modules/pythonia/src/pythonia/*.py"],
        to: ["./bin"],
      }
    }),
  ]
  */
});

