"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GameHeader } from "../features/ui/GameHeader";
import { ModalShell } from "../features/ui/ModalShell";
import { EntryPopup } from "../features/ui/EntryPopup";
import { ArchivePanel } from "../features/archive/ArchivePanel";
import { ResearchLogPanel } from "../features/research/ResearchLogPanel";
import { ObserverPanel } from "../features/observer/ObserverPanel";
import { ActiveCreaturePanel } from "../features/roster/ActiveCreaturePanel";
import { MissionsModal } from "../features/missions/MissionsModal";
import { ArchiveModal } from "../features/archive/ArchiveModal";
import { RosterModal } from "../features/roster/RosterModal";
import { ObserverTargetModal } from "../features/observer/ObserverTargetModal";
import { CreatureDetailsModal } from "../features/roster/CreatureDetailsModal";
import { Info } from "lucide-react";

import {
  type ActiveModal,
  type Creature,
  type FilterTab,
  type Interaction,
  type GameState,
  type ArchiveEntry,
  ARCHIVE_PAGE_SIZE,
  ROSTER_PAGE_SIZE,
  ACTION_TEXT,
  INTERFACE_TEXT,
  SPECIES,
  TOKEN_COST,
  getLocaleFromBrowser,
  getMissionText,
  creatureSpeciesFallback,
  evaluateMutation,
  applyRgbDelta,
  getDominantEmotion,
  saveState,
  loadState,
  createArchiveEntry,
  initialState,
  clamp,
  getObserverProfile,
  getEmotionLabel,
} from "../features/game/engine";

const archiveSort = (entries: ArchiveEntry[]) =>
  entries
    .slice()
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

export default function StellaArchivePage() {
  const [state, setState] = useState<GameState>(initialState);
  const [feedback, setFeedback] = useState<string>(INTERFACE_TEXT.en.defaultNotice);
  const [observerYaw, setObserverYaw] = useState(42);
  const [observerPitch, setObserverPitch] = useState(52);
  const [isObserverAutoTarget, setIsObserverAutoTarget] = useState(true);
  const [observerTargetId, setObserverTargetId] = useState<string | null>(null);
  const [isDraggingObserver, setIsDraggingObserver] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [rightPanel, setRightPanel] = useState<"research" | "archive">("research");
  const [archivePage, setArchivePage] = useState(0);
  const [rosterPage, setRosterPage] = useState(0);
  const [archiveFilter, setArchiveFilter] = useState<FilterTab>("all");
  const [rosterFilter, setRosterFilter] = useState<FilterTab>("all");
  const [isEntryPopupOpen, setIsEntryPopupOpen] = useState(false);
  const [hasEntryPopupUpdate, setHasEntryPopupUpdate] = useState(false);

  const observerShellRef = useRef<HTMLDivElement | null>(null);
  const observerDragState = useRef({ startX: 0, startY: 0, startYaw: 42, startPitch: 52 });
  const observerDraggingRef = useRef(false);
  const entryPopupSnapshotRef = useRef("");

  useEffect(() => {
    const next = loadState(getLocaleFromBrowser());
    setFeedback(INTERFACE_TEXT[next.locale].defaultNotice);
    setState((prev) => ({
      ...next,
      selectedCreatureId: prev.selectedCreatureId || next.selectedCreatureId,
    }));
  }, []);

  useEffect(() => saveState(state), [state]);

  const selectedCreature = useMemo(
    () => state.creatures.find((creature) => creature.id === state.selectedCreatureId) ?? state.creatures[0],
    [state.creatures, state.selectedCreatureId],
  );
  const autoTargetId = useMemo(() => selectedCreature?.id ?? null, [selectedCreature]);

  useEffect(() => {
    if (isObserverAutoTarget) {
      setObserverTargetId(autoTargetId);
      return;
    }

    if (!observerTargetId) return;
    const exists = state.creatures.some((creature) => creature.id === observerTargetId);
    if (!exists) {
      setObserverTargetId(state.creatures[0]?.id ?? null);
    }
  }, [isObserverAutoTarget, autoTargetId, observerTargetId, state.creatures]);

  useEffect(() => {
    if (rosterFilter !== "all" && !state.creatures.some((creature) => creature.speciesId === rosterFilter)) {
      setRosterFilter("all");
      setRosterPage(0);
    }
  }, [rosterFilter, state.creatures]);

  useEffect(() => {
    if (archiveFilter !== "all" && !state.archive.some((entry) => entry.species === archiveFilter)) {
      setArchiveFilter("all");
      setArchivePage(0);
    }
  }, [archiveFilter, state.archive]);

  const selectedObserverTargetId = useMemo(
    () => (isObserverAutoTarget ? autoTargetId : observerTargetId ?? state.creatures[0]?.id ?? null),
    [autoTargetId, isObserverAutoTarget, observerTargetId, state.creatures],
  );

  const observerCreature = useMemo(
    () => state.creatures.find((creature) => creature.id === selectedObserverTargetId) ?? null,
    [state.creatures, selectedObserverTargetId],
  );
  const observerProfile = useMemo(() => getObserverProfile(observerCreature), [observerCreature]);
  const observerStyle = useMemo(
    () =>
      ({
        "--lumina-core": observerCreature
          ? `rgb(${observerCreature.rgb.r}, ${observerCreature.rgb.g}, ${observerCreature.rgb.b})`
          : "rgb(128, 210, 255)",
        ...observerProfile,
      }) as React.CSSProperties,
    [observerProfile, observerCreature],
  );

  useEffect(() => {
    const snapshot = `${state.archive.length}|${state.daily.missions.length}|${
      state.daily.missions.filter((mission) => !mission.completed).length
    }|${state.daily.signal?.message ?? ""}|${
      state.daily.signal?.resolved ? 1 : 0
    }|${state.daily.signal?.rewardClaimed ? 1 : 0}|${state.researchData.observation}/${state.researchData.mutation}/${state.researchData.emotion}`;

    if (!entryPopupSnapshotRef.current) {
      entryPopupSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot !== entryPopupSnapshotRef.current) {
      setHasEntryPopupUpdate(true);
      setIsEntryPopupOpen(true);
    }

    entryPopupSnapshotRef.current = snapshot;
  }, [
    state.archive.length,
    state.daily.missions,
    state.daily.signal?.message,
    state.daily.signal?.resolved,
    state.daily.signal?.rewardClaimed,
    state.researchData.observation,
    state.researchData.mutation,
    state.researchData.emotion,
  ]);

  const uiText = INTERFACE_TEXT[state.locale];
  const actionText = ACTION_TEXT[state.locale];
  const missionText = getMissionText(state.locale);
  const missionTotal = state.daily.missions.length;
  const missionRemaining = state.daily.missions.filter((mission) => !mission.completed).length;
  const remainingMissions = state.daily.missions.filter((mission) => !mission.completed);
  const firstMission = remainingMissions[0];
  const completedMissionsCount = state.daily.missions.length - remainingMissions.length;
  const isMissionIncomplete = missionRemaining > 0;
  const isMissionRewardAvailable = missionTotal > 0 && missionRemaining === 0;
  const activeMissionActions = useMemo(() => {
    if (!isEntryPopupOpen || missionRemaining === 0) return [];
    const actions = remainingMissions.map((mission) => mission.requiredAction);
    return Array.from(new Set(actions));
  }, [isEntryPopupOpen, missionRemaining, remainingMissions]);

  const isEntryPopupHighlighted = isMissionIncomplete || isMissionRewardAvailable;
  const stellaComment =
    missionTotal === 0
      ? state.locale === "en"
        ? "Quiet day, still active."
        : "오늘도 평범한 하루입니다."
      : missionRemaining > 0
        ? state.locale === "en"
          ? "Still working on it."
          : "시간이 벌써 이렇게 되었네."
        : state.locale === "en"
          ? "All missions completed."
          : "일일 미션 끝.";

  const targetStatusText = useMemo(
    () =>
      selectedCreature
        ? firstMission
          ? state.locale === "en"
            ? `Urgent check: ${selectedCreature.nickname} (${selectedCreature.commonName}), ${actionText[firstMission.requiredAction]} is required.`
            : `긴급 점검: ${selectedCreature.nickname} (${selectedCreature.commonName})에게 ${actionText[firstMission.requiredAction]} 수행이 필요해요.`
          : state.locale === "en"
            ? `${selectedCreature.nickname} (${selectedCreature.commonName}) is ready.`
            : `${selectedCreature.nickname} (${selectedCreature.commonName})는 안정 상태입니다.`
        : "",
    [actionText, firstMission, selectedCreature, state.locale],
  );

  const rightPanelTabs = useMemo(
    () => [
      { id: "research" as const, label: state.locale === "en" ? "Research Log" : "연구 기록" },
      { id: "archive" as const, label: uiText.archive },
    ],
    [uiText.archive, state.locale],
  );
  const signalText = state.daily.signal?.message ?? uiText.noSignal;
  const signalState = state.daily.signal
    ? state.daily.signal.resolved
      ? state.daily.signal.rewardClaimed
        ? uiText.signalDone
        : uiText.resolved
      : uiText.needsAction
    : uiText.noSignal;

  const archiveSpeciesTabs = useMemo(
    () => {
      const species = new Set(state.archive.map((entry) => entry.species));
      return [{ id: "all", label: uiText.all }, ...[...species].map((name) => ({ id: name, label: name }))];
    },
    [state.archive, uiText.all],
  );
  const filteredArchiveEntries = useMemo(
    () =>
      archiveFilter === "all" ? archiveSort(state.archive) : state.archive.filter((entry) => entry.species === archiveFilter),
    [archiveFilter, state.archive],
  );
  const rosterSpeciesTabs = useMemo(() => {
    const entries: Array<{ id: string; label: string; count: number }> = [];
    const counts = new Map<string, number>();
    state.creatures.forEach((creature) => {
      counts.set(creature.speciesId, (counts.get(creature.speciesId) ?? 0) + 1);
    });

    counts.forEach((count, speciesId) => {
      const speciesName = SPECIES[speciesId]?.commonName ?? creatureSpeciesFallback(speciesId);
      entries.push({ id: speciesId, label: speciesName, count });
    });

    return [
      { id: "all", label: uiText.all, count: state.creatures.length },
      ...entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    ];
  }, [state.creatures, uiText.all]);
  const filteredRoster = useMemo(
    () =>
      rosterFilter === "all" ? state.creatures : state.creatures.filter((creature) => creature.speciesId === rosterFilter),
    [rosterFilter, state.creatures],
  );

  const archivePageCount = Math.max(1, Math.ceil(filteredArchiveEntries.length / ARCHIVE_PAGE_SIZE));
  const rosterPageCount = Math.max(1, Math.ceil(filteredRoster.length / ROSTER_PAGE_SIZE));
  const safeArchivePage = Math.min(archivePage, archivePageCount - 1);
  const safeRosterPage = Math.min(rosterPage, rosterPageCount - 1);
  const archiveSlice = filteredArchiveEntries.slice(
    safeArchivePage * ARCHIVE_PAGE_SIZE,
    safeArchivePage * ARCHIVE_PAGE_SIZE + ARCHIVE_PAGE_SIZE,
  );
  const rosterSlice = filteredRoster.slice(safeRosterPage * ROSTER_PAGE_SIZE, safeRosterPage * ROSTER_PAGE_SIZE + ROSTER_PAGE_SIZE);

  const openModal = useCallback(
    (nextModal: Exclude<ActiveModal, null>) => {
      if (nextModal === "archive") {
        setArchivePage(0);
        setArchiveFilter("all");
      }
      if (nextModal === "roster") {
        setRosterPage(0);
        setRosterFilter("all");
      }
      if (nextModal === "observer-targets") {
        setIsObserverAutoTarget(false);
        if (!state.creatures.find((creature) => creature.id === observerTargetId)) {
          setObserverTargetId(state.creatures[0]?.id ?? null);
        }
      }
      setActiveModal(nextModal);
    },
    [observerTargetId, state.creatures],
  );

  const closeModal = useCallback(() => setActiveModal(null), []);

  const performAction = useCallback((interaction: Interaction, creature: Creature) => {
    setState((prev) => {
      const locale = prev.locale;
      const localeText = INTERFACE_TEXT[locale];
      if (prev.tokens < TOKEN_COST[interaction]) {
        setFeedback(localeText.noToken);
        return prev;
      }

      let nextArchive = [...prev.archive];
      let nextFeedback = "";
      let wasCreatureFound = false;
      const prevCompletedMissionCount = prev.daily.missions.filter((mission) => mission.completed).length;

      const targets = prev.creatures.map((item) => {
        if (item.id !== creature.id) return item;
        wasCreatureFound = true;

        const nextState = { ...item.state };
        const rgbDelta: { r?: number; g?: number; b?: number } = {};

        switch (interaction) {
          case "feed":
            nextState.hunger = clamp(nextState.hunger + 24, 0, 100);
            nextState.energy = clamp(nextState.energy + 8, 0, 100);
            rgbDelta.r = 12;
            rgbDelta.g = -1;
            rgbDelta.b = -2;
            break;
          case "clean":
            nextState.cleanliness = clamp(nextState.cleanliness + 26, 0, 100);
            nextState.energy = clamp(nextState.energy + 4, 0, 100);
            rgbDelta.b = 6;
            rgbDelta.g = 2;
            break;
          case "play":
            nextState.affection = clamp(nextState.affection + 12, 0, 100);
            nextState.hunger = clamp(nextState.hunger - 5, 0, 100);
            nextState.energy = clamp(nextState.energy - 8, 0, 100);
            nextState.cleanliness = clamp(nextState.cleanliness - 6, 0, 100);
            rgbDelta.r = 11;
            rgbDelta.g = 10;
            rgbDelta.b = 1;
            break;
          case "scan":
            rgbDelta.r = 1;
            rgbDelta.g = 1;
            rgbDelta.b = 1;
            break;
          case "decorate":
            nextState.affection = clamp(nextState.affection + 6, 0, 100);
            rgbDelta.b = 12;
            rgbDelta.g = 6;
            break;
        }

        const nextRgb = applyRgbDelta(item.rgb, rgbDelta);
        const nextEmotion = getDominantEmotion(nextRgb);
        let nextCreature: Creature = {
          ...item,
          state: nextState,
          rgb: nextRgb,
          emotion: nextEmotion,
        };

        const drift = evaluateMutation(nextCreature);
        let archiveReason = "";
        if (drift.rule && SPECIES[drift.nextSpecies]) {
          const nextSpecies = SPECIES[drift.nextSpecies];
          nextCreature = {
            ...nextCreature,
            speciesId: nextSpecies.id,
            scientificName: nextSpecies.scientificName,
            commonName: nextSpecies.commonName,
            traits: nextSpecies.traits,
            mutationStage: nextCreature.mutationStage + 1,
          };
          nextArchive.unshift(
            createArchiveEntry(
              nextCreature,
              nextSpecies,
              `${drift.rule.name} discovered (${drift.rule.message[locale]})`,
            ),
          );
          archiveReason = locale === "ko" ? `${nextSpecies.commonName} 변이체로 진화했습니다` : `${nextSpecies.commonName} emerged`;
        }

        nextCreature.state.hunger = clamp(nextCreature.state.hunger - 1, 0, 100);
        nextCreature.state.cleanliness = clamp(nextCreature.state.cleanliness - 1, 0, 100);

        const reaction = (() => {
          if (archiveReason) return archiveReason;
          if (interaction === "scan") return `${nextCreature.nickname}: ${localeText.colorTracked}`;
          if (interaction === "decorate") return `${nextCreature.nickname}: ${localeText.deckResonance}`;
          if (interaction === "play") return `${nextCreature.nickname}: ${localeText.respondedWith} ${getEmotionLabel(locale, nextEmotion)}`;
          if (interaction === "feed") return `${nextCreature.nickname}: ${localeText.recoveredHunger}`;
          return `${nextCreature.nickname}: ${localeText.careStable}`;
        })();
        nextFeedback = reaction;
        return nextCreature;
      });

      if (!wasCreatureFound) {
        setFeedback(localeText.creatureNotFound);
        return prev;
      }

      if (nextFeedback) {
        setFeedback(nextFeedback);
      }

      const updatedMission = prev.daily.missions.map((mission) => {
        if (mission.completed || mission.requiredAction !== interaction) return mission;
        return { ...mission, completed: true };
      });

      let updatedSignal = prev.daily.signal;
      if (updatedSignal && !updatedSignal.resolved) {
        const resolved = updatedSignal.creatureId === creature.id && updatedSignal.requiredAction === interaction;
        if (resolved) {
          updatedSignal = { ...updatedSignal, resolved: true };
        }
      }

      const completedMissions = updatedMission.filter((mission) => mission.completed).length;
      const bonus = completedMissions >= 2 && prevCompletedMissionCount < 2 ? 2 : 0;

      return {
        ...prev,
        tokens: clamp(prev.tokens - TOKEN_COST[interaction] + bonus, 0, 999),
        creatures: targets,
        archive: nextArchive,
        researchData: {
          observation: prev.researchData.observation + (interaction === "scan" ? 5 : 0),
          mutation: prev.researchData.mutation + (nextArchive.length > prev.archive.length ? 20 : 0),
          emotion: prev.researchData.emotion + (interaction === "play" ? 2 : 1),
        },
        daily: {
          ...prev.daily,
          signal: updatedSignal,
          missions: updatedMission,
        },
      };
    });
  }, []);

  const selectCreature = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedCreatureId: id }));
  }, []);

  const clearCompletedMissions = useCallback(() => {
    const localeText = INTERFACE_TEXT[state.locale];
    const allCompleted = state.daily.missions.every((mission) => mission.completed);
    if (!allCompleted) {
      setFeedback(localeText.continueMissions);
      return;
    }

    setState((prev) => ({
      ...prev,
      daily: {
        ...prev.daily,
        missions: prev.daily.missions.map((mission) => ({ ...mission, completed: false })),
      },
      tokens: prev.tokens + 2,
    }));
    setFeedback(localeText.missionsCleared);
  }, [state]);

  const claimSignalReward = useCallback(() => {
    const localeText = INTERFACE_TEXT[state.locale];
    const signal = state.daily.signal;
    if (!signal || !signal.resolved) {
      setFeedback(signal ? localeText.continueMissions : localeText.noSignal);
      return;
    }

    if (signal.rewardClaimed) {
      setFeedback(localeText.signalRewardClaimed);
      return;
    }

    setState((prev) => ({
      ...prev,
      daily: {
        ...prev.daily,
        signal: prev.daily.signal
          ? {
              ...prev.daily.signal,
              rewardClaimed: true,
            }
          : null,
      },
      tokens: prev.tokens + 1,
    }));
    setFeedback(localeText.signalRewardClaimed);
  }, [state]);

  const handleObserverPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      observerDragState.current = {
        startX: event.clientX,
        startY: event.clientY,
        startYaw: observerYaw,
        startPitch: observerPitch,
      };
      observerDraggingRef.current = true;
      setIsDraggingObserver(true);
      observerShellRef.current?.setPointerCapture(event.pointerId);
    },
    [observerYaw, observerPitch],
  );

  const handleObserverPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!observerDraggingRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - observerDragState.current.startX;
    const deltaY = event.clientY - observerDragState.current.startY;

    setObserverYaw(observerDragState.current.startYaw + deltaX * 0.4);
    setObserverPitch(clamp(observerDragState.current.startPitch - deltaY * 0.4, -80, 80));
  }, []);

  const handleObserverPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!observerDraggingRef.current) return;
    observerDraggingRef.current = false;
    setIsDraggingObserver(false);
    observerShellRef.current?.releasePointerCapture(event.pointerId);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const spin = () => {
      if (!observerDraggingRef.current) {
        setObserverYaw((prev) => prev + 0.4);
      }
      rafId = window.requestAnimationFrame(spin);
    };

    rafId = window.requestAnimationFrame(spin);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  const setLocale = useCallback((nextLocale: "en" | "ko") => {
    setState((prev) => {
      if (prev.locale === nextLocale) return prev;
      setFeedback(INTERFACE_TEXT[nextLocale].defaultNotice);
      return { ...prev, locale: nextLocale };
    });
  }, []);

  const modalTitle = useMemo(() => {
    if (activeModal === "missions") return uiText.missionDetails;
    if (activeModal === "archive") return uiText.archive;
    if (activeModal === "roster") return uiText.creatures;
    if (activeModal === "observer-targets") return uiText.observerTargets;
    return uiText.creatureDetails;
  }, [activeModal, uiText]);

  const openEntryPopup = useCallback(() => {
    setIsEntryPopupOpen((prev) => !prev);
  }, []);

  const closeEntryPopup = useCallback(() => {
    setIsEntryPopupOpen(false);
  }, []);

  return (
    <main className="mx-auto flex h-[100dvh] min-h-[100dvh] w-full max-w-[1220px] flex-col overflow-x-hidden px-[clamp(14px,3vw,24px)] pb-8 pt-[22px]">
      <GameHeader locale={state.locale} tokenCount={state.tokens} uiText={uiText} onSetLocale={setLocale} />

        <section className="grid flex-1 min-h-0 min-w-0 gap-[var(--panel-gap)] items-start overflow-x-hidden [grid-template-columns:minmax(0,1.35fr)_minmax(300px,1fr)]">
          <section className="grid min-w-0 w-full gap-3 overflow-x-hidden h-full relative">
            <ObserverPanel
              uiText={uiText}
              isObserverAutoTarget={isObserverAutoTarget}
              locale={state.locale}
              observerCreature={observerCreature}
              observerStyle={observerStyle}
              observerYaw={observerYaw}
              observerPitch={observerPitch}
              isDraggingObserver={isDraggingObserver}
              observerShellRef={observerShellRef}
              onObserverTargetOpen={() => openModal("observer-targets")}
              onPointerDown={handleObserverPointerDown}
              onPointerMove={handleObserverPointerMove}
              onPointerUp={handleObserverPointerUp}
            />
            <button
              className={`absolute top-[14px] right-[14px] grid h-9 w-9 place-items-center border border-[rgba(125,210,255,0.6)] bg-[rgba(8,14,32,0.88)] text-[#e8f7ff] cursor-pointer z-[6] shadow-[0_0_12px_rgba(115,214,255,0.24)] transition-[border-color,box-shadow] hover:border-[rgba(143,245,255,1)] hover:shadow-[0_0_16px_rgba(127,232,255,0.35)] ${
                isEntryPopupHighlighted
                  ? "border-[rgba(255,230,120,0.96)] shadow-[0_0_16px_rgba(127,232,255,0.35)]"
                  : ""
              } ${isEntryPopupHighlighted && hasEntryPopupUpdate ? "animate-[entry-pop_0.2s_ease-out_0s_2_alternate]" : ""}`}
              onClick={openEntryPopup}
              type="button"
              aria-label={uiText.creatureDetails}
            >
              <Info className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>

            <EntryPopup
              isOpen={isEntryPopupOpen}
              hasUpdate={isEntryPopupHighlighted || hasEntryPopupUpdate}
              uiText={uiText}
              tokens={state.tokens}
              researchObservation={state.researchData.observation}
              researchMutation={state.researchData.mutation}
              researchEmotion={state.researchData.emotion}
              streak={state.daily.streak}
              completedMissionsCount={completedMissionsCount}
              missionTotal={missionTotal}
              signalState={signalState}
              stellaComment={stellaComment}
              statusText={targetStatusText}
              missionRemaining={missionRemaining}
              missions={state.daily.missions}
              signalRewardClaimed={Boolean(state.daily.signal?.rewardClaimed)}
              selectedCreature={selectedCreature ?? null}
              onClose={closeEntryPopup}
              onOpenMissions={() => openModal("missions")}
              onClearCompletedMissions={clearCompletedMissions}
              onClaimSignalReward={claimSignalReward}
              signalResolved={Boolean(state.daily.signal?.resolved)}
              hasSignal={Boolean(state.daily.signal)}
            />
          
        </section>

        <section className="min-w-0">
          <div className="mb-2">
            <ActiveCreaturePanel
              selectedCreature={selectedCreature ?? null}
              uiText={uiText}
              actionText={actionText}
              token={state.tokens}
              locale={state.locale}
              performAction={performAction}
              onOpenRoster={() => openModal("roster")}
              onOpenCreatureDetails={() => openModal("creature-details")}
              showActions={true}
              highlightActions={activeMissionActions}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2" role="tablist" aria-label="Right panel">
            {rightPanelTabs.map((tab) => (
              <button
                key={tab.id}
                className={`border border-[rgba(130,199,255,0.5)] bg-[rgba(8,14,32,0.85)] px-2.5 py-2 text-[12px] leading-tight tracking-[0.32px] transition-all min-h-[34px] ${
                  rightPanel === tab.id
                    ? "bg-[rgba(45,93,170,0.72)] border-[#8ff5ff] shadow-[0_0_14px_rgba(127,220,255,0.3)] text-[#ffffff] font-semibold"
                    : "hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)] text-[#eaf6ff]"
                }`}
                id={`right-panel-tab-${tab.id}`}
                onClick={() => setRightPanel(tab.id)}
                aria-selected={rightPanel === tab.id}
                aria-current={rightPanel === tab.id ? "page" : undefined}
                aria-controls={`right-panel-${tab.id}`}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="flex-1"
            role="tabpanel"
            id={`right-panel-${rightPanel}`}
            aria-labelledby={`right-panel-tab-${rightPanel}`}
          >
            {rightPanel === "research" ? (
              <ResearchLogPanel
                uiText={uiText}
                locale={state.locale}
                state={state}
                onOpenLog={() => openModal("missions")}
              />
            ) : (
              <ArchivePanel
                uiText={uiText}
                archiveCount={state.archive.length}
                latestArchive={state.archive[0] ?? null}
                locale={state.locale}
                onOpenArchive={() => openModal("archive")}
              />
            )}
          </div>
        </section>
      </section>

      {activeModal && (
        <ModalShell title={modalTitle} onClose={closeModal} closeLabel={uiText.close}>
          {activeModal === "missions" ? (
            <MissionsModal
              missions={state.daily.missions}
              uiText={uiText}
              actionText={actionText}
              missionRemaining={missionRemaining}
              onClearCompletedMissions={clearCompletedMissions}
            />
          ) : null}

          {activeModal === "archive" ? (
              <ArchiveModal
                uiText={uiText}
                locale={state.locale}
                archiveSpeciesTabs={archiveSpeciesTabs}
                archiveFilter={archiveFilter}
                filteredArchiveEntries={filteredArchiveEntries}
                archiveSlice={archiveSlice}
                archiveTotal={state.archive.length}
                archivePageCount={archivePageCount}
                safeArchivePage={safeArchivePage}
              onChangeFilter={(tab) => {
                setArchiveFilter(tab);
                setArchivePage(0);
              }}
              onPrevPage={() => setArchivePage((value) => Math.max(0, value - 1))}
              onNextPage={() => setArchivePage((value) => Math.min(archivePageCount - 1, value + 1))}
            />
          ) : null}

          {activeModal === "roster" ? (
            <RosterModal
              uiText={uiText}
              locale={state.locale}
              selectedCreatureId={selectedCreature?.id ?? ""}
              rosterSpeciesTabs={rosterSpeciesTabs}
              rosterFilter={rosterFilter}
              filteredRoster={filteredRoster}
              rosterSlice={rosterSlice}
              rosterPageCount={rosterPageCount}
              safeRosterPage={safeRosterPage}
              onChangeFilter={(tab) => {
                setRosterFilter(tab);
                setRosterPage(0);
              }}
              onSelectCreature={(id) => {
                selectCreature(id);
                closeModal();
              }}
              onPrevPage={() => setRosterPage((value) => Math.max(0, value - 1))}
              onNextPage={() => setRosterPage((value) => Math.min(rosterPageCount - 1, value + 1))}
            />
          ) : null}

          {activeModal === "observer-targets" ? (
            <ObserverTargetModal
              uiText={uiText}
              creatures={state.creatures}
              isObserverAutoTarget={isObserverAutoTarget}
              observerTargetId={observerTargetId}
              onAuto={() => {
                setIsObserverAutoTarget(true);
                closeModal();
              }}
              onSelect={(id) => {
                setIsObserverAutoTarget(false);
                setObserverTargetId(id);
                closeModal();
              }}
            />
          ) : null}

          {activeModal === "creature-details" ? (
            <CreatureDetailsModal
              creature={selectedCreature}
              uiText={uiText}
              actionText={actionText}
              locale={state.locale}
              token={state.tokens}
              onAction={performAction}
              onSetObserverTarget={(creature) => {
                setIsObserverAutoTarget(false);
                setObserverTargetId(creature.id);
              }}
            />
          ) : null}
        </ModalShell>
      )}
    </main>
  );
}
