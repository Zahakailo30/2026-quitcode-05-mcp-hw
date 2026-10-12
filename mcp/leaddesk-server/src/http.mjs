// LeadDesk MCP server over Streamable HTTP — QuitCode Workshop 5, Task E1. Same factory as src/server.mjs.
//
//   node src/http.mjs                                     http://127.0.0.1:3333/mcp
//
// Listens on 127.0.0.1 only. Host and Origin guards are called by hand before the MCP handler:
// toNodeHandler has no option for them and would silently ignore one (a forged Host would get 200).
import { createServer } from "node:http";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler, localhostHostValidation, localhostOriginValidation } from "@modelcontextprotocol/node";
import { factory } from "./leaddesk.mjs";

const PORT = 3333;
const HOST = "127.0.0.1";

const mcp = toNodeHandler(createMcpHandler(factory));
const checkHost = localhostHostValidation();
const checkOrigin = localhostOriginValidation();

createServer(async (req, res) => {
  if (!checkHost(req, res)) return; // the guard has already answered 403
  if (!checkOrigin(req, res)) return;
  await mcp(req, res);
}).listen(PORT, HOST, () => console.error(`leaddesk MCP over HTTP on http://${HOST}:${PORT}/mcp`));
