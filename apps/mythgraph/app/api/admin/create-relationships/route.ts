/**
 * Admin API: Create relationships from entity data
 *
 * POST /api/admin/create-relationships
 *
 * ⚠️ Development only - should be restricted in production
 */

import { getSession } from '@/src/server/neo4j';
import { relationshipsData } from '@/scripts/relationships-data';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 간단한 인증 체크 (개발용)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer dev-')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = getSession();

    try {
      let count = 0;

      // relationshipsData에서 모든 관계를 생성
      for (const rel of relationshipsData) {
        await session.run(
          `MATCH (p:Entity {id: $parentId}) MATCH (c:Entity {id: $childId})
           MERGE (p)-[r:PARENT]->(c) SET r.label = 'PARENT'`,
          { parentId: rel.parent, childId: rel.child }
        );
        count++;
      }

      console.log(`[Relationships] Created ${count} PARENT relationships`);

      // 추가 관계 (부부, 형제, 보호자 등)
      const additionalQueries = [
        // 부부 관계 (SPOUSE)
        `MATCH (z:Entity {id: 'entity_zeus_001'}) MATCH (h:Entity {id: 'entity_hera_001'})
         MERGE (z)-[r:SPOUSE]->(h) SET r.label = 'SPOUSE'`,

        // 형제 관계 (SIBLING) - 같은 부모를 가진 entities
        `MATCH (a:Entity {id: 'entity_zeus_001'}) MATCH (b:Entity {id: 'entity_poseidon_001'})
         MERGE (a)-[r:SIBLING]->(b) SET r.label = 'SIBLING'`,
        `MATCH (a:Entity {id: 'entity_zeus_001'}) MATCH (b:Entity {id: 'entity_hades_001'})
         MERGE (a)-[r:SIBLING]->(b) SET r.label = 'SIBLING'`,
        `MATCH (a:Entity {id: 'entity_apollo_001'}) MATCH (b:Entity {id: 'entity_artemis_001'})
         MERGE (a)-[r:SIBLING]->(b) SET r.label = 'SIBLING'`,

        // 보호자 관계 (PROTECTOR)
        `MATCH (a:Entity {id: 'entity_athena_001'}) MATCH (b:Entity {id: 'entity_odysseus_001'})
         MERGE (a)-[r:PROTECTOR]->(b) SET r.label = 'PROTECTOR'`,
        `MATCH (a:Entity {id: 'entity_poseidon_001'}) MATCH (b:Entity {id: 'entity_odysseus_001'})
         MERGE (a)-[r:ENEMY]->(b) SET r.label = 'ENEMY'`,
      ];

      for (const query of additionalQueries) {
        await session.run(query);
        count++;
      }

      // 통계 확인
      const statsResult = await session.run(`MATCH ()-[r]->() RETURN count(distinct r) as count`);
      const totalCount = statsResult.records[0]?.get('count') || 0;
      console.log(`[Relationships] Total relationships: ${totalCount}`);

      return NextResponse.json({
        success: true,
        message: `Created ${count} relationships`,
        totalCount: count,
      });

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('[admin/create-relationships]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
