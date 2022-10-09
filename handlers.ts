import { join, resolve, toFileUrl } from "https://deno.land/std@0.144.0/path/mod.ts";
import { Context } from "https://deno.land/x/hono@v2.2.5/mod.ts"

import { importModule } from 'https://deno.land/x/dynamic_import_ponyfill@v0.1.3/mod.ts'
import { Environment, ValidatedData } from "https://deno.land/x/hono@v2.2.5/hono.ts";


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

export async function apiHandler(c: Context<string, Environment, ValidatedData>) {
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

export async function proxyHandler(c: Context<string, Environment, ValidatedData>) {
  const newUrl = c.req.url.replace(":8000", ":8080")
  const newRequest = new Request(newUrl, c.req)
  try {
    const response = await fetch(newRequest)
    return response
  } catch(err) {
    console.error("Failed to fetch:\n", err)
    return c.text(err, 500)
  }
}
