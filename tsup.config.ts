import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["./src/server.ts"],
    outDir: "dist",
    target: "node20",
    format: ["esm"],
    clean: true,
    sourcemap: true,
    dts: false,
    splitting: false,
    minify: false,
    bundle: false,         // 👈 IMPORTANT

});
