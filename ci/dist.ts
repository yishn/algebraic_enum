import { copy, ensureDir, pathFromFileUrl, walkDir } from "../dev_deps.ts";

const rootDir = pathFromFileUrl(new URL("../", import.meta.url));
const sourceDir = pathFromFileUrl(new URL("../src", import.meta.url));
const distSourceDir = pathFromFileUrl(new URL("../dist/src", import.meta.url));

async function prepareSources() {
  console.log("Preparing sources for TypeScript...");

  await ensureDir(distSourceDir);
  await Deno.remove(distSourceDir, { recursive: true });
  await copy(sourceDir, distSourceDir);

  for await (let entry of walkDir(distSourceDir)) {
    if (!entry.name.endsWith(".ts")) continue;

    let content = await Deno.readTextFile(entry.path);

    await Deno.writeTextFile(
      entry.path,
      content.replace(/^(import|export) ([^]*?) "(.*?).ts"/mg, `$1 $2 "$3.js"`),
    );
  }
}

async function exec(cmd: string, options: Partial<Deno.RunOptions> = {}) {
  await Deno.run({
    cmd: [
      ...Deno.build.os === "windows" ? ["cmd", "/C"] : ["bash", "-c"],
      cmd,
    ],
    cwd: rootDir,
    ...options,
  }).status();
}

async function compile() {
  console.log("Building CommonJS distribution files...");
  await exec("npx tsc --project ./dist/tsconfig.commonjs.json");

  console.log("Building ES module distribution files...");
  await exec("npx tsc --project ./dist/tsconfig.esm.json");
}

if (import.meta.main) {
  await prepareSources();
  await compile();
}
