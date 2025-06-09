import { v4 as uuidv4 } from "uuid";

export type LogSeverity = "debug" | "info" | "warn" | "error" | "fatal";

export type LoggerContext = {
  timestamp?: Date;
  scopeId?: string;
  parentScopeId?: string;
};

export abstract class Logger {
  constructor() {}

  abstract log<T>(
    severity: LogSeverity,
    area: string,
    message: string,
    object?: T,
    context?: LoggerContext
  ): void;

  createScope(area: string, scopeId?: string, parentScopeId?: string): Logger {
    return new LoggerScope(this, area, scopeId ?? uuidv4(), parentScopeId);
  }
}

export function createErrorObject(e: unknown) {
  let obj: {};
  if (e instanceof Error) {
    obj = {
      name: e.name,
      message: e.message,
      cause: e.cause,
      stack: e.stack,
    };
  } else {
    obj = {
      detail: stringifyUnknown(e),
    };
  }

  return obj;
}

function stringifyUnknown(o: unknown): string {
  if (
    typeof o === "string" ||
    typeof o === "number" ||
    typeof o === "bigint" ||
    typeof o === "symbol" ||
    typeof o === "boolean"
  ) {
    return o.toString();
  }

  if (typeof o === "function") {
    return o.name;
  }

  if (typeof o === "undefined") {
    return "undefined";
  }

  if (o === null) {
    return "null";
  }

  return JSON.stringify(o);
}

class LoggerScope extends Logger {
  #base: Logger;
  #scopeArea: string;
  #scopeId: string;
  #parentScopeId: string | undefined;
  constructor(
    base: Logger,
    scopeArea: string,
    scopeId: string,
    parentScopeId?: string
  ) {
    super();
    this.#base = base;
    this.#scopeArea = scopeArea;
    this.#scopeId = scopeId;
    this.#parentScopeId = parentScopeId;
  }

  log<T>(
    severity: LogSeverity,
    area: string,
    message: string,
    object?: T,
    context?: LoggerContext
  ): void {
    this.#base.log(severity, `${this.#scopeArea}::${area}`, message, object, {
      timestamp: context?.timestamp,
      scopeId: context?.scopeId ?? this.#scopeId,
      parentScopeId: context?.parentScopeId ?? this.#parentScopeId,
    });
  }

  override createScope(
    area: string,
    scopeId?: string,
    parentScopeId?: string
  ): Logger {
    return super.createScope(area, scopeId, parentScopeId ?? this.#scopeId);
  }
}

export function createJsonLogger(log: (json: string) => void) {
  return new (class extends Logger {
    log<T>(
      severity: LogSeverity,
      area: string,
      message: string,
      object?: T,
      context?: LoggerContext
    ): void {
      log(
        JSON.stringify({
          timestamp: +(context?.timestamp ?? new Date()),
          severity,
          area,
          message,
          obj: object,
          scopeId: context?.scopeId,
          parentScopeId: context?.parentScopeId,
        })
      );
    }
  })();
}

export function createTextLogger(log: (json: string) => void) {
  return new (class extends Logger {
    log(severity: LogSeverity, area: string, message: string): void {
      log(`[${severity}] ${area}: ${message}`);
    }
  })();
}

export function combineLoggers(...loggers: Logger[]) {
  return new (class extends Logger {
    log<T>(
      severity: LogSeverity,
      area: string,
      message: string,
      object?: T,
      context?: LoggerContext
    ): void {
      for (const logger of loggers) {
        logger.log(severity, area, message, object, context);
      }
    }
  })();
}
