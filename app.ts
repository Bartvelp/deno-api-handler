import { serve } from "https://deno.land/std@0.159.0/http/server.ts"
import { parse } from "https://deno.land/std@0.159.0/flags/mod.ts";

import { Hono } from "https://deno.land/x/hono@v2.2.5/mod.ts"
import { logger } from 'https://deno.land/x/hono@v2.2.5/middleware.ts'
import { serveStatic } from './patched-serve-static.ts'

import { apiHandler, getProxyHandler } from "./handlers.ts";

function createHonoApp(isDev: boolean, isSilent: boolean, devPort: number, localPort: number, staticFilesRoot: string) {
  const app = new Hono()

  if (!isSilent) app.use('*', logger())
  app.all('/api/*', apiHandler)

  const requestHandler = isDev ? getProxyHandler(devPort, localPort) : serveStatic({ root: staticFilesRoot })
  app.use('*', requestHandler)
  app.use('*', (c, n) => {
    console.log("Could not find the regular file in the dist folder, sending index.html")
    return serveStatic({ path: staticFilesRoot })(c, n)
  })
  // If we still have not handled it, report
  app.all('*', (c) => c.text("404: Not found", 404))
  
  return app
}

if (import.meta.main) {
  console.log("main");
  const flags = parse(Deno.args, {
    boolean: ["dev", "silent"],
    string: ["dev-port", "static-files", "port", "dev-command"],
    
    default: {
      dev: !!(Deno.env.get("DEV") ?? false),
      silent: !!(Deno.env.get("SILENT") ?? false),
      "dev-port": Deno.env.get("DEV_PORT") ?? "8080",
      "static-files": Deno.env.get("STATIC_FILES") ?? './',
      port: Deno.env.get("PORT") ?? '8000',
      'dev-command': Deno.env.get("DEV_CMD") ?? ''
    },
  })
  
  console.log("Got flags", flags)
  const port = parseInt(flags["port"])

  let process: Deno.Process;
  if (flags['dev'] && flags["dev-command"]) process = Deno.run({ cmd: flags["dev-command"].split(' ') })

  const app = createHonoApp(flags['dev'], flags.silent, parseInt(flags["dev-port"]), port, flags["static-files"])

  serve(app.fetch, { port })
  
  Deno.addSignalListener("SIGINT", () => {
    console.log("\nCaught interruption, exiting!");
    if (process) process.kill("SIGINT")
    Deno.exit();
  });

  addEventListener("error", (event) => {
    console.log("Caught unhandled event:", event.message)
    event.preventDefault()
    if (process) {
      const pid = process.pid
      process.kill("SIGINT")
      process.close()
      console.log("done killing process", pid)
    } else {
      console.log("process", process)
    }
    Deno.exit(1);
  })
}
