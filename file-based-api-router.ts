import { join, resolve, toFileUrl } from "https://deno.land/std@0.144.0/path/mod.ts";
  
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
  