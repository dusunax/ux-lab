# MythGraph 🏛️

Neo4j Knowledge Graph of Greek & Roman Mythology

## Overview

MythGraph is a Next.js application that provides a GraphQL API to explore an interconnected knowledge graph of Greek and Roman mythology. Built with Neo4j, it enables semantic exploration of gods, heroes, monsters, places, and their relationships.

## Features

- **131+ Entities**: 27 deities, 26 heroes, 6 monsters, 11 places
- **14 Myths**: Major narrative cycles including Trojan War, Heracles Labors, Odyssey
- **42 Events**: Chronological timeline of mythological events
- **Full-text Search**: Find entities by name, aliases, or description
- **GraphQL API**: Query the knowledge graph with precise, typed queries
- **GraphQL Playground**: Interactive IDE for exploring the API

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (monorepo package manager)
- Neo4j running on localhost:7687 (Docker recommended)

### Setup

```bash
# From the repository root
cd /Users/du/repository/ux-lab

# Install dependencies (if not already done)
pnpm install

# Start Neo4j (if not running)
docker run -d \
  --name mythgraph-neo4j \
  -p 7687:7687 \
  -p 7474:7474 \
  -e NEO4J_AUTH=neo4j/dev_password_123 \
  neo4j:5.15-community

# Navigate to the MythGraph app
cd apps/mythgraph

# Start development server
pnpm run dev
```

The app will be available at **http://localhost:3003**

### GraphQL API

Access the GraphQL API at **http://localhost:3003/api/graphql**

## Project Structure

```
apps/mythgraph/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── api/graphql/route.ts # GraphQL endpoint
├── src/
│   └── server/
│       ├── neo4j.ts        # Neo4j driver initialization
│       └── graphql/
│           ├── schema.graphql    # GraphQL schema
│           └── resolvers.ts      # Query resolvers
├── package.json
├── tsconfig.json
└── next.config.js
```

## API Documentation

### Queries

#### searchEntities

Search for entities by name, aliases, or description.

```graphql
query {
  searchEntities(query: "Zeus", limit: 10) {
    entity {
      id
      name
      type
      description
    }
    matchScore
  }
}
```

#### getEntity

Get a single entity by ID.

```graphql
query {
  getEntity(id: "entity_zeus_001") {
    name
    type
    description
  }
}
```

#### listEntityTypes

Get all available entity types.

```graphql
query {
  listEntityTypes
}
```

#### getMythById

Get a myth by ID (with related entities and sources).

```graphql
query {
  getMythById(id: "myth_trojan_war_001") {
    title
    summary
    entities {
      name
      type
    }
  }
}
```

#### getNearestPath

Find the shortest path between two entities.

```graphql
query {
  getNearestPath(fromId: "entity_zeus_001", toId: "entity_heracles_001") {
    source { name }
    target { name }
    type
  }
}
```

## Data Source

All mythology data is sourced from:
- **Theoi Project** - Comprehensive Greek mythology database
- **Primary Sources**: Homer (Iliad, Odyssey), Ovid (Metamorphoses), Hesiod (Theogony), Apollodorus (Library)

## Development

### Available Scripts

```bash
pnpm run dev        # Start development server
pnpm run build      # Build for production
pnpm run start      # Start production server
pnpm run lint       # Run ESLint
pnpm run type-check # Type check with TypeScript
```

### Testing the GraphQL API

1. Open http://localhost:3003/api/graphql
2. Use the GraphQL Playground to test queries
3. Example: Search for "Heracles" and explore related entities

## Database

MythGraph uses Neo4j with the following structure:

- **Nodes**: Entity, Myth, Event, Source
- **Labels**: Deity, Human, Monster, Place
- **Indexes**: Full-text indexes on entity names and descriptions

### Loading Seed Data

Seed data is automatically loaded during Neo4j initialization. The database contains:
- 70 entities (by type as above)
- 14 mythology narratives
- 42 historical events
- 5 primary sources with citations

## Next Steps

- [ ] Frontend UI for entity exploration
- [ ] React Flow visualization for relationships
- [ ] Relationship creation (parents, allies, enemies)
- [ ] Advanced path finding algorithms
- [ ] Semantic similarity search with embeddings

## License

Internal project - UX Lab

## Contact

For questions or contributions, reach out to the UX Lab team.
