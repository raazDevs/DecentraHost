import { neon } from "@neondatabase/serverless";

import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const sql = neon(
  "postgresql://decentrahost_owner:7StacFnIk6es@ep-rapid-bird-a8b75xlq.eastus2.azure.neon.tech/decentrahost?sslmode=require"
);

export const db = drizzle(sql, { schema });