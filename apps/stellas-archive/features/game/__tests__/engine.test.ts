import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ARCHIVE_PAGE_SIZE,
  FEEDS,
  clamp,
  createCreature,
  createDailySignal,
  createMissionPool,
  evaluateMutation,
  getDominantEmotion,
  getObserverProfile,
  getTodayKey,
  isYesterday,
  loadState,
  saveState,
  getDefaultFeedInventory,
  applyRgbDelta,
  initialState,
  nextDayState,
  getMissionText,
  STORAGE_KEY,
  getActiveUserTokens,
} from "../engine";
import { SupportedLocale } from "../../i18n/i18n";
import type { Creature, DailyState, Locale } from "../engine";
import { SPECIES } from "../engine";

const missionForLocale = (locale: Locale) => getMissionText(locale);

const makeCreature = (overrides: Partial<Creature> = {}): Creature => {
  const base = createCreature("species_mote", "Test Mote", "test-mote");
  return {
    ...base,
    ...overrides,
    state: {
      ...base.state,
      ...overrides.state,
    },
  } as Creature;
};

describe("game engine utilities", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("clamps values to range", () => {
    expect(clamp(-4, 0, 100)).toBe(0);
    expect(clamp(102, 0, 100)).toBe(100);
  });

  it("applies rgb delta with channel clamping", () => {
    expect(applyRgbDelta({ r: 10, g: 250, b: 0 }, { r: -30, g: 10, b: 10 })).toEqual({
      r: 0,
      g: 255,
      b: 10,
    });
  });

  it("derives dominant emotion from RGB channels", () => {
    expect(getDominantEmotion({ r: 230, g: 100, b: 90 })).toBe("agitated");
    expect(getDominantEmotion({ r: 80, g: 230, b: 80 })).toBe("curious");
    expect(getDominantEmotion({ r: 80, g: 80, b: 230 })).toBe("calm");
    expect(getDominantEmotion({ r: 170, g: 160, b: 150 })).toBe("neutral");
  });

  it("builds creature shape-independent observer profile defaults", () => {
    const baseStyle = getObserverProfile(null) as Record<string, string>;
    expect(baseStyle["--observer-core-size"]).toBe("68px");
    expect(baseStyle["--observer-orb-size"]).toBe("150px");
  });

  it("creates creatures with expected base fields", () => {
    const randomSpy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("deterministic-uuid");
    const created = createCreature("species_lumina", "Moon Glow", "seed-lumina");
    randomSpy.mockRestore();

    expect(created.id).toBe("species_lumina-determ");
    expect(created.speciesId).toBe("species_lumina");
    expect(created.scientificName).toBe(SPECIES.species_lumina.scientificName);
    expect(created.commonName).toBe(SPECIES.species_lumina.commonName);
    expect(created.state.hunger).toBe(70);
    expect(created.traits).toEqual(SPECIES.species_lumina.traits);
  });

  it("generates the mission pool with three mission types", () => {
    const missionText = missionForLocale(SupportedLocale.En);
    const missions = createMissionPool(SupportedLocale.En);
    expect(missions).toHaveLength(3);
    expect(missions[0]).toMatchObject({ label: missionText.feedLabel, requiredAction: "feed", completed: false });
    expect(missions[1]).toMatchObject({ label: missionText.scanLabel, requiredAction: "scan", completed: false });
    expect(missions[2]).toMatchObject({ label: missionText.playLabel, requiredAction: "play", completed: false });
  });

  it("selects daily signal based on urgency", () => {
    const stressed = makeCreature({
      id: "stressed",
      nickname: "Stressed",
      state: { hunger: 42, cleanliness: 90, affection: 45, energy: 70 },
    });
    const cleanTarget = makeCreature({
      id: "clean",
      state: { hunger: 90, cleanliness: 12, affection: 82, energy: 70 },
    });

    const signal = createDailySignal([stressed, cleanTarget], SupportedLocale.En);
    expect(signal).not.toBeNull();
    expect(signal?.creatureId).toBe(stressed.id);
    expect(signal?.requiredAction).toBe("feed");
  });

  it("computes next day state with streak progression", () => {
    const prevDate = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1000).toISOString().slice(0, 10);
    const prev: DailyState = {
      lastVisitDate: prevDate,
      streak: 5,
      signal: null,
      missions: [],
    };
    const next = nextDayState(prev, [makeCreature()], SupportedLocale.En);

    expect(next.streak).toBe(6);
    expect(next.lastVisitDate).toBe(getTodayKey());
    expect(next.missions).toHaveLength(2);
  });

  it("detects stale daily state with exact 24h boundary", () => {
    const y = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const t = getTodayKey();
    expect(isYesterday(y, t)).toBe(true);
  });

  it("persists and restores game state snapshots", () => {
    const seed = initialState(SupportedLocale.En);
    saveState(seed);
    const restored = loadState(SupportedLocale.En);

    expect(restored.version).toBe(seed.version);
    expect(restored.creatures.length).toBe(seed.creatures.length);
    expect(restored.creatures[0]?.id).toBe(seed.creatures[0]?.id);
  });

  it("builds default feed inventory by active user mock profile", () => {
    const activeUserInventory = getDefaultFeedInventory(FEEDS, "4f6a3d60-5f17-4f8d-bf1d-0e9c7a8f2a31");

    expect(activeUserInventory.feed_red_spore).toBe(84);
    expect(activeUserInventory.feed_green_bloom).toBe(72);
    expect(activeUserInventory.feed_blue_mist).toBe(56);
    expect(activeUserInventory.feed_white_vein).toBe(24);
    expect(activeUserInventory.feed_black_vein).toBe(18);
    expect(activeUserInventory.feed_unknown).toBeUndefined();
  });

  it("uses active user token from mock profile in initial state", () => {
    const activeUserTokens = getActiveUserTokens();
    const state = initialState(SupportedLocale.En);

    expect(state.tokens).toBe(activeUserTokens);
  });

  it("falls back to baseline tokens for unknown user profile", () => {
    expect(getActiveUserTokens("unknown-user-id")).toBe(15);
  });

  it("falls back to zero inventory for unknown users or missing feed items", () => {
    const unknownUserInventory = getDefaultFeedInventory(FEEDS, "unknown-user-id");

    expect(unknownUserInventory.feed_red_spore).toBe(0);
    expect(unknownUserInventory.feed_green_bloom).toBe(0);
    expect(unknownUserInventory.feed_black_vein).toBe(0);
  });

  it("falls back to initial state on invalid serialized payload", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-a-json");
    const restored = loadState(SupportedLocale.En);

    expect(restored.version).toBe(1);
    expect(restored.creatures.length).toBeGreaterThan(0);
  });

  it("evaluates mutation rules", () => {
    const greenGrowth = makeCreature({
      id: "green-growth",
      state: { hunger: 82, cleanliness: 85, affection: 50, energy: 75 },
      rgb: { r: 180, g: 240, b: 120 },
      emotion: "neutral",
    });
    const first = evaluateMutation(greenGrowth);
    expect(first.rule?.id).toBe("verdant_echo");
    expect(first.nextSpecies).toBe("species_verdant_echo");

    const unmatched = makeCreature({
      state: { hunger: 70, cleanliness: 70, affection: 50, energy: 75 },
      rgb: { r: 120, g: 100, b: 160 },
    });
    expect(evaluateMutation(unmatched).rule).toBeNull();
    expect(ARCHIVE_PAGE_SIZE).toBe(8);
  });
});
