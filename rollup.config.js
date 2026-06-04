import resolve    from "@rollup/plugin-node-resolve";
import commonjs   from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

const tsDecl = typescript({
    useTsconfigDeclarationDir: true,
});

const tsNoDecl = typescript({
    tsconfigOverride: { compilerOptions: { declaration: false } },
});

const base = [resolve(), commonjs()];

export default [
    // ESM — generates .d.ts declarations in dist/types/
    {
        input: "src/index.ts",
        output: { file: "dist/liquid-glass.esm.js", format: "esm", sourcemap: true },
        plugins: [...base, tsDecl],
    },
    // CJS — for Node / require()
    {
        input: "src/index.ts",
        output: { file: "dist/liquid-glass.cjs.js", format: "cjs", exports: "named", sourcemap: true },
        plugins: [...base, tsNoDecl],
    },
    // UMD — dev CDN / <script>
    {
        input: "src/index.ts",
        output: { file: "dist/liquid-glass.umd.js", format: "umd", name: "LiquidGlass", exports: "named", sourcemap: true },
        plugins: [...base, tsNoDecl],
    },
    // UMD min — production CDN
    {
        input: "src/index.ts",
        output: { file: "dist/liquid-glass.umd.min.js", format: "umd", name: "LiquidGlass", exports: "named", sourcemap: false },
        plugins: [...base, tsNoDecl, terser()],
    },
];
