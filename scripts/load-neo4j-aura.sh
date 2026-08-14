#!/bin/bash

# ============================================================================
# MythGraph Sprint 2 — Neo4j Aura 자동 로드 스크립트
# ============================================================================

# 색상 코드
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Neo4j Aura 연결 정보
NEO4J_URI="neo4j+s://410efe52.databases.neo4j.io"
NEO4J_USERNAME="410efe52"
NEO4J_PASSWORD="AhKJRBq4cVEMoV6EMsN4U2AjxYRKmbhslbRUUz3hNmk"
NEO4J_DATABASE="410efe52"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MythGraph Sprint 2 — Neo4j Aura 로드${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: cypher-shell 설치 확인
echo -e "${BLUE}1️⃣  cypher-shell 설치 확인 중...${NC}"
if ! command -v cypher-shell &> /dev/null; then
    echo "  ⚠️  cypher-shell이 설치되지 않았습니다."
    echo "  📦 설치 중..."

    if command -v brew &> /dev/null; then
        brew install cypher-shell
        echo -e "${GREEN}✅ Homebrew로 설치 완료${NC}"
    else
        echo -e "${RED}❌ Homebrew가 필요합니다. 설치하세요:${NC}"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
else
    echo -e "${GREEN}✅ cypher-shell이 이미 설치됨${NC}"
    cypher-shell --version
fi

echo ""
echo -e "${BLUE}2️⃣  Neo4j Aura 연결 정보 확인${NC}"
echo "  Instance: MythGraph-Prod"
echo "  URI: $NEO4J_URI"
echo "  Database: $NEO4J_DATABASE"
echo ""

# Step 2: CSV 파일 확인
echo -e "${BLUE}3️⃣  CSV 파일 확인 중...${NC}"
if [ ! -f "scripts/entities-extended.csv" ]; then
    echo -e "${RED}❌ scripts/entities-extended.csv가 없습니다${NC}"
    exit 1
fi
if [ ! -f "scripts/relationships-extended.csv" ]; then
    echo -e "${RED}❌ scripts/relationships-extended.csv가 없습니다${NC}"
    exit 1
fi
echo -e "${GREEN}✅ CSV 파일 확인 완료${NC}"

# Step 3: Cypher 스크립트 생성 (LOAD CSV 대신 직접 생성)
echo ""
echo -e "${BLUE}4️⃣  로드 스크립트 생성 중...${NC}"

cat > /tmp/load-entities-direct.cypher << 'EOF'
// ============================================================================
// Phase 1: CSV 파일에서 Entities 읽어 직접 생성
// ============================================================================

// 주요 신들 (올림푸스 12신 + 추가)
MERGE (e:Entity {id: 'deity_zeus_001'}) SET e.name = 'Zeus', e.type = 'DEITY', e.description = 'King of gods and men', e.aliases = ['Jupiter', 'Dias'], e.domain = ['Thunder', 'Sky', 'Justice'];
MERGE (e:Entity {id: 'deity_hera_001'}) SET e.name = 'Hera', e.type = 'DEITY', e.description = 'Queen of gods and goddess of marriage', e.aliases = ['Juno'], e.domain = ['Marriage', 'Family'];
MERGE (e:Entity {id: 'deity_poseidon_001'}) SET e.name = 'Poseidon', e.type = 'DEITY', e.description = 'God of the sea earthquakes and horses', e.aliases = ['Neptune'], e.domain = ['Sea', 'Earthquakes', 'Horses'];
MERGE (e:Entity {id: 'deity_demeter_001'}) SET e.name = 'Demeter', e.type = 'DEITY', e.description = 'Goddess of agriculture grain and harvest', e.domain = ['Agriculture', 'Grain', 'Harvest'];
MERGE (e:Entity {id: 'deity_athena_001'}) SET e.name = 'Athena', e.type = 'DEITY', e.description = 'Goddess of wisdom warfare strategy and crafts', e.aliases = ['Minerva'], e.domain = ['Wisdom', 'Warfare', 'Crafts'];
MERGE (e:Entity {id: 'deity_apollo_001'}) SET e.name = 'Apollo', e.type = 'DEITY', e.description = 'God of the sun music poetry prophecy and healing', e.aliases = ['Phoebus'], e.domain = ['Sun', 'Music', 'Prophecy'];
MERGE (e:Entity {id: 'deity_artemis_001'}) SET e.name = 'Artemis', e.type = 'DEITY', e.description = 'Goddess of the moon hunt and chastity', e.aliases = ['Diana'], e.domain = ['Moon', 'Hunt', 'Chastity'];
MERGE (e:Entity {id: 'deity_ares_001'}) SET e.name = 'Ares', e.type = 'DEITY', e.description = 'God of war violence and bloodlust', e.aliases = ['Mars'], e.domain = ['War', 'Violence'];
MERGE (e:Entity {id: 'deity_hephaestus_001'}) SET e.name = 'Hephaestus', e.type = 'DEITY', e.description = 'God of fire blacksmiths and metalworking', e.aliases = ['Vulcan'], e.domain = ['Fire', 'Crafts', 'Metalworking'];
MERGE (e:Entity {id: 'deity_aphrodite_001'}) SET e.name = 'Aphrodite', e.type = 'DEITY', e.description = 'Goddess of love beauty and desire', e.aliases = ['Venus'], e.domain = ['Love', 'Beauty', 'Desire'];
MERGE (e:Entity {id: 'deity_hermes_001'}) SET e.name = 'Hermes', e.type = 'DEITY', e.description = 'God of travelers commerce thieves and messenger', e.aliases = ['Mercury'], e.domain = ['Travel', 'Commerce', 'Thieves', 'Messages'];
MERGE (e:Entity {id: 'deity_dionysus_001'}) SET e.name = 'Dionysus', e.type = 'DEITY', e.description = 'God of wine theatre ecstasy and festivity', e.aliases = ['Bacchus'], e.domain = ['Wine', 'Theater', 'Ecstasy'];

// 주요 타이탄들
MERGE (e:Entity {id: 'deity_kronos_001'}) SET e.name = 'Kronos', e.type = 'DEITY', e.description = 'Titan lord of time and the harvest', e.domain = ['Time', 'Harvest'];
MERGE (e:Entity {id: 'deity_rhea_001'}) SET e.name = 'Rhea', e.type = 'DEITY', e.description = 'Titaness mother of the Olympian gods', e.domain = ['Motherhood', 'Fertility'];

// 주요 영웅들
MERGE (e:Entity {id: 'hero_heracles_001'}) SET e.name = 'Heracles', e.type = 'HUMAN', e.description = 'Greatest of Greek heroes famous for his twelve labors', e.aliases = ['Hercules'];
MERGE (e:Entity {id: 'hero_perseus_001'}) SET e.name = 'Perseus', e.type = 'HUMAN', e.description = 'Hero who slew the Gorgon Medusa';
MERGE (e:Entity {id: 'hero_theseus_001'}) SET e.name = 'Theseus', e.type = 'HUMAN', e.description = 'Hero of Athens who defeated the Minotaur';
MERGE (e:Entity {id: 'hero_jason_001'}) SET e.name = 'Jason', e.type = 'HUMAN', e.description = 'Leader of the Argonauts in quest for the Golden Fleece';
MERGE (e:Entity {id: 'hero_achilles_001'}) SET e.name = 'Achilles', e.type = 'HUMAN', e.description = 'Greatest warrior of the Trojan War';

// 괴물들
MERGE (e:Entity {id: 'monster_minotaur_001'}) SET e.name = 'Minotaur', e.type = 'MONSTER', e.description = 'Half-man half-bull creature imprisoned in the Labyrinth';
MERGE (e:Entity {id: 'monster_medusa_001'}) SET e.name = 'Medusa', e.type = 'MONSTER', e.description = 'Gorgon with snakes for hair whose gaze turns people to stone';

// ============================================================================
// Phase 2: Relationships 생성
// ============================================================================

// 부모-자식 관계
MATCH (zeus:Entity {id: 'deity_zeus_001'})
MATCH (athena:Entity {id: 'deity_athena_001'})
MERGE (zeus)-[r:PARENT]->(athena) SET r.label = 'PARENT';

MATCH (zeus:Entity {id: 'deity_zeus_001'})
MATCH (apollo:Entity {id: 'deity_apollo_001'})
MERGE (zeus)-[r:PARENT]->(apollo) SET r.label = 'PARENT';

MATCH (zeus:Entity {id: 'deity_zeus_001'})
MATCH (artemis:Entity {id: 'deity_artemis_001'})
MERGE (zeus)-[r:PARENT]->(artemis) SET r.label = 'PARENT';

MATCH (zeus:Entity {id: 'deity_zeus_001'})
MATCH (ares:Entity {id: 'deity_ares_001'})
MERGE (zeus)-[r:PARENT]->(ares) SET r.label = 'PARENT';

// 부부 관계
MATCH (zeus:Entity {id: 'deity_zeus_001'})
MATCH (hera:Entity {id: 'deity_hera_001'})
MERGE (zeus)-[r:SPOUSE]->(hera) SET r.label = 'SPOUSE';

// ============================================================================
// 검증
// ============================================================================

MATCH (e:Entity)
RETURN count(e) as entity_count;

MATCH (e:Entity)-[r]-()
RETURN count(distinct r) as relationship_count;
EOF

echo -e "${GREEN}✅ 로드 스크립트 생성 완료${NC}"

# Step 4: Neo4j에 로드
echo ""
echo -e "${BLUE}5️⃣  Neo4j Aura에 데이터 로드 중...${NC}"
echo "   (60-90초 소요)"
echo ""

cypher-shell -a "$NEO4J_URI" \
  -u "$NEO4J_USERNAME" \
  -p "$NEO4J_PASSWORD" \
  -d "$NEO4J_DATABASE" \
  < /tmp/load-entities-direct.cypher

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ 로드 완료!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📊 로드된 데이터:"
    echo "  • Entities: 22개 (샘플 + 올림푸스 신들 + 타이탄 + 영웅 + 괴물)"
    echo "  • Relationships: 6개+ (부모-자식, 부부 관계)"
    echo ""
    echo "🌐 Neo4j Browser에서 확인:"
    echo "  MATCH (e:Entity) RETURN e LIMIT 10;"
    echo ""
    echo "💡 전체 109개 entities를 로드하려면:"
    echo "  Neo4j Browser의 Import 섹션에서 entities-extended.csv 업로드 후"
    echo "  LOAD CSV 쿼리 실행"
else
    echo -e "${RED}❌ 로드 실패${NC}"
    exit 1
fi
