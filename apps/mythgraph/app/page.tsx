/**
 * MythGraph - Homepage
 *
 * Landing page for the Neo4j knowledge graph of Greek & Roman mythology.
 */

'use client';

import { GraphDemo } from './components/GraphDemo';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            🏛️ MythGraph
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Neo4j Knowledge Graph of Greek & Roman Mythology
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
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
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="text-4xl font-bold text-blue-400">27</div>
            <div className="text-gray-300 mt-2">Deities</div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="text-4xl font-bold text-purple-400">26</div>
            <div className="text-gray-300 mt-2">Heroes</div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="text-4xl font-bold text-red-400">6</div>
            <div className="text-gray-300 mt-2">Monsters</div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="text-4xl font-bold text-green-400">14</div>
            <div className="text-gray-300 mt-2">Myths</div>
          </div>
        </div>

        {/* API Section */}
        <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">📡 GraphQL API</h2>
          <p className="text-gray-300 mb-6">
            Access the MythGraph knowledge graph through our GraphQL API.
          </p>
          <div className="space-y-4">
            <a
              href="/api/graphql"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              🚀 Open GraphQL Playground
            </a>
            <p className="text-gray-400 text-sm">
              Query entities, relationships, myths, and events in real-time.
            </p>
          </div>
        </div>

        {/* Example Queries */}
        <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-6">📝 Example Queries</h2>
          <div className="space-y-4">
            <div className="bg-black/30 rounded p-4">
              <p className="text-gray-400 text-sm mb-2">Search for an entity:</p>
              <code className="text-green-400 font-mono text-sm">
                {`query { searchEntities(query: "Zeus") { entity { name type } matchScore } }`}
              </code>
            </div>
            <div className="bg-black/30 rounded p-4">
              <p className="text-gray-400 text-sm mb-2">Get a specific entity:</p>
              <code className="text-green-400 font-mono text-sm">
                {`query { getEntity(id: "entity_zeus_001") { name type description } }`}
              </code>
            </div>
            <div className="bg-black/30 rounded p-4">
              <p className="text-gray-400 text-sm mb-2">List all entity types:</p>
              <code className="text-green-400 font-mono text-sm">
                {`query { listEntityTypes }`}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-400">
          <p>
            MythGraph • Sprint 1 • Built with Next.js, GraphQL & Neo4j
          </p>
        </footer>
      </div>
    </main>
  );
}
