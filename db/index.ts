import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Flag to indicate if we're using JSON storage instead of PostgreSQL
// This is set to true by default since we want to use JSON storage
const useJsonStorage = true;

// The following code is only used if useJsonStorage is false (using PostgreSQL)
let pool: Pool | null = null;
let db: any = null;

if (!useJsonStorage) {
  // This is the correct way neon config - DO NOT change this
  neonConfig.webSocketConstructor = ws;

  if (!process.env.DATABASE_URL) {
    console.warn(
      "DATABASE_URL not set. If you need PostgreSQL, please provision a database.",
    );
  } else {
    try {
      // Setup PostgreSQL connection
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
      console.log("PostgreSQL connection established");
    } catch (error) {
      console.error("Failed to connect to PostgreSQL:", error);
    }
  }
}

// Export the pool and db variables even if they're null (for compatibility)
export { pool, db };