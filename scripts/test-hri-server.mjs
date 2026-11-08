import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Isolated component harness: no Next.js fixture routes, production flags or database writes.
await build({
  entryPoints: ["tests-node/fixtures/hri-app.tsx"], bundle: true, outfile: "dist-test/hri/app.js",
  platform: "browser", format: "esm", jsx: "automatic", loader: { ".css": "local-css" },
  alias: { "next/navigation": resolve("tests-node/fixtures/hri-navigation.ts"), "next/link": resolve("tests-node/fixtures/hri-link.tsx") }
});
createServer(async (request, response) => {
  if (request.url === "/app.js" || request.url === "/app.css") {
    response.setHeader("Content-Type", request.url.endsWith(".js") ? "text/javascript" : "text/css");
    response.end(await readFile(resolve("dist-test/hri", request.url.slice(1))));
    return;
  }
  if (request.url?.startsWith("/api/")) { response.writeHead(503); response.end('{"success":false}'); return; }
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.end('<!doctype html><html lang="th"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:24px;font-family:Arial,sans-serif}*{box-sizing:border-box}button,select{font:inherit}</style></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
}).listen(3217, "127.0.0.1");
