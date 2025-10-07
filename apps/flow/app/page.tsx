import FlowSection from "./components/FlowSection";

export default function FlowPage() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="bg-blue-500 text-white p-4 flex justify-center items-center gap-2 text-center">
        <h1 className="text-xl font-bold">UX Flow</h1>
        <p className="text-sm opacity-90">React Flow, Tailwind CSS</p>
      </div>
      <FlowSection />
    </div>
  );
}
