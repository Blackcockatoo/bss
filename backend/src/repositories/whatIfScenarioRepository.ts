import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { JsonFileStore } from "./fileStore";

export type WhatIfScenario = {
  id: string;
  ownerId: string;
  name: string;
  controls: Record<string, number>;
  sharedToken: string;
  createdAt: string;
  updatedAt: string;
};

type ScenarioStore = Record<string, WhatIfScenario>;

const store = new JsonFileStore<ScenarioStore>(resolve(process.cwd(), "backend/data/whatIfScenarios.json"), {});

export const whatIfScenarioRepository = {
  listByOwner(ownerId: string): WhatIfScenario[] {
    return Object.values(store.read()).filter((scenario) => scenario.ownerId === ownerId);
  },
  save(input: Omit<WhatIfScenario, "id" | "createdAt" | "updatedAt" | "sharedToken">): WhatIfScenario {
    const scenarios = store.read();
    const now = new Date().toISOString();
    const scenario: WhatIfScenario = {
      ...input,
      id: randomUUID(),
      sharedToken: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    scenarios[scenario.id] = scenario;
    store.write(scenarios);
    return scenario;
  },
  findBySharedToken(sharedToken: string): WhatIfScenario | undefined {
    return Object.values(store.read()).find((scenario) => scenario.sharedToken === sharedToken);
  },
};
