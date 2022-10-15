import { join, resolve, toFileUrl, fromFileUrl } from "https://deno.land/std@0.144.0/path/mod.ts";
import { Context } from "https://deno.land/x/hono@v2.2.5/mod.ts"
import { Environment, ValidatedData } from "https://deno.land/x/hono@v2.2.5/hono.ts";
import { ApiManifest } from "./app.ts";

export function APIpathResolver(
  URLpath: string,
  apiRootDir: string,
  extension = ".ts",
) {
  apiRootDir = resolve(apiRootDir) // Make sure we use an absolute path
  let filePath = join(apiRootDir, URLpath);
  if (filePath.indexOf(apiRootDir) !== 0) {
    throw new Error(
      `Trying to do path traversal? Expected base: ${apiRootDir}, got ${filePath}`,
    );
  }
  if (filePath.endsWith("/")) filePath += "index";
  if (!filePath.endsWith(extension)) filePath += extension;
  return toFileUrl(filePath).href
}

export function apiHandler(apiEndpoints: ApiManifest) {
  
  return function(c: Context<string, Environment, ValidatedData>) {
    try {
      const url = c.req.url
      const path = url.slice(url.indexOf('/api') + 4) || "/"
      console.log("Trying to load path:", path)
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

