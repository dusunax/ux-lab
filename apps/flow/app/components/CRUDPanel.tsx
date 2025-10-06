"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CRUDPanelProps {
  onAddNode: (type: "classNode" | "instanceNode") => void;
  onUpdateNode: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
  onAddEdge: (source: string, target: string, label: string) => void;
  onUpdateEdge: (id: string, label: string) => void;
  onDeleteEdge: (id: string) => void;
  selectedNode?: any;
  selectedEdge?: any;
}

const CRUDPanel = ({
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
  selectedNode,
  selectedEdge,
}: CRUDPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      className="fixed right-0 top-0 h-full bg-white shadow-lg flex"
      initial={{ width: "320px" }}
      animate={{ width: isExpanded ? "320px" : "40px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-0 top-1/2 -translate-x-full transform bg-white p-2 rounded-l-lg shadow-lg"
      >
        {isExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div className={`w-full p-4 ${!isExpanded ? "hidden" : ""}`}>
        <h2 className="text-xl font-bold mb-4">Flow Editor</h2>
        
        <div className="space-y-6">
          {/* Add Node Section */}
          <section>
            <h3 className="text-lg font-semibold mb-2">Add Node</h3>
            <div className="space-y-2">
              <button
                onClick={() => onAddNode("classNode")}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Class Node
              </button>
              <button
                onClick={() => onAddNode("instanceNode")}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Instance Node
              </button>
            </div>
          </section>

          {/* Selected Node Section */}
          {selectedNode && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Selected Node</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      ...selectedNode.data,
                      label: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
                <button
                  onClick={() => onDeleteNode(selectedNode.id)}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete Node
                </button>
              </div>
            </section>
          )}

          {/* Selected Edge Section */}
          {selectedEdge && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Selected Edge</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={selectedEdge.label}
                  onChange={(e) =>
                    onUpdateEdge(selectedEdge.id, e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded"
                />
                <button
                  onClick={() => onDeleteEdge(selectedEdge.id)}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete Edge
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CRUDPanel;
