import { Context } from "https://deno.land/x/hono@v2.2.5/mod.ts"
import { Environment, ValidatedData } from "https://deno.land/x/hono@v2.2.5/hono.ts";
import { ApiManifest } from "./app.ts";


export function apiHandler(apiEndpoints: ApiManifest) {
  return function(c: Context<string, Environment, ValidatedData>) {
    try {
      const url = c.req.url
      let path = url.slice(url.indexOf('/api') + 4) || "/"
      if (path.endsWith("/")) path += "index";
      if (!path.endsWith('.ts')) path += '.ts';
      path = '.' + path
      console.log("Trying to load path:", path, apiEndpoints.endpoints)

      const module = apiEndpoints.endpoints[path]
      if (typeof module.handler !== "function") throw new Error("No handler function exported")
  
      return module.handler(c.req)
    } catch (err) {
      console.log("Caught error:")
      console.error(err)
      return c.text('Failed to process request', 500)
    }  
  }
}

export function getProxyHandler(proxyPort: number, localPort: number) {
  return async function proxyHandler(c: Context<string, Environment, ValidatedData>) {
    const newUrl = c.req.url.replace(`:${localPort}`, `:${proxyPort}`)
    const newRequest = new Request(newUrl, c.req)
    try {
      const response = await fetch(newRequest)
      return response
    } catch(err) {
      console.error("Failed to fetch:\n", err)
      return c.text(err, 500)
    }
  }
}

