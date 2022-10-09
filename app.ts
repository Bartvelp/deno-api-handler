import { serve } from "https://deno.land/std@0.159.0/http/server.ts"
import { parse } from "https://deno.land/std@0.159.0/flags/mod.ts";

import { Hono } from "https://deno.land/x/hono@v2.2.5/mod.ts"
import { logger } from 'https://deno.land/x/hono@v2.2.5/middleware.ts'
import { serveStatic } from './patched-serve-static.ts'

import { apiHandler, proxyHandler } from "./handlers.ts";

const app = new Hono()

app.use('*', logger())
app.all('/api/*', apiHandler)

const requestHandler = Deno.env.get("DEV") ? proxyHandler : serveStatic({ root: './vueapp/dist' })
app.use('*', requestHandler)
app.use('*', (c, n) => {
  console.log("Could not find the regular file in the dist folder, sending index.html")
  return serveStatic({ path: './vueapp/dist/' })(c, n)
})
// If we still have not handled it, report
app.all('*', (c) => c.text("404: Not found"))

const flags = parse(Deno.args, {
  boolean: ["help", "color"],
  string: ["version"],
  default: { color: true },
});
console.log("Got flags", flags)

serve(app.fetch)