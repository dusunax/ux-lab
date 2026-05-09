import { Suspense } from "react";

export default function Step2Layout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
