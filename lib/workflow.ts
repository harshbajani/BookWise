import { Client as WorkflowClient } from "@upstash/workflow";
import config from "./config";
export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashToken!,
  token: config.env.upstash.qstashToken!,
});
