// LeadDesk MCP server over stdio — QuitCode Workshop 5, Task A. The tools and resource are in leaddesk.mjs.
//
//   node src/server.mjs                                   offline on fixtures/leads.json
//   LEADDESK_FIXTURE=/path/to/leads.json node src/server.mjs
//
// stdout is the protocol channel: nothing is printed to it.
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { factory } from "./leaddesk.mjs";

await serveStdio(factory);
