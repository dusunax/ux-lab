/**
 * Apollo Client 설정
 *
 * GraphQL 쿼리 캐싱 및 최적화를 위한 Apollo Client 인스턴스
 */

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

// 에러 로깅 링크
const errorLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    if (response.errors) {
      console.error('[GraphQL] Errors:', response.errors);
    }
    return response;
  });
});

// HTTP 링크 (GraphQL 엔드포인트)
const httpLink = new HttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin',
});

// Apollo Cache 설정
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // 노드별 관계 캐싱 (entityId와 relationshipType으로 구분)
        getRelationships: {
          keyArgs: ['entityId', 'relationshipType'],
        },
        // 경로 캐싱 (fromId와 toId로 구분)
        getNearestPath: {
          keyArgs: ['fromId', 'toId'],
        },
        // 엔티티 검색 결과 캐싱
        searchEntities: {
          keyArgs: ['query', 'type'],
        },
      },
    },
  },
});

// Apollo Client 인스턴스
export const apolloClient = new ApolloClient({
  ssrMode: typeof window === 'undefined',
  link: errorLink.concat(httpLink),
  cache,
  connectToDevTools: false,
});

export { cache };
