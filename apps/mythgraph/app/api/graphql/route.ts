/**
 * GraphQL API Route Handler
 *
 * Exposes MythGraph GraphQL API via GraphQL Yoga.
 * Handles both GET (GraphQL IDE) and POST (queries/mutations) requests.
 */

import { createYoga } from 'graphql-yoga';
import { readFileSync } from 'fs';
import { join } from 'path';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '@/src/server/graphql/resolvers';
import { testConnection } from '@/src/server/neo4j';
import { visit, parse } from 'graphql';

// Load the GraphQL schema from file
const schemaPath = join(process.cwd(), 'src/server/graphql/schema.graphql');
const typeDefs = readFileSync(schemaPath, 'utf-8');

// Build executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Calculate query depth to prevent deeply nested attacks
function getQueryDepth(ast: any): number {
  let maxDepth = 0;

  visit(ast, {
    SelectionSet(node: any, _key, _parent, _path, ancestors) {
      const depth = ancestors.filter((a: any) => a.kind === 'SelectionSet').length;
      maxDepth = Math.max(maxDepth, depth);
    },
  });

  return maxDepth;
}

// Create the Yoga instance with depth limit plugin
const yoga = createYoga({
  schema,
  graphiql: true,
  logging: {
    debug: (...args: any[]) => console.debug('[GraphQL]', ...args),
    info: (...args: any[]) => console.info('[GraphQL]', ...args),
    warn: (...args: any[]) => console.warn('[GraphQL]', ...args),
    error: (...args: any[]) => console.error('[GraphQL]', ...args),
  },
  plugins: [
    {
      onRequestParse({ request, serverContext: { query } }) {
        const MAX_DEPTH = 10;

        try {
          if (query) {
            const ast = parse(query);
            const depth = getQueryDepth(ast);

            if (depth > MAX_DEPTH) {
              console.warn(
                `[GraphQL] Query depth limit exceeded: ${depth} > ${MAX_DEPTH}`
              );
              throw new Error(
                `Query depth (${depth}) exceeds maximum allowed depth (${MAX_DEPTH})`
              );
            }
          }
        } catch (error) {
          console.error('[GraphQL] Query validation error:', error);
          throw error;
        }
      },
    },
  ],
});

// Middleware to test Neo4j connection before processing requests
const handleRequest = async (req: Request, info: any) => {
  // Test connection on first request
  if (!(global as any).__neo4j_tested) {
    try {
      console.log('[GraphQL] Testing Neo4j connection...');
      await testConnection();
      (global as any).__neo4j_tested = true;
      console.log('[GraphQL] Neo4j connection verified ✓');
    } catch (error) {
      console.error('[GraphQL] Neo4j connection failed:', error);
      return new Response(
        JSON.stringify({
          errors: [
            {
              message: 'Database connection failed. Please check Neo4j credentials.',
            },
          ],
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return yoga(req, info);
};

export const GET = handleRequest;
export const POST = handleRequest;
export const OPTIONS = handleRequest;
