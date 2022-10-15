import { serve } from "https://deno.land/std@0.159.0/http/server.ts"
import { parse } from "https://deno.land/std@0.159.0/flags/mod.ts";

import { createApiExportFile } from "./createApiExportFile.ts";
import { createHonoApp } from "./createHonoApp.ts";

if (import.meta.main) {
  console.log("main");
  const flags = parse(Deno.args, {
    boolean: ["dev", "silent"],
    string: ["dev-port", "static-files", "port"],
    
    default: {
      dev: !!(Deno.env.get("DEV") ?? false),
      silent: !!(Deno.env.get("SILENT") ?? false),
      "dev-port": Deno.env.get("DEV_PORT") ?? "8080",
      "static-files": Deno.env.get("STATIC_FILES") ?? './',
      port: Deno.env.get("PORT") ?? '8000',
    },
  })
  
  console.log("Got flags", flags)
  const port = parseInt(flags["port"])

  if (flags['dev']) await createApiExportFile('./api')
  const app = createHonoApp(flags['dev'], flags.silent, parseInt(flags["dev-port"]), port, flags["static-files"])

  serve(app.fetch, { port })
}
