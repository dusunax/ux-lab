"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";

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
import { useSearchParams } from "next/navigation";
import i18next, { t } from "i18next";

import {
  type ActiveModal,
  type Creature,
  type FilterTab,
  type Interaction,
  type GameState,
  type ArchiveEntry,
  type Locale,
  ARCHIVE_PAGE_SIZE,
  ROSTER_PAGE_SIZE,
  FEEDS,
  SPECIES,
  normalizeSpeciesId,
  TOKEN_COST,
  getLocaleFromBrowser,
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
import {
  initI18n,
  isSupportedLocale,
  normalizeLocale,
  SupportedLocale,
  MESSAGE_CATALOGS,
} from "../features/i18n/i18n";

export const dynamic = "force-dynamic";

const archiveSort = (entries: ArchiveEntry[]) =>
  entries
    .slice()
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

const toLocaleFromI18n = (value?: string): Locale =>
  normalizeLocale(
    value?.toLowerCase().startsWith(SupportedLocale.Ko)
      ? SupportedLocale.Ko
      : SupportedLocale.En
  );
const LOCALE_STORAGE_KEY = "stellas-archive:ui-locale-v1";

type StellaSearchParams = {
  language?: string;
  lang?: string;
};

const getLocaleFromSearchParams = (
  searchParams?: StellaSearchParams
): Locale | null => {
  if (searchParams?.language && isSupportedLocale(searchParams.language))
    return searchParams.language;
  if (searchParams?.lang && isSupportedLocale(searchParams.lang))
    return searchParams.lang;
  return null;
};

const getLocaleFromWindowSearch = () => {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const raw = query.get("language") || query.get("lang");
  return isSupportedLocale(raw) ? raw : null;
};
const getLocaleFromStorage = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(raw) ? raw : null;
};
const setLocaleStorage = (nextLocale: Locale) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
};

const resolveLocalePreference = (queryLocale: Locale | null): Locale => {
  const queryLocaleOrWindow = queryLocale ?? getLocaleFromWindowSearch();
  if (queryLocaleOrWindow) {
    return queryLocaleOrWindow;
  }
  return getLocaleFromStorage() ?? getLocaleFromBrowser();
};

const writeLocaleQuery = (nextLocale: Locale) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("language", nextLocale);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
};

type StellaArchivePageProps = Record<string, never>;

function StellaArchivePageContent(_props: StellaArchivePageProps) {
  const urlSearchParams = useSearchParams();
  const queryLocale = React.useMemo(
    () =>
      getLocaleFromSearchParams({
        language: urlSearchParams.get("language") || undefined,
        lang: urlSearchParams.get("lang") || undefined,
      }),
    [urlSearchParams]
  );
  const initialLocale = queryLocale ?? SupportedLocale.En;

  const initState = (locale: Locale): GameState => {
    if (typeof window === "undefined") {
      return initialState(locale);
    }
    const loaded = loadState(locale);
    return { ...loaded, locale };
  };

  const shouldSyncLocaleQuery = useRef(false);
  const [isLocaleHydrated, setIsLocaleHydrated] = useState(false);
  const [state, setState] = useState<GameState>(() => initState(initialLocale));
  const [feedback, setFeedback] = useState<string>(
    () => MESSAGE_CATALOGS[initialLocale].interfaceText.defaultNotice
  );
  const [observerYaw, setObserverYaw] = useState(42);
  const [observerPitch, setObserverPitch] = useState(52);
  const [observerDragOffset, setObserverDragOffset] = useState({
    x: 0,
    y: 0,
  });
  const [isObserverAutoTarget, setIsObserverAutoTarget] = useState(true);
  const [observerTargetId, setObserverTargetId] = useState<string | null>(null);
  const [isDraggingObserver, setIsDraggingObserver] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [rightPanel, setRightPanel] = useState<"research" | "archive">(
    "research"
  );
  const [archivePage, setArchivePage] = useState(0);
  const [rosterPage, setRosterPage] = useState(0);
  const [archiveFilter, setArchiveFilter] = useState<FilterTab>("all");
  const [rosterFilter, setRosterFilter] = useState<FilterTab>("all");
  const [isEntryPopupOpen, setIsEntryPopupOpen] = useState(false);
  const [hasEntryPopupUpdate, setHasEntryPopupUpdate] = useState(false);

  const observerShellRef = useRef<HTMLDivElement | null>(null);
  const observerDragState = useRef({
    startX: 0,
    startY: 0,
    startYaw: 42,
    startPitch: 52,
    startOffsetX: 0,
    startOffsetY: 0,
    halfWidth: 1,
    halfHeight: 1,
  });
  const observerDraggingRef = useRef(false);
  const entryPopupSnapshotRef = useRef("");
  const lastActionRef = useRef<Interaction | null>(null);

  useEffect(() => {
    const hydrateFromLocale = (nextLocale: Locale) => {
      setLocaleStorage(nextLocale);
      i18next.changeLanguage(nextLocale);
      const next = loadState(nextLocale);
      const nextCatalog = MESSAGE_CATALOGS[nextLocale];
      const nextWithLocale = { ...next, locale: nextLocale };
      setFeedback(nextCatalog.interfaceText.defaultNotice);
      setState((prev) => ({
        ...nextWithLocale,
        selectedCreatureId: prev.selectedCreatureId || next.selectedCreatureId,
      }));
      setIsLocaleHydrated(true);
    };

    const searchLocale = queryLocale ?? getLocaleFromWindowSearch();
    shouldSyncLocaleQuery.current = searchLocale !== null;

    const initLocale = resolveLocalePreference(queryLocale);
    const initialize = async () => {
      try {
        await initI18n();
      } catch {
        // fallback: continue using preference chain without initialization blocker
      }
      const fromQuery = queryLocale ?? getLocaleFromWindowSearch();
      const fallback = toLocaleFromI18n(
        i18next.resolvedLanguage || i18next.language || getLocaleFromBrowser()
      );
      const nextLocale = fromQuery || initLocale || fallback;
      hydrateFromLocale(nextLocale);
    };
    void initialize();
  }, [queryLocale]);

  useEffect(() => {
    if (!isLocaleHydrated) return;
    i18next.changeLanguage(state.locale);
  }, [isLocaleHydrated, state.locale]);

  useEffect(() => {
    if (!state.locale || !shouldSyncLocaleQuery.current) return;
    writeLocaleQuery(state.locale);
  }, [state.locale]);

  useEffect(() => saveState(state), [state]);

  const selectedCreature = useMemo(
    () =>
      state.creatures.find(
        (creature) => creature.id === state.selectedCreatureId
      ) ?? state.creatures[0],
    [state.creatures, state.selectedCreatureId]
  );
  const autoTargetId = useMemo(
    () => selectedCreature?.id ?? null,
    [selectedCreature]
  );

  useEffect(() => {
    if (isObserverAutoTarget) {
      setObserverTargetId(autoTargetId);
      return;
    }

    if (!observerTargetId) return;
    const exists = state.creatures.some(
      (creature) => creature.id === observerTargetId
    );
    if (!exists) {
      setObserverTargetId(state.creatures[0]?.id ?? null);
    }
  }, [isObserverAutoTarget, autoTargetId, observerTargetId, state.creatures]);

  useEffect(() => {
    if (
      rosterFilter !== "all" &&
      !state.creatures.some((creature) => creature.speciesId === rosterFilter)
    ) {
      setRosterFilter("all");
      setRosterPage(0);
    }
  }, [rosterFilter, state.creatures]);

  useEffect(() => {
    if (
      archiveFilter !== "all" &&
      !state.archive.some((entry) => entry.species === archiveFilter)
    ) {
      setArchiveFilter("all");
      setArchivePage(0);
    }
  }, [archiveFilter, state.archive]);

  const selectedObserverTargetId = useMemo(
    () =>
      isObserverAutoTarget
        ? autoTargetId
        : observerTargetId ?? state.creatures[0]?.id ?? null,
    [autoTargetId, isObserverAutoTarget, observerTargetId, state.creatures]
  );

  const observerCreature = useMemo(
    () =>
      state.creatures.find(
        (creature) => creature.id === selectedObserverTargetId
      ) ?? null,
    [state.creatures, selectedObserverTargetId]
  );
  const observerProfile = useMemo(
    () => getObserverProfile(observerCreature),
    [observerCreature]
  );
  const observerStyle = useMemo(
    () =>
      ({
        "--lumina-core": observerCreature
          ? `rgb(${observerCreature.rgb.r}, ${observerCreature.rgb.g}, ${observerCreature.rgb.b})`
          : "rgb(128, 210, 255)",
        ...observerProfile,
      } as React.CSSProperties),
    [observerProfile, observerCreature]
  );
  const localizedText = useMemo(
    () => MESSAGE_CATALOGS[state.locale],
    [state.locale]
  );
  const uiText = localizedText.interfaceText;
  const actionText = localizedText.actionText;
  const speciesText = localizedText.species;

  useEffect(() => {
    if (lastActionRef.current === "feed") {
      entryPopupSnapshotRef.current = `${state.archive.length}|${state.daily.missions.length}|${
        state.daily.missions.filter((mission) => !mission.completed).length
      }|${state.daily.signal?.message ?? ""}|${state.daily.signal?.resolved ? 1 : 0}|${
        state.daily.signal?.rewardClaimed ? 1 : 0
      }|${state.researchData.observation}/${state.researchData.mutation}/${state.researchData.emotion}`;
      lastActionRef.current = null;
      return;
    }

    const snapshot = `${state.archive.length}|${state.daily.missions.length}|${
      state.daily.missions.filter((mission) => !mission.completed).length
    }|${state.daily.signal?.message ?? ""}|${
      state.daily.signal?.resolved ? 1 : 0
    }|${state.daily.signal?.rewardClaimed ? 1 : 0}|${
      state.researchData.observation
    }/${state.researchData.mutation}/${state.researchData.emotion}`;

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

  const missionTotal = state.daily.missions.length;
  const missionRemaining = state.daily.missions.filter(
    (mission) => !mission.completed
  ).length;
  const remainingMissions = state.daily.missions.filter(
    (mission) => !mission.completed
  );
  const firstMission = remainingMissions[0];
  const completedMissionsCount =
    state.daily.missions.length - remainingMissions.length;
  const isMissionIncomplete = missionRemaining > 0;
  const isMissionRewardAvailable = missionTotal > 0 && missionRemaining === 0;
  const activeMissionActions = useMemo(() => {
    if (!isEntryPopupOpen || missionRemaining === 0) return [];
    const actions = remainingMissions.map((mission) => mission.requiredAction);
    return Array.from(new Set(actions));
  }, [isEntryPopupOpen, missionRemaining, remainingMissions]);

  const isEntryPopupHighlighted =
    isMissionIncomplete || isMissionRewardAvailable;
  const stellaComment =
    missionTotal === 0
      ? t("stellaCommentEmpty")
      : missionRemaining > 0
      ? t("stellaCommentWorking")
      : t("stellaCommentDone");

  const targetStatusText = useMemo(
    () =>
      selectedCreature
        ? firstMission
          ? t("targetStatusUrgent", {
              name: selectedCreature.nickname,
              species: selectedCreature.commonName,
              action: actionText[firstMission.requiredAction],
            })
          : t("targetStatusReady", {
              name: selectedCreature.nickname,
              species: selectedCreature.commonName,
            })
        : "",
    [actionText, firstMission, selectedCreature]
  );

  const rightPanelTabs = useMemo(
    () => [
      {
        id: "research" as const,
        label: localizedText.page.researchLogTitle,
      },
      {
        id: "archive" as const,
        label: localizedText.page.archive,
      },
    ],
    [localizedText.page.researchLogTitle, localizedText.page.archive]
  );
  const signalState = state.daily.signal
    ? state.daily.signal.resolved
      ? state.daily.signal.rewardClaimed
        ? uiText.signalDone
        : uiText.resolved
      : uiText.needsAction
    : uiText.noSignal;

  const archiveSpeciesTabs = useMemo(() => {
    const species = new Set(state.archive.map((entry) => entry.species));
    return [
      { id: "all", label: uiText.all },
      ...[...species].map((name) => ({ id: name, label: name })),
    ];
  }, [state.archive, uiText.all]);
  const filteredArchiveEntries = useMemo(
    () =>
      archiveFilter === "all"
        ? archiveSort(state.archive)
        : state.archive.filter((entry) => entry.species === archiveFilter),
    [archiveFilter, state.archive]
  );
  const rosterSpeciesTabs = useMemo(() => {
    const entries: Array<{ id: string; label: string; count: number }> = [];
    const counts = new Map<string, number>();
    state.creatures.forEach((creature) => {
      const species = normalizeSpeciesId(creature.speciesId);
      if (!species) return;
      counts.set(species, (counts.get(species) ?? 0) + 1);
    });

    counts.forEach((count, species) => {
      const speciesName =
        SPECIES[species]?.commonName ?? creatureSpeciesFallback(species);
      entries.push({ id: species, label: speciesName, count });
    });

    return [
      { id: "all", label: uiText.all, count: state.creatures.length },
      ...entries.sort(
        (a, b) => b.count - a.count || a.label.localeCompare(b.label)
      ),
    ];
  }, [state.creatures, uiText.all]);
  const filteredRoster = useMemo(
    () =>
    rosterFilter === "all"
      ? state.creatures
      : state.creatures.filter((creature) => normalizeSpeciesId(creature.speciesId) === rosterFilter),
    [rosterFilter, state.creatures]
  );

  const archivePageCount = Math.max(
    1,
    Math.ceil(filteredArchiveEntries.length / ARCHIVE_PAGE_SIZE)
  );
  const rosterPageCount = Math.max(
    1,
    Math.ceil(filteredRoster.length / ROSTER_PAGE_SIZE)
  );
  const safeArchivePage = Math.min(archivePage, archivePageCount - 1);
  const safeRosterPage = Math.min(rosterPage, rosterPageCount - 1);
  const archiveSlice = filteredArchiveEntries.slice(
    safeArchivePage * ARCHIVE_PAGE_SIZE,
    safeArchivePage * ARCHIVE_PAGE_SIZE + ARCHIVE_PAGE_SIZE
  );
  const rosterSlice = filteredRoster.slice(
    safeRosterPage * ROSTER_PAGE_SIZE,
    safeRosterPage * ROSTER_PAGE_SIZE + ROSTER_PAGE_SIZE
  );

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
        if (
          !state.creatures.find((creature) => creature.id === observerTargetId)
        ) {
          setObserverTargetId(state.creatures[0]?.id ?? null);
        }
      }
      setActiveModal(nextModal);
    },
    [observerTargetId, state.creatures]
  );

  const closeModal = useCallback(() => setActiveModal(null), []);

  const performAction = useCallback(
    (interaction: Interaction, creature: Creature, feedItemId?: string) => {
      lastActionRef.current = interaction;
      setState((prev) => {
        const localeText = uiText;
        if (prev.tokens < TOKEN_COST[interaction]) {
          setFeedback(localeText.noToken);
          return prev;
        }
        if (interaction === "feed" && !feedItemId) {
          setFeedback(localeText.noFeed);
          return prev;
        }

        let nextArchive = [...prev.archive];
        let nextFeedback = "";
        let wasCreatureFound = false;
        const selectedFeedItem = interaction === "feed" ? FEEDS[feedItemId ?? ""] : null;
        if (interaction === "feed" && !selectedFeedItem) {
          setFeedback(localeText.noFeed);
          return prev;
        }
        const nextFeedInventory = { ...prev.feedInventory };
        if (interaction === "feed" && selectedFeedItem) {
          const currentStock = nextFeedInventory[selectedFeedItem.id] ?? 0;
          if (currentStock <= 0) {
            setFeedback(localeText.noFeed);
            return prev;
          }
          nextFeedInventory[selectedFeedItem.id] = Math.max(currentStock - 1, 0);
        }

        const prevCompletedMissionCount = prev.daily.missions.filter(
          (mission) => mission.completed
        ).length;

        const targets = prev.creatures.map((item) => {
          if (item.id !== creature.id) return item;
          wasCreatureFound = true;

          if (item.state.energy <= 0 && interaction !== "feed") {
            nextFeedback = localeText.noEnergy;
            return item;
          }

          const nextState = { ...item.state };
          const rgbDelta: { r?: number; g?: number; b?: number } = {};

          switch (interaction) {
            case "feed":
              if (!selectedFeedItem) return item;
              if (selectedFeedItem.stateDelta.hunger !== undefined)
                nextState.hunger = clamp(
                  nextState.hunger + selectedFeedItem.stateDelta.hunger,
                  0,
                  100
                );
              if (selectedFeedItem.stateDelta.cleanliness !== undefined)
                nextState.cleanliness = clamp(
                  nextState.cleanliness + selectedFeedItem.stateDelta.cleanliness,
                  0,
                  100
                );
              if (selectedFeedItem.stateDelta.affection !== undefined)
                nextState.affection = clamp(
                  nextState.affection + selectedFeedItem.stateDelta.affection,
                  0,
                  100
                );
              if (selectedFeedItem.stateDelta.energy !== undefined)
                nextState.energy = clamp(
                  nextState.energy + selectedFeedItem.stateDelta.energy,
                  0,
                  100
                );
              rgbDelta.r = selectedFeedItem.rgbDelta.r ?? 0;
              rgbDelta.g = selectedFeedItem.rgbDelta.g ?? 0;
              rgbDelta.b = selectedFeedItem.rgbDelta.b ?? 0;
              break;
            case "clean":
              nextState.cleanliness = clamp(nextState.cleanliness + 26, 0, 100);
              nextState.energy = clamp(nextState.energy - 4, 0, 100);
              break;
            case "play":
              nextState.affection = clamp(nextState.affection + 12, 0, 100);
              nextState.hunger = clamp(nextState.hunger - 5, 0, 100);
              nextState.energy = clamp(nextState.energy - 8, 0, 100);
              nextState.cleanliness = clamp(nextState.cleanliness - 6, 0, 100);
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
              speciesId: drift.nextSpecies,
              scientificName: nextSpecies.scientificName,
              commonName: nextSpecies.commonName,
              traits: nextSpecies.traits,
              mutationStage: nextCreature.mutationStage + 1,
            };
            nextArchive.unshift(
              createArchiveEntry(
                nextCreature,
                nextSpecies,
                `${drift.rule.name} discovered (${
                  drift.rule.message[prev.locale]
                })`
              )
            );
            archiveReason = t("mutationEvolved", {
              species: nextSpecies.commonName,
            });
          }

          nextCreature.state.hunger = clamp(
            nextCreature.state.hunger - 1,
            0,
            100
          );
          nextCreature.state.cleanliness = clamp(
            nextCreature.state.cleanliness - 1,
            0,
            100
          );

          const reaction = (() => {
            if (archiveReason) return archiveReason;
            if (interaction === "scan")
              return `${nextCreature.nickname}: ${localeText.colorTracked}`;
            if (interaction === "decorate")
              return `${nextCreature.nickname}: ${localeText.deckResonance}`;
            if (interaction === "play")
              return `${nextCreature.nickname}: ${
                localeText.respondedWith
              } ${getEmotionLabel(nextEmotion, prev.locale)}`;
            if (interaction === "feed")
              return `${nextCreature.nickname}: ${localeText.recoveredHunger}`;
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
          if (mission.completed || mission.requiredAction !== interaction)
            return mission;
          return { ...mission, completed: true };
        });

        let updatedSignal = prev.daily.signal;
        if (updatedSignal && !updatedSignal.resolved) {
          const resolved =
            updatedSignal.creatureId === creature.id &&
            updatedSignal.requiredAction === interaction;
          if (resolved) {
            updatedSignal = { ...updatedSignal, resolved: true };
          }
        }

        const completedMissions = updatedMission.filter(
          (mission) => mission.completed
        ).length;
        const bonus =
          completedMissions >= 2 && prevCompletedMissionCount < 2 ? 2 : 0;

        return {
          ...prev,
          tokens: clamp(prev.tokens - TOKEN_COST[interaction] + bonus, 0, 999),
          feedInventory: interaction === "feed" ? nextFeedInventory : prev.feedInventory,
          creatures: targets,
          archive: nextArchive,
          researchData: {
            observation:
              prev.researchData.observation + (interaction === "scan" ? 5 : 0),
            mutation:
              prev.researchData.mutation +
              (nextArchive.length > prev.archive.length ? 20 : 0),
            emotion:
              prev.researchData.emotion + (interaction === "play" ? 2 : 1),
          },
          daily: {
            ...prev.daily,
            signal: updatedSignal,
            missions: updatedMission,
          },
        };
      });
    },
    [state.locale]
  );

  const selectCreature = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedCreatureId: id }));
  }, []);

  const clearCompletedMissions = useCallback(() => {
    const localeText = uiText;
    const allCompleted = state.daily.missions.every(
      (mission) => mission.completed
    );
    if (!allCompleted) {
      setFeedback(localeText.continueMissions);
      return;
    }

    setState((prev) => ({
      ...prev,
      daily: {
        ...prev.daily,
        missions: prev.daily.missions.map((mission) => ({
          ...mission,
          completed: false,
        })),
      },
      tokens: prev.tokens + 2,
    }));
    setFeedback(localeText.missionsCleared);
  }, [state, uiText]);

  const claimSignalReward = useCallback(() => {
    const localeText = uiText;
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
  }, [state, uiText]);

  const handleObserverPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const halfWidth = Math.max(rect.width * 0.5, 1);
      const halfHeight = Math.max(rect.height * 0.5, 1);
      observerDragState.current = {
        startX: event.clientX,
        startY: event.clientY,
        startYaw: observerYaw,
        startPitch: observerPitch,
        startOffsetX: observerDragOffset.x,
        startOffsetY: observerDragOffset.y,
        halfWidth,
        halfHeight,
      };
      observerDraggingRef.current = true;
      setIsDraggingObserver(true);
      observerShellRef.current?.setPointerCapture(event.pointerId);
    },
    [observerDragOffset, observerPitch, observerYaw]
  );

  const handleObserverPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!observerDraggingRef.current) return;
      event.preventDefault();
      const deltaX = event.clientX - observerDragState.current.startX;
      const deltaY = event.clientY - observerDragState.current.startY;
      const clampRangeX = clamp(
        observerDragState.current.startOffsetX + (deltaX / observerDragState.current.halfWidth) * 0.5,
        -0.5,
        0.5,
      );
      const clampRangeY = clamp(
        observerDragState.current.startOffsetY + (-deltaY / observerDragState.current.halfHeight) * 0.32,
        -0.32,
        0.32,
      );
      setObserverDragOffset({
        x: clampRangeX,
        y: clampRangeY,
      });

      setObserverYaw(observerDragState.current.startYaw + deltaX * 0.4);
      setObserverPitch(
        clamp(observerDragState.current.startPitch - deltaY * 0.4, -80, 80)
      );
    },
    []
  );

  const handleObserverPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!observerDraggingRef.current) return;
      observerDraggingRef.current = false;
      setIsDraggingObserver(false);
      setObserverDragOffset({ x: 0, y: 0 });
      observerShellRef.current?.releasePointerCapture(event.pointerId);
    },
    []
  );

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

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleStorage(nextLocale);
    const nextCatalog = MESSAGE_CATALOGS[nextLocale];
    setFeedback(nextCatalog.interfaceText.defaultNotice);
    setState((prev) =>
      prev.locale === nextLocale ? prev : { ...prev, locale: nextLocale }
    );
  }, []);

  const modalTitle = useMemo(() => {
    if (activeModal === "missions")
      return uiText.missionDetails || "Mission List";
    if (activeModal === "archive") return uiText.archive || "Archive";
    if (activeModal === "roster") return uiText.creatures || "Creatures in Lab";
    if (activeModal === "observer-targets")
      return uiText.observerTargets || "Observer Targets";
    return uiText.creatureDetails || "Creature Details";
  }, [activeModal, uiText]);

  const openEntryPopup = useCallback(() => {
    setIsEntryPopupOpen((prev) => !prev);
  }, []);

  const closeEntryPopup = useCallback(() => {
    setIsEntryPopupOpen(false);
  }, []);

  if (!isLocaleHydrated) {
    return (
      <main className="mx-auto flex h-[100dvh] min-h-[100dvh] w-full max-w-[1220px] flex-col overflow-x-hidden px-[clamp(14px,3vw,24px)] pb-8 pt-[22px]">
        <div className="h-full bg-[rgba(5,11,24,0.35)]" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[100dvh] min-h-[100dvh] w-full max-w-[1220px] flex-col overflow-x-hidden px-[clamp(14px,3vw,24px)] pb-8 pt-[22px]">
      <GameHeader
        tokenCount={state.tokens}
        uiText={uiText}
        onSetLocale={setLocale}
      />

      <section className="grid flex-1 min-h-0 min-w-0 gap-[var(--panel-gap)] items-start overflow-x-hidden [grid-template-columns:minmax(0,1.35fr)_minmax(300px,1fr)]">
        <section className="grid min-w-0 w-full gap-3 overflow-x-hidden h-full relative">
          <ObserverPanel
            uiText={uiText}
            isObserverAutoTarget={isObserverAutoTarget}
            observerCreature={observerCreature}
            observerStyle={observerStyle}
            observerYaw={observerYaw}
            observerPitch={observerPitch}
            observerDragOffset={observerDragOffset}
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
            } ${
              isEntryPopupHighlighted && hasEntryPopupUpdate
                ? "animate-[entry-pop_0.2s_ease-out_0s_2_alternate]"
                : ""
            }`}
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
              performAction={performAction}
              feeds={FEEDS}
              feedInventory={state.feedInventory}
              onOpenRoster={() => openModal("roster")}
              onOpenCreatureDetails={() => openModal("creature-details")}
              showActions={true}
              highlightActions={activeMissionActions}
            />
          </div>
          <div
            className="grid grid-cols-2 gap-2 mb-2"
            role="tablist"
            aria-label="Right panel"
          >
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
                state={state}
                onOpenLog={() => openModal("missions")}
              />
            ) : (
              <ArchivePanel
                uiText={uiText}
                archiveCount={state.archive.length}
                latestArchive={state.archive[0] ?? null}
                onOpenArchive={() => openModal("archive")}
              />
            )}
          </div>
        </section>
      </section>
      {activeModal && (
        <ModalShell
          title={modalTitle}
          onClose={closeModal}
          closeLabel={uiText.close}
        >
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
              onPrevPage={() =>
                setArchivePage((value) => Math.max(0, value - 1))
              }
              onNextPage={() =>
                setArchivePage((value) =>
                  Math.min(archivePageCount - 1, value + 1)
                )
              }
            />
          ) : null}

          {activeModal === "roster" ? (
            <RosterModal
              uiText={uiText}
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
              onPrevPage={() =>
                setRosterPage((value) => Math.max(0, value - 1))
              }
              onNextPage={() =>
                setRosterPage((value) =>
                  Math.min(rosterPageCount - 1, value + 1)
                )
              }
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
              token={state.tokens}
              feeds={FEEDS}
              feedInventory={state.feedInventory}
              speciesText={speciesText}
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

export default function StellaArchivePage(_props: StellaArchivePageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1220px] items-center justify-center px-[clamp(14px,3vw,24px)]">
          <div className="text-[13px] text-[rgba(180,230,255,0.85)]">
            Loading...
          </div>
        </main>
      }
    >
      <StellaArchivePageContent {..._props} />
    </Suspense>
  );
}
