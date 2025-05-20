# Unbundle OpenAPI MCP Server
[![smithery badge](https://smithery.ai/badge/@auto-browse/unbundle_openapi_mcp)](https://smithery.ai/server/@auto-browse/unbundle_openapi_mcp)

<a href="https://glama.ai/mcp/servers/@auto-browse/unbundle_openapi_mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@auto-browse/unbundle_openapi_mcp/badge" alt="Unbundle OpenAPI Specs MCP server" />
</a>

This project provides a Model Context Protocol (MCP) server with tools to split OpenAPI specification files into multiple files or extract specific endpoints into a new file. It allows an MCP client (like an AI assistant) to manipulate OpenAPI specifications programmatically.

## Prerequisites

- Node.js (LTS version recommended, e.g., v18 or v20)
- npm (comes with Node.js)

## Usage

### Installing via Smithery

To install Unbundle OpenAPI MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@auto-browse/unbundle_openapi_mcp):

```bash
npx -y @smithery/cli install @auto-browse/unbundle_openapi_mcp --client claude
```

The easiest way to use this server is via `npx`, which ensures you are always using the latest version without needing a global installation.

```bash
npx @auto-browse/unbundle-openapi-mcp@latest
```

Alternatively, you can install it globally (not generally recommended):

```bash
npm install -g @auto-browse/unbundle-openapi-mcp
# Then run using: unbundle-openapi-mcp
```

The server will start and listen for MCP requests on standard input/output (stdio).

## Client Configuration

To use this server with MCP clients like VS Code, Cline, Cursor, or Claude Desktop, add its configuration to the respective settings file. The recommended approach uses `npx`.

### VS Code / Cline / Cursor

Add the following to your User `settings.json` (accessible via `Ctrl+Shift+P` > `Preferences: Open User Settings (JSON)`) or to a `.vscode/mcp.json` file in your workspace root.

```json
// In settings.json:
"mcp.servers": {
  "unbundle_openapi": { // You can choose any key name
    "command": "npx",
    "args": [
      "@auto-browse/unbundle-openapi-mcp@latest"
    ]
  }
  // ... other servers can be added here
},

// Or in .vscode/mcp.json (omit the top-level "mcp.servers"):
{
  "unbundle_openapi": { // You can choose any key name
    "command": "npx",
    "args": [
      "@auto-browse/unbundle-openapi-mcp@latest"
    ]
  }
  // ... other servers can be added here
}
```

### Claude Desktop

Add the following to your `claude_desktop_config.json` file.

```json
{
	"mcpServers": {
		"unbundle_openapi": {
			// You can choose any key name
			"command": "npx",
			"args": ["@auto-browse/unbundle-openapi-mcp@latest"]
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

**Note:** This server uses `npx @redocly/cli@latest` internally to execute the underlying `split` and `bundle` commands. An internet connection might be required for `npx` to fetch `@redocly/cli` if it's not cached. Temporary files are created during the `extract_openapi_endpoints` process and automatically cleaned up.

## Development

If you want to contribute or run the server from source:

1.  **Clone:** Clone this repository.
2.  **Navigate:** `cd unbundle_openapi_mcp`
3.  **Install Dependencies:** `npm install`
4.  **Build:** `npm run build` (compiles TypeScript to `dist/`)
5.  **Run:** `npm start` (starts the server using the compiled code in `dist/`)