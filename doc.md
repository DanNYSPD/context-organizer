# Scripts Documentation

This document describes the npm scripts available in the Context Organizer project.

## Available Scripts

### `vscode:prepublish`
```bash
npm run vscode:prepublish
```
**Purpose:** Prepares the extension for publishing to the VS Code Marketplace.

**What it does:** Runs the `package` script to create an optimized production build of the extension.

**When to use:** Automatically executed by VS Code's publishing tools. You don't need to run this manually unless testing the publishing workflow.

---

### `compile`
```bash
npm run compile
```
**Purpose:** Compiles the TypeScript source code into JavaScript.

**What it does:** Runs webpack to bundle and compile the extension code from the `src/` directory into `dist/extension.js`.

**When to use:** When you want to build the extension once without watching for changes.

---

### `watch`
```bash
npm run watch
```
**Purpose:** Continuously compiles the extension during development.

**What it does:** Runs webpack in watch mode, automatically recompiling whenever source files change.

**When to use:** During active development. This should be running in the background while you work on the extension.

---

### `package`
```bash
npm run package
```
**Purpose:** Creates an optimized production build of the extension.

**What it does:** Runs webpack in production mode with hidden source maps, minimizing the bundle size and optimizing for performance.

**When to use:** Before publishing the extension or when testing production builds.

---

### `compile-tests`
```bash
npm run compile-tests
```
**Purpose:** Compiles TypeScript test files.

**What it does:** Uses the TypeScript compiler to compile test files and outputs them to the `out/` directory.

**When to use:** When you need to compile tests before running them.

---

### `watch-tests`
```bash
npm run watch-tests
```
**Purpose:** Continuously compiles test files during development.

**What it does:** Runs the TypeScript compiler in watch mode, automatically recompiling test files whenever they change.

**When to use:** During test development, so tests are automatically recompiled as you write them.

---

### `pretest`
```bash
npm run pretest
```
**Purpose:** Prepares the environment before running tests.

**What it does:** Sequentially runs:
1. `compile-tests` - Compiles test files
2. `compile` - Compiles extension source code
3. `lint` - Checks code for linting errors

**When to use:** Automatically runs before the `test` script. Generally not run manually.

---

### `lint`
```bash
npm run lint
```
**Purpose:** Checks TypeScript code for linting errors and style issues.

**What it does:** Runs ESLint on all TypeScript files in the `src/` directory.

**When to use:** 
- Before committing code to ensure it meets quality standards
- To identify and fix code style issues
- As part of the CI/CD pipeline

---

### `test`
```bash
npm run test
```
**Purpose:** Runs the extension's test suite.

**What it does:** Executes the test runner located at `./out/test/runTest.js`, which runs tests in the VS Code Extension Test environment.

**When to use:**
- Before committing changes to verify nothing broke
- After implementing new features to ensure they work correctly
- As part of the CI/CD pipeline

---

### `bump-version`
```bash
npm run bump-version
```
**Purpose:** Suggests a version bump based on the last commit message using conventional commits.

**What it does:** 
- Analyzes the last git commit message
- Suggests version bump type (major/minor/patch) based on:
  - `feat:` or `feat(scope):` → bumps **minor** version (x.MINOR.x)
  - `fix:` or `fix(scope):` → bumps **patch** version (x.x.PATCH)
  - `BREAKING CHANGE` or `feat!:`/`fix!:` → bumps **major** version (MAJOR.x.x)
  - Other commit types → bumps **patch** version (x.x.PATCH)
- Shows what the new version would be (doesn't apply changes)

**When to use:** Before releasing to see what version bump is appropriate based on your commits.

---

### `bump-version:major`
```bash
npm run bump-version:major
```
**Purpose:** Force bumps the major version (e.g., 1.0.0 → 2.0.0).

**What it does:** Updates `package.json` with the new major version immediately.

**When to use:** When making breaking changes that aren't reflected in commit messages.

---

### `bump-version:minor`
```bash
npm run bump-version:minor
```
**Purpose:** Force bumps the minor version (e.g., 1.0.0 → 1.1.0).

**What it does:** Updates `package.json` with the new minor version immediately.

**When to use:** When adding new features that aren't reflected in commit messages.

---

### `bump-version:patch`
```bash
npm run bump-version:patch
```
**Purpose:** Force bumps the patch version (e.g., 1.0.0 → 1.0.1).

**What it does:** Updates `package.json` with the new patch version immediately.

**When to use:** When making bug fixes that aren't reflected in commit messages.

---

## Common Development Workflows

### Starting Development
```bash
npm run watch
```
Run this in a terminal to keep the extension compiled as you work.

### Running Tests
```bash
npm run test
```
This will automatically compile everything and run the full test suite.

### Before Committing
```bash
npm run lint
npm run test
```
Ensure your code passes linting and all tests pass.

### Creating a Production Build
```bash
npm run package
```
Generate an optimized build ready for distribution.

### Version Management
```bash
npm run bump-version
```
Suggest a version bump based on the last commit message following semantic versioning conventions.

---

## Creating a VSIX File

To package your extension as a `.vsix` file for distribution or installation, you need to use the `vsce` (Visual Studio Code Extensions) tool.

### Install vsce

First, install `vsce` globally if you haven't already:

```bash
npm install -g @vscode/vsce
```

### Package the Extension

Create the VSIX file by running:

```bash
vsce package
```

This command will:
1. Automatically run the `vscode:prepublish` script (which creates an optimized production build)
2. Package everything into a `.vsix` file (e.g., `context-organizer-1.0.2.vsix`)

### Installing the VSIX File

Once created, you can install the extension in VS Code using either method:

**Via Command Line:**
```bash
code --install-extension context-organizer-1.0.2.vsix
```

**Via VS Code UI:**
1. Open the Extensions view
2. Click the "..." menu at the top
3. Select "Install from VSIX..."
4. Choose your `.vsix` file

### Optional: Add a Package Script

For convenience, you can add a script to `package.json`:

```json
"package-vsix": "vsce package"
```

Then simply run:
```bash
npm run package-vsix
```
