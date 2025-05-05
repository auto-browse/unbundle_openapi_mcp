#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

// Define the schema for the tool's arguments
const SplitArgsSchema = z.object({
    apiPath: z.string().describe("Path to the input OpenAPI definition file."),
    outputDir: z.string().describe("Path to the directory for split output files.")
    // Optional: Add other redocly split options like 'separator' later if needed.
});

// Create an MCP server instance
const server = new McpServer({
    name: "redocly-split-server",
    version: "1.0.0"
});

// Register the 'redocly_split' tool
server.tool(
    "redocly_split",
    SplitArgsSchema.shape, // Use .shape to pass the raw shape definition
    async ({ apiPath, outputDir }, extra) => { // Arguments are the first parameter
        // Construct the command using npx to avoid global dependency issues
        // Quote paths to handle potential spaces
        const command = `npx @redocly/cli@latest split "${apiPath}" --outDir="${outputDir}"`;
        console.error(`Executing command: ${command}`); // Log the command being executed

        try
        {
            // Execute the command
            const { stdout, stderr } = await exec(command);

            // Log stdout/stderr for debugging
            if (stdout)
            {
                console.error("Command stdout:", stdout);
            }
            if (stderr)
            {
                console.error("Command stderr:", stderr);
            }

            // Redocly CLI often prints success messages to stdout
            // We'll return stdout as the primary result
            return {
                content: [{ type: "text", text: stdout || "Command executed successfully." }]
            };

        } catch (error: any)
        {
            console.error("Command execution failed:", error);
            // If the command fails, return the error message (often in stderr)
            const errorMessage = error.stderr || error.stdout || error.message || "Unknown error occurred";
            return {
                content: [{ type: "text", text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

// Start the server using stdio transport
async function runServer() {
    try
    {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Redocly Split MCP Server running on stdio.");
    } catch (error)
    {
        console.error("Fatal error running server:", error);
        process.exit(1);
    }
}

runServer();
