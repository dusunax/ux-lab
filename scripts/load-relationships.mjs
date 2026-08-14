#!/usr/bin/env node

import neo4j from 'neo4j-driver';
import fs from 'fs';
import csv from 'csv-parse/sync';

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'dev_password_123';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

async function loadRelationships() {
  const driver = neo4j.default.driver(NEO4J_URI, neo4j.default.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    let relationshipCount = 0;

    // CSV 파일 읽기
    const csvData = fs.readFileSync('scripts/entities.csv', 'utf-8');
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📖 Processing ${records.length} entities...`);

    // parentageIds 관계 생성
    for (const row of records) {
      const childId = row.id;

      if (row.parentageIds && row.parentageIds.trim()) {
        const parentIds = row.parentageIds.split('|');
        for (const parentId of parentIds) {
          if (parentId.trim()) {
            await session.run(
              `
              MATCH (parent:Entity {id: $parentId})
              MATCH (child:Entity {id: $childId})
              MERGE (parent)-[r:PARENT]->(child)
              SET r.label = 'PARENT'
              `,
              {
                parentId: parentId.trim(),
                childId,
              }
            );
            relationshipCount++;
          }
        }
      }
    }

    // 추가 관계 생성
    await session.run(
      `
      MATCH (zeus:Entity {id: 'entity_zeus_001'})
      MATCH (hera:Entity {id: 'entity_hera_001'})
      MERGE (zeus)-[r:SPOUSE]->(hera)
      SET r.label = 'SPOUSE'
      `
    );
    relationshipCount++;

    console.log(`✅ Loaded ${relationshipCount} parent/spouse relationships`);

    // 검증
    const result = await session.run('MATCH ()-[r]->() RETURN count(distinct r) as count');
    const { count } = result.records[0].toObject();
    console.log(`📊 Total relationships in DB: ${count}`);

  } finally {
    await session.close();
    await driver.close();
  }
}

loadRelationships()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
