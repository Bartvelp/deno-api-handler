import { serve } from "https://deno.land/std@0.159.0/http/server.ts"
import { parse } from "https://deno.land/std@0.159.0/flags/mod.ts";

import { createApiExportFile } from "./createApiExportFile.ts";
import { createHonoApp } from "./createHonoApp.ts";
export type ApiManifest = {
  endpoints: {
    [path: string]: {
      handler?: (req: Request) => Promise<Response> | Response
    }
  },
  baseUrl: string
}

export async function loadCLI(apiEndpoints: ApiManifest) {
  console.log("main");
  const flags = parse(Deno.args, {
    boolean: ["dev", "silent"],
    string: ["dev-port", "static-files", "port"],
    
    default: {
      dev: !!(Deno.env.get("DEV") ?? false),
      silent: !!(Deno.env.get("SILENT") ?? false),
      "dev-port": Deno.env.get("DEV_PORT") ?? "",
      "static-files": Deno.env.get("STATIC_FILES") ?? './',
      port: Deno.env.get("PORT") ?? '8000',
    },
  })
  
  console.log("Got flags", flags)
  const port = parseInt(flags["port"])

  if (flags['dev']) await createApiExportFile('./api')
  const app = createHonoApp(flags.silent, flags["dev-port"], port, flags["static-files"], apiEndpoints)

  serve(app.fetch, { port })
}
