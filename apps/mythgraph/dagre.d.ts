declare module 'dagre' {
  export namespace graphlib {
    interface GraphOptions {
      rankdir?: string;
      compound?: boolean;
      [key: string]: any;
    }

    interface Node {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      [key: string]: any;
    }

    class Graph {
      constructor(options?: GraphOptions);
      setDefaultEdgeLabel(fn: (e: any) => any): void;
      setNode(id: string, label: Node): void;
      setEdge(source: string, target: string, label?: any): void;
      nodes(): string[];
      node(id: string): Node | undefined;
    }
  }

  export function layout(graph: any): void;
}
