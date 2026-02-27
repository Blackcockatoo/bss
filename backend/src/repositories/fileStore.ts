import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export class JsonFileStore<T> {
  constructor(private readonly filePath: string, private readonly initialValue: T) {}

  read(): T {
    if (!existsSync(this.filePath)) {
      this.write(this.initialValue);
      return this.initialValue;
    }

    const content = readFileSync(this.filePath, "utf8");
    return (JSON.parse(content) as T) ?? this.initialValue;
  }

  write(value: T): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(value, null, 2), "utf8");
  }
}
