# Redocly Split MCP Server

This project provides a Model Context Protocol (MCP) server that wraps the `redocly split` command from the `@redocly/cli` tool. It allows an MCP client (like an AI assistant) to unbundle OpenAPI specification files programmatically.

## Prerequisites

- Node.js (LTS version recommended, e.g., v18 or v20)
- npm (comes with Node.js)

## Installation

1.  Clone this repository or download the source code.
2.  Navigate to the `redocly-mcp-server` directory.
3.  Install dependencies:
    ```bash
    npm install
    ```

## Building

To compile the TypeScript code to JavaScript, run:

```bash
npm run build
```

This will create a `dist` directory containing the compiled code.

## Running the Server

To start the MCP server, run:

```bash
npm start
```

The server will listen for MCP requests on standard input/output (stdio).

## Client Configuration

To use this server with MCP clients like VS Code, Cline, Cursor, or Claude Desktop, you need to add its configuration to the respective settings file.

**Important:** Ensure you have run `npm install` and `npm run build` in the `redocly-mcp-server` directory first.

### VS Code / Cline / Cursor

Add the following to your User `settings.json` (accessible via `Ctrl+Shift+P` > `Preferences: Open User Settings (JSON)`) or to a `.vscode/mcp.json` file in your workspace root.

This configuration assumes the `redocly-mcp-server` directory is located directly within your workspace folder (`${workspaceFolder}`). Adjust the paths if your project structure is different.

```json
// In settings.json:
"mcp.servers": {
  "redocly_split": {
    "command": "node",
    "args": [
      // Path to the compiled server script relative to workspace root
      "${workspaceFolder}/redocly-mcp-server/dist/index.js"
    ],
    // Set the working directory for the server process
    "cwd": "${workspaceFolder}/redocly-mcp-server"
  }
  // ... other servers can be added here
},

// Or in .vscode/mcp.json (omit the top-level "mcp.servers"):
{
  "redocly_split": {
    "command": "node",
    "args": [
      // Path to the compiled server script relative to workspace root
      "${workspaceFolder}/redocly-mcp-server/dist/index.js"
    ],
    // Set the working directory for the server process
    "cwd": "${workspaceFolder}/redocly-mcp-server"
  }
  // ... other servers can be added here
}
```

### Claude Desktop

Add the following to your `claude_desktop_config.json` file. You will need to replace `<path-to-project>` with the actual absolute or relative path to the directory containing the `redocly-mcp-server` folder on your system.

```json
{
	"mcpServers": {
		"redocly_split": {
			"command": "node",
			"args": [
				// Replace with the correct path to the compiled script
				"<path-to-project>/redocly-mcp-server/dist/index.js"
			],
			// Set the working directory to the server's root
			"cwd": "<path-to-project>/redocly-mcp-server"
		}
		// ... other servers can be added here
	}
}
```

After adding the configuration, restart your client application for the changes to take effect.

## MCP Tool Provided

### `redocly_split`

**Description:** Executes the `redocly split` command to unbundle an OpenAPI definition file into multiple smaller files based on its structure.

**Arguments:**

- `apiPath` (string, required): The path to the input OpenAPI definition file (e.g., `openapi.yaml`).
- `outputDir` (string, required): The path to the directory where the split output files should be saved. This directory will be created if it doesn't exist.

**Returns:**

- On success: A text message containing the standard output from the `redocly split` command (usually a confirmation message).
- On failure: An error message containing the standard error or exception details from the command execution, marked with `isError: true`.

**Example Usage (Conceptual MCP Request):**

```json
{
	"tool_name": "redocly_split",
	"arguments": {
		"apiPath": "path/to/your/openapi.yaml",
		"outputDir": "path/to/output/directory"
	}
}
```

**Note:** This server uses `npx @redocly/cli@latest` to execute the command, so `@redocly/cli` does not need to be installed globally, but an internet connection might be required for `npx` to fetch the package if it's not cached.
