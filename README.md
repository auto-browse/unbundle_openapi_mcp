# Unbundle OpenAPI MCP Server

This project provides a Model Context Protocol (MCP) server with tools to split OpenAPI specification files into multiple files or extract specific endpoints into a new file. It allows an MCP client (like an AI assistant) to manipulate OpenAPI specifications programmatically.

## Prerequisites

- Node.js (LTS version recommended, e.g., v18 or v20)
- npm (comes with Node.js)

## Installation

1.  Clone this repository or download the source code.
2.  Navigate to the `unbundle_openapi_mcp` directory.
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

**Important:** Ensure you have run `npm install` and `npm run build` in the `unbundle_openapi_mcp` directory first.

### VS Code / Cline / Cursor

Add the following to your User `settings.json` (accessible via `Ctrl+Shift+P` > `Preferences: Open User Settings (JSON)`) or to a `.vscode/mcp.json` file in your workspace root.

This configuration assumes the `unbundle_openapi_mcp` directory is located directly within your workspace folder (`${workspaceFolder}`). Adjust the paths if your project structure is different.

```json
// In settings.json:
"mcp.servers": {
  "split_openapi": {
    "command": "node",
    "args": [
      // Path to the compiled server script relative to workspace root
      "${workspaceFolder}/unbundle_openapi_mcp/dist/index.js"
    ],
    // Set the working directory for the server process
    "cwd": "${workspaceFolder}/unbundle_openapi_mcp"
  }
  // ... other servers can be added here
},

// Or in .vscode/mcp.json (omit the top-level "mcp.servers"):
{
  "split_openapi": {
    "command": "node",
    "args": [
      // Path to the compiled server script relative to workspace root
      "${workspaceFolder}/unbundle_openapi_mcp/dist/index.js"
    ],
    // Set the working directory for the server process
    "cwd": "${workspaceFolder}/unbundle_openapi_mcp"
  }
  // ... other servers can be added here
}
```

### Claude Desktop

Add the following to your `claude_desktop_config.json` file. You will need to replace `<path-to-project>` with the actual absolute or relative path to the directory containing the `unbundle_openapi_mcp` folder on your system.

```json
{
	"mcpServers": {
		"split_openapi": {
			"command": "node",
			"args": [
				// Replace with the correct path to the compiled script
				"<path-to-project>/unbundle_openapi_mcp/dist/index.js"
			],
			// Set the working directory to the server's root
			"cwd": "<path-to-project>/unbundle_openapi_mcp"
		}
		// ... other servers can be added here
	}
}
```

After adding the configuration, restart your client application for the changes to take effect.

## MCP Tools Provided

### `split_openapi`

**Description:** Executes the `redocly split` command to unbundle an OpenAPI definition file into multiple smaller files based on its structure.

**Arguments:**

- `apiPath` (string, required): The absolute path to the input OpenAPI definition file (e.g., `openapi.yaml`).
- `outputDir` (string, required): The absolute path to the directory where the split output files should be saved. This directory will be created if it doesn't exist.

**Returns:**

- On success: A text message containing the standard output from the `redocly split` command (usually a confirmation message).
- On failure: An error message containing the standard error or exception details from the command execution, marked with `isError: true`.

**Example Usage (Conceptual MCP Request):**

```json
{
	"tool_name": "split_openapi",
	"arguments": {
		"apiPath": "/path/to/your/openapi.yaml",
		"outputDir": "/path/to/output/directory"
	}
}
```

### `extract_openapi_endpoints`

**Description:** Extracts specific endpoints from a large OpenAPI definition file and creates a new, smaller OpenAPI file containing only those endpoints and their referenced components. It achieves this by splitting the original file, modifying the structure to keep only specified paths, and then bundling the result.

**Arguments:**

- `inputApiPath` (string, required): The absolute path to the large input OpenAPI definition file.
- `endpointsToKeep` (array of strings, required): A list of the exact endpoint paths (strings) to include in the final output (e.g., `["/api", "/api/projects/{id}{.format}"]`). Paths not found in the original spec will be ignored.
- `outputApiPath` (string, required): The absolute path where the final, smaller bundled OpenAPI file should be saved. The directory will be created if it doesn't exist.

**Returns:**

- On success: A text message indicating the path of the created file and the standard output from the `redocly bundle` command.
- On failure: An error message containing details about the step that failed (split, modify, bundle), marked with `isError: true`.

**Example Usage (Conceptual MCP Request):**

```json
{
	"tool_name": "extract_openapi_endpoints",
	"arguments": {
		"inputApiPath": "/path/to/large-openapi.yaml",
		"endpointsToKeep": ["/users", "/users/{userId}/profile"],
		"outputApiPath": "/path/to/extracted-openapi.yaml"
	}
}
```

**Note:** This server uses `npx @redocly/cli@latest` to execute the underlying `split` and `bundle` commands, so `@redocly/cli` does not need to be installed globally, but an internet connection might be required for `npx` to fetch the package if it's not cached. Temporary files are created during the process and automatically cleaned up.
