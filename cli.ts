import * as apiEndpoints from './api/_apiExports.ts'
import { loadCLI } from 'https://raw.githubusercontent.com/Bartvelp/deno-api-handler/master/app.ts'
loadCLI(apiEndpoints)
