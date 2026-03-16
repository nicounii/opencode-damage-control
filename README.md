# OpenCode Damage Control

[![npm version](https://img.shields.io/npm/v/opencode-damage-restriction.svg)](https://www.npmjs.com/package/opencode-damage-restriction)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](#)

Security plugin for OpenCode that blocks dangerous commands and protects sensitive files. Ports Claude Code's damage-control system to OpenCode.

## Features

- **Command Blocking**: Blocks 90+ dangerous shell commands (rm -rf, git reset --hard, terraform destroy, etc.)
- **Path Protection**: Three-tier protection system (zeroAccess, readOnly, noDelete)
- **Cloud Provider Safety**: Protects against accidental destruction of AWS, GCP, Firebase, Vercel, Kubernetes resources
- **Database Safety**: Blocks dangerous SQL operations (DROP, TRUNCATE, DELETE without WHERE)
- **Extensible**: Easy to add custom patterns via JSON configuration

## Installation

### Add to OpenCode

In your `opencode.json`:

```json
{
  "plugin": ["opencode-damage-restriction"]
}
```

Or for local development:

```json
{
  "plugin": ["file:///path/to/opencode-damage-restriction/dist/index.js"]
}
```

### Install Dependencies

```bash
bun install
```

### Build

```bash
bun run build
```

## Configuration

### Config File Locations (Priority Order)

1. **Project**: `./.opencode/damage-control.json`
2. **Global**: `~/.config/opencode/damage-control.json`
3. **Default**: Built-in patterns from `src/config/default.json`

### Example Configuration

```json
{
  "enabled": true,
  "logLevel": "warn",
  "defaultAction": "block",
  "bashToolPatterns": [
    {
      "pattern": "\\brm\\s+-[rRf]",
      "reason": "rm with recursive or force flags",
      "action": "block"
    }
  ],
  "zeroAccessPaths": [".env", "~/.ssh/"],
  "readOnlyPaths": ["package-lock.json", "/etc/"],
  "noDeletePaths": [".git/", "README.md"]
}
```

## Path Protection Levels

| Level | Read | Write | Edit | Delete | Tools |
|-------|------|-------|------|--------|-------|
| `zeroAccessPaths` | ❌ | ❌ | ❌ | ❌ | Bash, Edit, Write |
| `readOnlyPaths` | ✅ | ❌ | ❌ | ❌ | Bash, Edit, Write |
| `noDeletePaths` | ✅ | ✅ | ✅ | ❌ | Bash only |

### Default Protected Paths

**Zero Access** (no operations allowed):
- `.env`, `.env.*` - Environment variables with secrets
- `~/.ssh/` - SSH keys
- `~/.aws/` - AWS credentials
- `*.pem`, `*.key` - SSL/TLS certificates

**Read Only** (read allowed, modifications blocked):
- `/etc/` - System directories
- `package-lock.json`, `yarn.lock` - Lock files
- `node_modules/`, `dist/` - Build artifacts

**No Delete** (all operations except delete):
- `.git/` - Git repository
- `README.md`, `LICENSE` - Project files

## Default Blocked Commands

### Destructive File Operations
- `rm -rf`, `rm -r`, `rm -f`
- `sudo rm`
- `rmdir`

### Permission Changes
- `chmod 777`
- `chown root`

### Git Destructive
- `git reset --hard`
- `git clean -fd`
- `git push --force`
- `git stash clear`

### Cloud Provider Destructive
- `terraform destroy`
- `aws s3 rm --recursive`
- `gcloud projects delete`
- `firebase projects:delete`
- `kubectl delete namespace`

### Database Destructive
- `DELETE FROM table;` (no WHERE)
- `DROP TABLE`
- `TRUNCATE TABLE`
- `redis-cli FLUSHALL`

## Development

### Run Tests

```bash
# All tests
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

### Project Structure

```
opencode-damage-restriction/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── hooks/
│   │   └── tool.before.ts    # tool.execute.before implementation
│   ├── lib/
│   │   ├── patterns.ts      # Regex pattern matching
│   │   ├── path-check.ts    # Path protection logic
│   │   ├── config.ts        # JSON config loader
│   │   ├── utils.ts         # Utility functions
│   │   └── types.ts         # TypeScript interfaces
│   └── config/
│       └── default.json     # Default security patterns
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Hook integration tests
│   └── e2e/                # E2E "sentient AI" tests
└── package.json
```

## Publishing

```bash
# Build first
bun run build

# Publish to npm
npm publish --access public
```

## License

MIT

## Credits

Based on [claude-code-damage-control](https://github.com/disler/claude-code-damage-control) by [disler](https://github.com/disler).
