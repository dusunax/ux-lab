/**
 * MythGraph - Homepage
 *
 * Landing page for the Neo4j knowledge graph of Greek & Roman mythology.
 */

'use client';

import { GraphDemo } from './components/GraphDemo';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-myth-abyss via-myth-night to-myth-slate">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-myth-primary mb-4">
            🏛️ MythGraph
          </h1>
          <p className="text-2xl text-myth-secondary mb-8">
            Neo4j Knowledge Graph of Greek & Roman Mythology
          </p>
          <p className="text-myth-muted max-w-2xl mx-auto mb-8">
            Explore the interconnected world of gods, heroes, monsters, and places
            through an interactive knowledge graph powered by Neo4j.
          </p>
        </div>

        {/* Interactive Graph Demo */}
        <div className="mb-12">
          <GraphDemo />
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-6">
            <div className="text-4xl font-bold text-myth-deity">27</div>
            <div className="text-myth-secondary mt-2">Deities</div>
          </div>
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-6">
            <div className="text-4xl font-bold text-myth-human">26</div>
            <div className="text-myth-secondary mt-2">Heroes</div>
          </div>
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-6">
            <div className="text-4xl font-bold text-myth-monster">6</div>
            <div className="text-myth-secondary mt-2">Monsters</div>
          </div>
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-6">
            <div className="text-4xl font-bold text-myth-place">14</div>
            <div className="text-myth-secondary mt-2">Myths</div>
          </div>
        </div>

        {/* API Section */}
        <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-myth-primary mb-6">📡 GraphQL API</h2>
          <p className="text-myth-secondary mb-6">
            Access the MythGraph knowledge graph through our GraphQL API.
          </p>
          <div className="space-y-4">
            <a
              href="/api/graphql"
              className="inline-block bg-myth-gold hover:bg-myth-amber text-myth-abyss font-semibold py-3 px-8 rounded-lg transition"
            >
              🚀 Open GraphQL Playground
            </a>
            <p className="text-myth-muted text-sm">
              Query entities, relationships, myths, and events in real-time.
            </p>
          </div>
        </div>

        {/* Example Queries */}
        <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-8">
          <h2 className="text-3xl font-bold text-myth-primary mb-6">📝 Example Queries</h2>
          <div className="space-y-4">
            <div className="bg-myth-abyss/50 rounded p-4">
              <p className="text-myth-muted text-sm mb-2">Search for an entity:</p>
              <code className="text-myth-gold font-mono text-sm">
                {`query { searchEntities(query: "Zeus") { entity { name type } matchScore } }`}
              </code>
            </div>
            <div className="bg-myth-abyss/50 rounded p-4">
              <p className="text-myth-muted text-sm mb-2">Get a specific entity:</p>
              <code className="text-myth-gold font-mono text-sm">
                {`query { getEntity(id: "entity_zeus_001") { name type description } }`}
              </code>
            </div>
            <div className="bg-myth-abyss/50 rounded p-4">
              <p className="text-myth-muted text-sm mb-2">List all entity types:</p>
              <code className="text-myth-gold font-mono text-sm">
                {`query { listEntityTypes }`}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-myth-muted">
          <p>
            MythGraph • Sprint 1 • Built with Next.js, GraphQL & Neo4j
          </p>
        </footer>
      </div>
    </main>
  );
}
