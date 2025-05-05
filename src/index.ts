#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec as execCb } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import yaml from "js-yaml";

const exec = promisify(execCb);

// Define the schema for the tool's arguments
const SplitArgsSchema = z.object({
    apiPath: z.string().describe("Path to the input OpenAPI definition file."),
    outputDir: z.string().describe("Path to the directory for split output files.")
    // Optional: Add other redocly split options like 'separator' later if needed.
});

// Define the schema for the extract tool's arguments
const ExtractArgsSchema = z.object({
    inputApiPath: z.string().describe("Absolute path to the large input OpenAPI definition file."),
    endpointsToKeep: z.array(z.string()).describe("List of exact endpoint paths to keep (e.g., ['/users', '/users/{id}'])."),
    outputApiPath: z.string().describe("Absolute path where the final, smaller bundled OpenAPI file should be saved.")
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

// Register the 'redocly_extract_endpoints' tool
server.tool(
    "redocly_extract_endpoints",
    ExtractArgsSchema.shape,
    async ({ inputApiPath, endpointsToKeep, outputApiPath }, extra) => {
        let tempDir: string | undefined;
        try
        {
            // 1. Create a temporary directory
            tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'redocly-extract-'));
            console.error(`Created temp directory: ${tempDir}`);

            // 2. Split the input API into the temporary directory
            const splitCommand = `npx @redocly/cli@latest split "${inputApiPath}" --outDir="${tempDir}"`;
            console.error(`Executing split command: ${splitCommand}`);
            const { stdout: splitStdout, stderr: splitStderr } = await exec(splitCommand);
            if (splitStderr) { console.error("Split stderr:", splitStderr); }
            console.error("Split stdout:", splitStdout);

            // 3. Read the main openapi.yaml from the temporary directory
            const tempApiFilePath = path.join(tempDir, 'openapi.yaml'); // Default name used by split
            console.error(`Reading temporary API file: ${tempApiFilePath}`);
            const tempApiContent = await fs.readFile(tempApiFilePath, 'utf-8');

            // 4. Parse the YAML
            const apiDoc: any = yaml.load(tempApiContent);
            if (!apiDoc || typeof apiDoc !== 'object' || !apiDoc.paths)
            {
                throw new Error('Invalid OpenAPI structure found after split.');
            }

            // 5. Filter the paths
            console.error(`Filtering paths, keeping: ${endpointsToKeep.join(', ')}`);
            const originalPaths = apiDoc.paths;
            const filteredPaths: { [key: string]: any; } = {};
            let pathsKept = 0;
            for (const pathKey in originalPaths)
            {
                if (endpointsToKeep.includes(pathKey))
                {
                    filteredPaths[pathKey] = originalPaths[pathKey];
                    pathsKept++;
                }
            }

            if (pathsKept === 0)
            {
                console.warn("Warning: No paths matched the endpointsToKeep list. The output file might be empty or invalid.");
            } else if (pathsKept < endpointsToKeep.length)
            {
                console.warn(`Warning: Only ${pathsKept} out of ${endpointsToKeep.length} specified endpoints were found in the original spec.`);
            }


            apiDoc.paths = filteredPaths;

            // 6. Write the modified YAML back
            const modifiedYamlContent = yaml.dump(apiDoc);
            console.error(`Writing modified API file back to: ${tempApiFilePath}`);
            await fs.writeFile(tempApiFilePath, modifiedYamlContent, 'utf-8');

            // 7. Bundle the modified API to the final output path
            // Ensure the output directory exists
            const outputDir = path.dirname(outputApiPath);
            await fs.mkdir(outputDir, { recursive: true });

            const bundleCommand = `npx @redocly/cli@latest bundle "${tempApiFilePath}" -o "${outputApiPath}"`;
            console.error(`Executing bundle command: ${bundleCommand}`);
            const { stdout: bundleStdout, stderr: bundleStderr } = await exec(bundleCommand);
            if (bundleStderr) { console.error("Bundle stderr:", bundleStderr); }
            console.error("Bundle stdout:", bundleStdout);


            return {
                content: [{ type: "text", text: `Successfully extracted endpoints and saved to ${outputApiPath}\n${bundleStdout}` }]
            };

        } catch (error: any)
        {
            console.error("Extraction process failed:", error);
            const errorMessage = error.stderr || error.stdout || error.message || "Unknown error occurred during extraction";
            return {
                content: [{ type: "text", text: `Error: ${errorMessage}` }],
                isError: true
            };
        } finally
        {
            // 8. Clean up the temporary directory
            if (tempDir)
            {
                try
                {
                    console.error(`Cleaning up temp directory: ${tempDir}`);
                    await fs.rm(tempDir, { recursive: true, force: true });
                } catch (cleanupError)
                {
                    console.error(`Failed to clean up temp directory ${tempDir}:`, cleanupError);
                    // Log cleanup error but don't let it mask the primary error
                }
            }
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
