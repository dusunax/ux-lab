"use client";

import { useState } from "react";
import { Download, Plus, ChevronRight } from "lucide-react";
import { PersonaSidebar } from "@/features/persona/PersonaSidebar";
import { PersonaForm } from "@/features/persona/PersonaForm";
import { PromptPreview } from "@/features/prompt/PromptPreview";
import { TrackList } from "@/features/track/TrackList";
import { PlayerBar } from "@/components/PlayerBar";
import { usePersona } from "@/features/persona/usePersona";
import { useTrack } from "@/features/track/useTrack";
import { exportAlbum } from "@/lib/exportAlbum";
import { VideoRender } from "@/features/video/VideoRender";
import { TrackEditForm } from "@/features/track/TrackEditForm";
import { Track } from "@/lib/types";

type Panel = "tracks" | "prompt" | "edit" | "video";

export default function Home() {
  const { personas, activePersona, activeId, setActiveId, addPersona, updatePersona } = usePersona();
  const { tracks, activeTrack, activeTrackId, setActiveTrackId, addTrack, updateTrack, removeTrack, tracksByPersona } = useTrack();
  const [panel, setPanel] = useState<Panel>("tracks");
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  const currentTracks = activePersona ? tracksByPersona(activePersona.id) : [];

  const handleAddTrack = (title: string, prompt: string, lyrics: string, tags: string[], audioUrl: string) => {
    if (!activePersona) return;
    addTrack({
      personaId: activePersona.id,
      title,
      prompt,
      lyrics,
      tags,
      audioUrl,
      coverImageUrl: activePersona.coverImageUrl,
    });
    setPanel("tracks");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <PersonaSidebar
          personas={personas}
          activeId={activeId}
          onSelect={(id) => { setActiveId(id); setPanel("tracks"); setShowNewForm(false); }}
          onNew={() => { setShowNewForm(true); setActiveId(null); }}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-elevated/60 to-bg">
          {showNewForm ? (
            <div className="flex-1 overflow-y-auto p-8 max-w-lg">
              <h2 className="text-lg font-bold mb-6">새 AI 뮤지션 만들기</h2>
              <PersonaForm
                onSubmit={(data) => { addPersona(data); setShowNewForm(false); setPanel("tracks"); }}
                onCancel={() => setShowNewForm(false)}
              />
            </div>
          ) : activePersona ? (
            <>
              {/* Persona header */}
              <div className="flex items-end gap-6 p-8 pb-6">
                {activePersona.coverImageUrl ? (
                  <img src={activePersona.coverImageUrl} alt={activePersona.name} className="w-32 h-32 rounded-md shadow-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-32 h-32 rounded-md bg-elevated shadow-2xl flex items-center justify-center shrink-0">
                    <span className="text-4xl font-bold text-muted">{activePersona.name[0]}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted uppercase tracking-widest mb-1">AI Musician</p>
                  <h1 className="text-4xl font-black truncate">{activePersona.name}</h1>
                  <p className="text-muted mt-1 text-sm">{activePersona.genre}</p>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex items-center gap-1 px-8 border-b border-border">
                {(["tracks", "prompt", "edit", "video"] as Panel[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPanel(p)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      panel === p
                        ? "border-accent text-accent"
                        : "border-transparent text-muted hover:text-text"
                    }`}
                  >
                    {{ tracks: "트랙", prompt: "프롬프트 생성", edit: "뮤지션 편집", video: "영상 제작" }[p]}
                  </button>
                ))}
                <div className="flex-1" />
                {panel === "tracks" && (
                  <div className="flex items-center gap-2 pb-0.5">
                    <button
                      onClick={() => exportAlbum(activePersona, currentTracks)}
                      disabled={currentTracks.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-text border border-border rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Download size={12} /> JSON 내보내기
                    </button>
                    <button
                      onClick={() => setPanel("prompt")}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-bg rounded-full font-semibold hover:bg-accent-dark transition-colors"
                    >
                      <Plus size={12} /> 트랙 추가
                    </button>
                  </div>
                )}
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto p-8">
                {panel === "tracks" && !editingTrack && (
                  <TrackList
                    tracks={currentTracks}
                    activeTrackId={activeTrackId}
                    onSelect={setActiveTrackId}
                    onEdit={setEditingTrack}
                    onRemove={removeTrack}
                  />
                )}
                {panel === "tracks" && editingTrack && (
                  <div className="max-w-lg">
                    <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-5">트랙 수정</h2>
                    <TrackEditForm
                      track={editingTrack}
                      onSubmit={(patch) => { updateTrack(editingTrack.id, patch); setEditingTrack(null); }}
                      onCancel={() => setEditingTrack(null)}
                    />
                  </div>
                )}
                {panel === "prompt" && (
                  <div className="max-w-lg">
                    <PromptPreview persona={activePersona} onAddTrack={handleAddTrack} />
                  </div>
                )}
                {panel === "edit" && (
                  <div className="max-w-lg">
                    <PersonaForm
                      initial={activePersona}
                      onSubmit={(data) => { updatePersona(activePersona.id, data); setPanel("tracks"); }}
                      onCancel={() => setPanel("tracks")}
                    />
                  </div>
                )}
                {panel === "video" && (
                  <div className="max-w-lg">
                    <VideoRender persona={activePersona} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-2xl font-bold text-muted">AI 뮤지션을 선택하세요</p>
              <p className="text-sm text-border">왼쪽에서 뮤지션을 선택하거나 새로 만들어보세요.</p>
              <button
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg rounded-full font-semibold text-sm hover:bg-accent-dark transition-colors"
              >
                <Plus size={16} /> 첫 뮤지션 만들기
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Player bar */}
      <PlayerBar track={activeTrack} />
    </div>
  );
}
