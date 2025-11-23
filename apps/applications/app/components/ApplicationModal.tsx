"use client";

import { Application } from "../types/application";
import ApplicationForm from "./ApplicationForm";
import { Modal } from "@ux-lab/ui";

interface ApplicationModalProps {
  isOpen: boolean;
  application?: Application;
  onClose: () => void;
  onSubmit: (data: Omit<Application, "id" | "createdAt" | "updatedAt">) => void;
  applications?: Array<{ appliedDate: string }>;
}

export default function ApplicationModal({
  isOpen,
  application,
  onClose,
  onSubmit,
  applications = [],
}: ApplicationModalProps) {
  const handleSubmit = (
    data: Omit<Application, "id" | "createdAt" | "updatedAt">
  ) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="z-[99]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-soft-pink via-soft-blue to-soft-teal bg-clip-text text-transparent">
            {application ? "지원 현황 수정" : "새 지원 추가"}
          </h2>
        </div>
        <ApplicationForm
          application={application}
          onSubmit={handleSubmit}
          onCancel={onClose}
          applications={applications}
        />
      </div>
    </Modal>
  );
}
