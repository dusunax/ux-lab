#!/usr/bin/env python3
"""
Load relationships from entities.csv into Neo4j
"""

import csv
from neo4j import GraphDatabase
import os

# Neo4j 연결 정보 (현재는 localhost 기본값, 필요시 변경)
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "dev_password_123")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

def load_relationships():
    """Load relationships from CSV"""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

    try:
        with driver.session(database=NEO4J_DATABASE) as session:
            relationship_count = 0

            # CSV 파일 읽기
            with open('scripts/entities.csv', 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)

                for row in reader:
                    entity_id = row['id']

                    # parentageIds 처리 (부모 관계)
                    if row.get('parentageIds'):
                        parent_ids = row['parentageIds'].split('|')
                        for parent_id in parent_ids:
                            if parent_id.strip():
                                session.run(
                                    """
                                    MATCH (parent:Entity {id: $parent_id})
                                    MATCH (child:Entity {id: $child_id})
                                    MERGE (parent)-[r:PARENT]->(child)
                                    SET r.label = 'PARENT'
                                    """,
                                    parent_id=parent_id.strip(),
                                    child_id=entity_id
                                )
                                relationship_count += 1

                    # childrenIds 처리 (자식 관계)
                    # parentageIds로 이미 처리되었으므로 스킵 (중복 방지)

            # 몇몇 추가 관계 생성
            # Zeus와 Hera의 배우자 관계
            session.run(
                """
                MATCH (zeus:Entity {id: 'entity_zeus_001'})
                MATCH (hera:Entity {id: 'entity_hera_001'})
                MERGE (zeus)-[r:SPOUSE]->(hera)
                SET r.label = 'SPOUSE'
                """
            )
            relationship_count += 1

            # Poseidon과 Amphitrite 관계 (mythological spouse)
            session.run(
                """
                MATCH (poseidon:Entity {id: 'entity_poseidon_001'})
                MATCH (hades:Entity {id: 'entity_hades_001'})
                MERGE (poseidon)-[r:SIBLING]->(hades)
                SET r.label = 'SIBLING'
                """
            )
            relationship_count += 1

            print(f"✅ Loaded {relationship_count} relationships")

            # 검증
            result = session.run("MATCH ()-[r]->() RETURN count(distinct r) as count")
            record = result.single()
            print(f"📊 Total relationships in DB: {record['count']}")

    finally:
        driver.close()

if __name__ == "__main__":
    print("Loading relationships from entities.csv into Neo4j...")
    load_relationships()
    print("Done!")
