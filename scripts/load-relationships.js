#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 간단한 CSV 파서
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    // 간단한 CSV 파싱 (따옴표 처리 안함)
    const values = lines[i].split(',');
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    rows.push(obj);
  }

  return rows;
}

async function createRelationships() {
  try {
    // CSV 읽기
    const csvPath = path.join(process.cwd(), 'scripts', 'entities.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const entities = parseCSV(csvText);

    console.log(`📖 Processing ${entities.length} entities...`);

    let relationshipCount = 0;

    // 모든 entity의 parentageIds를 사용해서 PARENT 관계 생성
    for (const entity of entities) {
      if (entity.parentageIds && entity.parentageIds.trim()) {
        const parentIds = entity.parentageIds.split('|');

        for (const parentId of parentIds) {
          if (parentId.trim()) {
            // GraphQL query로 관계 생성 (createRelationship mutation이 있다면)
            // 여기서는 직접 Neo4j로 연결해서 생성
            console.log(`  Creating PARENT relation: ${parentId.trim()} -> ${entity.id}`);
            relationshipCount++;
          }
        }
      }
    }

    console.log(`✅ Will create ${relationshipCount} parent relationships`);
    console.log('');
    console.log('⚠️  현재 GraphQL API에는 mutation이 없어서 관계를 자동으로 생성할 수 없습니다.');
    console.log('📌 다음 방법 중 하나를 선택해주세요:');
    console.log('');
    console.log('1️⃣  Neo4j Browser에서 직접 관계 생성:');
    console.log('   - http://localhost:7474/ 접속 (또는 Neo4j Aura)');
    console.log('   - 다음 Cypher 쿼리 실행:');
    console.log('');

    // Cypher 쿼리 생성
    let cypherQuery = '';
    for (const entity of entities) {
      if (entity.parentageIds && entity.parentageIds.trim()) {
        const parentIds = entity.parentageIds.split('|');

        for (const parentId of parentIds) {
          if (parentId.trim()) {
            cypherQuery += `MATCH (p:Entity {id: '${parentId.trim()}'}) MATCH (c:Entity {id: '${entity.id}'}) MERGE (p)-[r:PARENT]->(c) SET r.label = 'PARENT';\n`;
          }
        }
      }
    }

    // SPOUSE 관계
    cypherQuery += `MATCH (zeus:Entity {id: 'entity_zeus_001'}) MATCH (hera:Entity {id: 'entity_hera_001'}) MERGE (zeus)-[r:SPOUSE]->(hera) SET r.label = 'SPOUSE';\n`;

    console.log(cypherQuery);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createRelationships();
