import * as apiEndpoints from './api/_apiExports.ts'
import { ApiManifest, loadCLI } from './app.ts'
loadCLI(apiEndpoints.default as ApiManifest)
