import { Hono } from "https://deno.land/x/hono@v2.2.5/mod.ts"
import { logger } from 'https://deno.land/x/hono@v2.2.5/middleware.ts'
import { serveStatic } from './patched-serve-static.ts'

import { apiHandler, getProxyHandler } from "./handlers.ts";
import { ApiManifest } from "./app.ts";

export function createHonoApp(isSilent: boolean, devPortStr: string, localPort: number, staticFilesRoot: string, apiEndpoints: ApiManifest) {
  const app = new Hono()

  if (!isSilent) app.use('*', logger())
  app.all('/api/*', apiHandler(apiEndpoints))

  const devPort = parseInt(devPortStr)
  const requestHandler = !isNaN(devPort) ? getProxyHandler(devPort, localPort) : serveStatic({ root: staticFilesRoot })
  app.use('*', requestHandler)
  app.use('*', (c, n) => {
    console.log("Could not find the regular file in the dist folder, sending index.html")
    return serveStatic({ path: staticFilesRoot })(c, n)
  })
  // If we still have not handled it, report
  app.all('*', (c) => c.text("404: Not found", 404))
  
  return app
}
