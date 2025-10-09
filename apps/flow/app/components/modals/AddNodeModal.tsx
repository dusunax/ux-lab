"use client";

import { sanitizeNodeLabel } from "../../utils/sanitize";
import { Modal } from "../common/Modal";
import { ActionButton, InputField } from "../common/Panel";

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingNodeType: "classNode" | "instanceNode" | null;
  pendingNodeId: string;
  setPendingNodeId: (id: string) => void;
  pendingNodeLabel: string;
  setPendingNodeLabel: (label: string) => void;
  onAddNode: (
    type: "classNode" | "instanceNode",
    id: string,
    label: string
  ) => boolean;
}

export const AddNodeModal = ({
  isOpen,
  onClose,
  pendingNodeType,
  pendingNodeId,
  setPendingNodeId,
  pendingNodeLabel,
  setPendingNodeLabel,
  onAddNode,
}: AddNodeModalProps) => {
  const handleSubmit = () => {
    if (!pendingNodeLabel) {
      alert("Please enter a node label");
      return;
    }
    if (
      pendingNodeType &&
      onAddNode(pendingNodeType, pendingNodeId, pendingNodeLabel)
    ) {
      onClose();
    }
  };

  const sanitizedNodeLabel = sanitizeNodeLabel(pendingNodeLabel);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add ${
        pendingNodeType === "classNode" ? "Class" : "Instance"
      } Node`}
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Node Label
            </label>
            <InputField
              value={pendingNodeLabel}
              onChange={setPendingNodeLabel}
              placeholder="Enter node label"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Node ID
            </label>
            <InputField
              value={pendingNodeId || sanitizedNodeLabel}
              onChange={setPendingNodeId}
              placeholder="Enter unique node ID"
              className={pendingNodeId ? "" : "text-gray-300"}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <ActionButton
            onClick={onClose}
            variant="primary"
            size="sm"
            className="!bg-gray-500 hover:!bg-gray-600"
          >
            Cancel
          </ActionButton>
          <ActionButton
            onClick={handleSubmit}
            variant="primary"
            size="sm"
            className={
              pendingNodeLabel ? "" : "!bg-gray-400 hover:!bg-gray-600"
            }
          >
            Add Node
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
};
