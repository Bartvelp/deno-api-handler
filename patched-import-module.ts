import * as esbuild from 'https://deno.land/x/esbuild@v0.14.53/wasm.js'
import { denoPlugin } from 'https://deno.land/x/esbuild_deno_loader@0.5.2/mod.ts'
import stripShebang from 'https://esm.sh/strip-shebang@2.0.0'

export type Module = Promise<Record<'default' | string, any>>

const AsyncFunction = (async function () {}).constructor

function moduleToAsyncFunction(moduleString: string): Module {
    const [ before, after ] = moduleString.split('export {')
          
    const body =
        stripShebang(before)
        + (after
        ? 'return {' + after.replaceAll(/(\w+) (as) (\w+)/gi, '$3: $1')
        : '')
        
    return AsyncFunction(body)()
}

export async function importModule(moduleName: string): Module {
    try {
        return await import(moduleName)
    } catch {
      try {
        await esbuild.initialize({ worker: false })
      } catch (err) {
        console.log("cannot init again", err)
      }

        try {
          const result = await esbuild.build({
            bundle: true,
            entryPoints: [ import.meta.resolve(moduleName) ],
            plugins: [ denoPlugin() as esbuild.Plugin ],
            write: false,
            logLevel: 'silent',
            format: 'esm',
          })
          esbuild.stop()
          return moduleToAsyncFunction(result.outputFiles[ 0 ].text)
        } catch(err) {
          console.log("Stopping esbuild anyway")
          esbuild.stop()
          throw err
        }
    }
}