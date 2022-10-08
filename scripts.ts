export default {
  scripts: {
    serve: {
      pll: [
        "DEV=true deno run -A --watch app.ts",
        "cd vueapp && npm run serve",
      ]
    },
    "serve-static": "deno run -A --watch app.ts",
    build: "cd vueapp && npm run build",
    deploy: "deployctl deploy --project=hono-test --exclude vueapp/node_modules app.ts"
  },
};