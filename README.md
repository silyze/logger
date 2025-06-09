# Silyze Logger

> \*_A tiny, scoped, zero-dependency_ structured logger for TypeScript and Node.js\*\*
>
> ✅ JSON or plain-text output
> ✅ Runtime-choosable severity (`debug` → `fatal`)
> ✅ _Hierarchical_ scopes with automatic UUIDs
> ✅ Combine many loggers into one fan-out
> ✅ Helper to serialise unknown `Error` objects

\* only production dep is [`uuid`](https://npmjs.com/package/uuid) for random `scopeId` generation.

---

## 📦 Installation

```bash
npm install @silyze/logger uuid
```

Supports Node ≥ 18 and TypeScript ≥ 5.2.

---

## Quick Start

```ts
import { createJsonLogger } from "@silyze/logger";

// 1) Create a logger (JSON variant). Provide any IO callback you like.
const logger = createJsonLogger((json) => console.log(json));

// 2) Create a *scope* – gives every nested log a unique scopeId.
const exampleScope = logger.createScope("example");

// 3) Log!
exampleScope.log("info", "startup", "Server started", { port: 3000 });
```

The stdout will look something like:

```json
{
  "timestamp": 1717939130910,
  "severity": "info",
  "area": "example::startup",
  "message": "Server started",
  "obj": { "port": 3000 },
  "scopeId": "b6e3fb9b-306f-4e8a-ae9b-103099b8ce9c"
}
```

---

## Features

| Feature                 | Description                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Severity levels**     | `debug`, `info`, `warn`, `error`, `fatal`.                                                                                     |
| **Hierarchical scopes** | `logger.createScope(area)` prefixes all nested `area` strings with `parent::child` and propagates `scopeId` / `parentScopeId`. |
| **Pluggable format**    | Built-ins: JSON (`createJsonLogger`) & plain-text (`createTextLogger`). Roll your own by subclassing `Logger`.                 |
| **Fan-out**             | `combineLoggers(a,b,c)` calls each child; great for writing to both a file and the console.                                    |
| **Error serialisation** | `createErrorObject(err)` converts `Error` (or anything) into JSON-safe data, including `stack`.                                |

---

## API Reference

### Core Types

| Type            | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| `LogSeverity`   | Union of allowed severities.                                |
| `LoggerContext` | Optional metadata: `timestamp`, `scopeId`, `parentScopeId`. |

### `abstract class Logger`

| Member             | Signature                                      | Notes                                                                       |
| ------------------ | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `log` _(abstract)_ | `(severity, area, message, object?, context?)` | Implement in subclasses.                                                    |
| `createScope`      | `(area, scopeId?, parentScopeId?) => Logger`   | Returns a **new** `Logger` that auto-prefixes `area` and manages scope IDs. |

### Factory helpers

| Function                                  | Returns  | Description                                                  |
| ----------------------------------------- | -------- | ------------------------------------------------------------ |
| `createJsonLogger(write: (json) => void)` | `Logger` | Serialises to JSON – includes timestamp in **epoch millis**. |
| `createTextLogger(write: (line) => void)` | `Logger` | Simple `[severity] area: message` lines.                     |
| `combineLoggers(...loggers)`              | `Logger` | Broadcasts each `log()` invocation to every child logger.    |

### Utilities

| Symbol                   | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `createErrorObject(err)` | Converts `unknown` → structured object `{ name, message, cause, stack }`. |

---

## Custom Loggers

Need CloudWatch, Loki, or file rotation?
Just extend `Logger`:

```ts
class LokiLogger extends Logger {
  log(
    sev: LogSeverity,
    area: string,
    msg: string,
    obj?: any,
    ctx?: LoggerContext
  ) {
    // transform & push to Loki HTTP API
  }
}
```

Thanks to TypeScript’s abstract method enforcement you’ll never forget to implement `log`.

---

## Advanced Scoping

```ts
const root = createTextLogger(console.log);
const api = root.createScope("api");
const request = api.createScope("GET /users");

request.log("debug", "validation", "Params OK");
```

Yields:

```log
[debug] api::GET /users::validation: Params OK
```

`scopeId` chaining makes tracing easy when you pipe JSON logs into Kibana / Grafana.
