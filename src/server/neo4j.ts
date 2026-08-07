/**
 * Neo4j Driver Module for MythGraph
 *
 * Provides a singleton Neo4j driver instance with connection pool management.
 * Handles credential validation, connection lifecycle, and error handling.
 *
 * Environment Variables Required:
 * - NEO4J_URI: Connection URI (e.g., "neo4j+s://xxxxx.databases.neo4j.io")
 * - NEO4J_USERNAME: Database username
 * - NEO4J_PASSWORD: Database password
 */

import neo4j, { type Driver, type Session } from 'neo4j';

/**
 * Singleton driver instance
 * Lazily initialized on first call to getNeo4jDriver()
 */
let driverInstance: Driver | null = null;

/**
 * Validates that all required Neo4j environment variables are present.
 * Throws an error if any credential is missing.
 *
 * @throws {Error} If NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD is not defined
 */
function validateNeo4jCredentials(): {
  uri: string;
  username: string;
  password: string;
} {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri) {
    throw new Error(
      'Missing required environment variable: NEO4J_URI. ' +
        'Expected format: neo4j+s://xxxxx.databases.neo4j.io'
    );
  }

  if (!username) {
    throw new Error(
      'Missing required environment variable: NEO4J_USERNAME'
    );
  }

  if (!password) {
    throw new Error(
      'Missing required environment variable: NEO4J_PASSWORD'
    );
  }

  return { uri, username, password };
}

/**
 * Gets or creates the singleton Neo4j driver instance.
 *
 * Implements lazy initialization: the driver is only created when first requested.
 * Subsequent calls return the existing instance. Connection pool is configured with:
 * - maxConnectionPoolSize: 100
 * - maxConnectionLifetime: 1 hour
 *
 * @returns {Driver} The Neo4j driver instance
 * @throws {Error} If environment variables are missing or connection fails
 */
export function getNeo4jDriver(): Driver {
  if (driverInstance) {
    return driverInstance;
  }

  const { uri, username, password } = validateNeo4jCredentials();

  try {
    console.log(`[Neo4j] Connecting to ${uri}`);

    driverInstance = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 100,
      maxConnectionLifetime: 60 * 60 * 1000, // 1 hour
      logging: {
        level: 'error',
        logger: (level: string, message: string) => {
          console.error(`[Neo4j:${level}] ${message}`);
        },
      },
    });

    console.log('[Neo4j] Driver initialized successfully');
    return driverInstance;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Neo4j driver: ${errorMessage}`);
  }
}

/**
 * Gets an active session from the driver.
 *
 * Sessions are used to execute queries. The caller is responsible for
 * closing the session when done (via session.close()).
 *
 * @returns {Session} A new Neo4j session
 * @throws {Error} If driver initialization fails
 */
export function getSession(): Session {
  const driver = getNeo4jDriver();
  return driver.session();
}

/**
 * Tests the connection to the Neo4j database.
 *
 * Runs a simple query: MATCH (n) RETURN COUNT(n) as count
 * Use this to verify credentials and connectivity during startup.
 *
 * @throws {Error} If the connection test fails
 */
export async function testConnection(): Promise<void> {
  const session = getSession();

  try {
    console.log('[Neo4j] Testing connection...');

    const result = await session.run(
      'MATCH (n) RETURN COUNT(n) as count LIMIT 1'
    );

    const record = result.records[0];
    const count = record?.get('count')?.toNumber() ?? 0;

    console.log(`[Neo4j] Connection test successful. Database has ${count} nodes`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Neo4j connection test failed: ${errorMessage}`);
  } finally {
    await session.close();
  }
}

/**
 * Gracefully closes the Neo4j driver and cleans up resources.
 *
 * Call this during application shutdown to ensure all connections
 * are properly closed. This is essential for proper cleanup.
 *
 * @throws {Error} If the driver fails to close
 */
export async function closeDriver(): Promise<void> {
  if (!driverInstance) {
    console.log('[Neo4j] Driver not initialized, skipping close');
    return;
  }

  try {
    console.log('[Neo4j] Closing driver...');
    await driverInstance.close();
    driverInstance = null;
    console.log('[Neo4j] Driver closed successfully');
  } catch (error) {
    driverInstance = null;
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to close Neo4j driver: ${errorMessage}`);
  }
}
