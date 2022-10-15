import { parse } from "https://deno.land/std@0.159.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.159.0/fs/mod.ts";
import { dirname, join } from "https://deno.land/std@0.159.0/path/mod.ts";


const flags = parse(Deno.args, {
  boolean: ["vscode"],
  default: {
    vscode: false,
  }
})

console.log("initing deno api folder and app.ts")
await ensureDir("./api/"); // returns a promise
const defaultApiHandlerPath = "./api/index.ts"
if (! await exists(defaultApiHandlerPath)) {
  await Deno.writeTextFile("./api/index.ts", `
export async function handler(req: Request) {
  const myResponse = await new Response('Hello world')
  return myReponse
}
  `)
} else {
  console.log('Default api handler already exists: ', defaultApiHandlerPath)
}

await Deno.writeTextFile('./api/_apiExports.ts', "") // Create empty init api exports, will be filled on first launch

// Copy './app.ts' to the local dir
const scriptDir = dirname(import.meta.url)
const defaultAppLocation = join(scriptDir, 'cli.ts')
const defaultCliAppScript = await fetch(defaultAppLocation).then(r => r.text())
await Deno.writeTextFile("./deno_app.ts", defaultCliAppScript.replace("./app.ts", join(scriptDir, 'app.ts')))

if (flags.vscode) {
  console.log('Also adding .vscode folder with contents')
  await ensureDir('./.vscode')
  await Deno.writeTextFile("./.vscode/settings.json", `
{
  "deno.enable": false,
  "deno.enablePaths": ["./deno_app.ts", "./api/"],
  "deno.unstable": true
}
  `)
}

console.log('Success, run the following command to start:')
console.log('deno run -A --watch deno_app.ts --dev')
async function exists(filename: string): Promise<boolean> {
  try {
    await Deno.stat(filename);
    // successful, file or directory must exist
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // file or directory does not exist
      return false;
    } else {
      // unexpected error, maybe permissions, pass it along
      throw error;
    }
  }
}
