import { evaluateChildSafeDeployment } from "./assert-child-safe-deployment-lib.mjs";

const result = evaluateChildSafeDeployment(process.env);
const writer = result.level === "error" ? console.error : console.log;

writer(result.message);

if (!result.ok) {
  process.exit(result.code);
}
