import { serve } from "https://deno.land/std@0.159.0/http/server.ts"
import { Context, Hono } from "https://deno.land/x/hono@v2.2.5/mod.ts"
import { logger, serveStatic } from 'https://deno.land/x/hono@v2.2.5/middleware.ts'

import { APIpathResolver } from "./file-based-api-router.ts";
import { importModule } from 'https://deno.land/x/dynamic_import_ponyfill@v0.1.3/mod.ts'
import { Environment, ValidatedData } from "https://deno.land/x/hono@v2.2.5/hono.ts";

const app = new Hono()

app.use('*', logger())

app.all('/api/*', apiHandler)

const requestHandler = Deno.env.get("DEV") ? proxyHandler : serveStatic({ root: './vueapp/dist' })
app.use('*', (c, n) => {
  return requestHandler(c, n)
})
app.all('*', (c) => c.text('500: Server error'))

async function apiHandler(c: Context<string, Environment, ValidatedData>) {
  try {
    const url = c.req.url
    const path = url.slice(url.indexOf('/api') + 4) || "/"
    const apiPath = APIpathResolver(path, './api')
    console.log(`Loading apiPath: ${apiPath}`)
    const module = await importModule(apiPath)
    return module.handler(c.req)
  } catch (err) {
    console.log("Caught error:")
    console.error(err)
    return c.text('Failed to process request', 500)
  }
}

function proxyHandler(c: Context<string, Environment, ValidatedData>) {
  const newUrl = c.req.url.replace(":8000", ":8080")
  const newRequest = new Request(newUrl, c.req)
  return fetch(newRequest)
}

serve(app.fetch)