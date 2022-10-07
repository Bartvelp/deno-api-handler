import { serve } from "https://deno.land/std@0.159.0/http/server.ts"
import { Context, Hono } from "https://deno.land/x/hono@v2.2.5/mod.ts"
import { basicAuth, logger } from 'https://deno.land/x/hono@v2.2.5/middleware.ts'

import { APIpathResolver } from "./file-based-api-router.ts";
import { importModule } from 'https://deno.land/x/dynamic_import_ponyfill@v0.1.3/mod.ts'
import { Environment,ValidatedData } from "https://deno.land/x/hono@v2.2.5/hono.ts";

const app = new Hono()

const basicAuthMiddleWare = basicAuth({
  username: 'hono',
  password: 'bart',
})

app.use('*', logger())

app.use('/auth/*', basicAuthMiddleWare)

app.get('/auth/page', (c) => {
  console.log("Reached page")
  return c.text('You are authorized')
})

app.get('/', (c) => c.text('Hello! Hono!'))

app.all('/api/*', apiHandler)

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


serve(app.fetch)