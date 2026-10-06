import { describe, expect, it } from 'vitest';
import { detectPitch } from './mic';

const RATE = 48_000;
const tone = (hz: number, n = 2048) => Float32Array.from({ length: n }, (_, i) => 0.3 * Math.sin((2 * Math.PI * hz * i) / RATE));

describe('detectPitch', () => {
  it('허밍 대역의 사인파 음높이를 찾는다', () => {
    for (const hz of [110, 220, 440]) {
      const found = detectPitch(tone(hz), RATE);
      expect(found).not.toBeNull();
      expect(Math.abs((found ?? 0) - hz) / hz).toBeLessThan(0.03);
    }
  });

  it('잡음과 무음은 음정 없음', () => {
    let s = 1;
    const noise = Float32Array.from({ length: 2048 }, () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 0.6);
    expect(detectPitch(noise, RATE)).toBeNull();
    expect(detectPitch(new Float32Array(2048), RATE)).toBeNull();
  });
});

import { vi } from 'vitest';
import { createNoiseGate, createSegmenter } from './mic';

const CHUNK = 2048;
const silent = () => new Float32Array(CHUNK);
/** 타자 소리처럼 짧고 날카로운 잡음 조각 (음정 없음) */
const click = (seed: number) => {
  let s = seed;
  return Float32Array.from({ length: CHUNK }, (_, i) => (i % 400 < 40 ? ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 0.8 : 0));
};

describe('createSegmenter — 진짜 목소리만 보내기', () => {
  it('크지만 음정이 없는 조각(타자 소리)은 구간을 시작하지 않는다', () => {
    const clip = vi.fn(), start = vi.fn();
    const seg = createSegmenter(clip, start);
    for (let i = 0; i < 20; i++) seg.push(click(i + 1), true, false);
    for (let i = 0; i < 8; i++) seg.push(silent(), false, false);
    expect(start).not.toHaveBeenCalled();
    expect(clip).not.toHaveBeenCalled();
  });

  it('음정 있는 말소리가 이어지면 구간을 보낸다 (시작 알림은 한 번)', () => {
    const clip = vi.fn(), start = vi.fn();
    const seg = createSegmenter(clip, start);
    for (let i = 0; i < 8; i++) seg.push(tone(220), true, i % 3 !== 2); // 자음 섞인 말: 3조각 중 2조각 음정
    for (let i = 0; i < 8; i++) seg.push(silent(), false, false);
    expect(start).toHaveBeenCalledOnce();
    expect(clip).toHaveBeenCalledOnce();
  });

  it('음정으로 잡힌 조각이 하나뿐이면 구간을 열지 않는다 (생각을 끊지 않게)', () => {
    const clip = vi.fn(), start = vi.fn();
    const seg = createSegmenter(clip, start);
    for (let i = 0; i < 12; i++) seg.push(click(i + 3), true, i === 5);
    for (let i = 0; i < 8; i++) seg.push(silent(), false, false);
    expect(start).not.toHaveBeenCalled();
    expect(clip).not.toHaveBeenCalled();
  });

  it('음정 조각이 잠깐 섞였을 뿐 대부분 잡음이면 버린다', () => {
    const clip = vi.fn();
    const seg = createSegmenter(clip, () => {});
    seg.push(tone(220), true, true);
    seg.push(tone(220), true, true);
    for (let i = 0; i < 16; i++) seg.push(click(i + 7), true, false);
    for (let i = 0; i < 8; i++) seg.push(silent(), false, false);
    expect(clip).not.toHaveBeenCalled();
  });
});

describe('createNoiseGate', () => {
  it('조용한 소음 바닥을 따라 말소리 기준이 올라간다 (최소 -42dB)', () => {
    const gate = createNoiseGate();
    expect(gate.threshold).toBe(-42);
    for (let i = 0; i < 200; i++) gate.observe(-50, false);
    expect(gate.floor).toBeCloseTo(-50, 0);
    expect(gate.threshold).toBeCloseTo(-38, 0);
  });

  it('기준보다 큰 소리나 말하는 중의 조각은 소음 바닥에 넣지 않는다', () => {
    const gate = createNoiseGate();
    for (let i = 0; i < 200; i++) gate.observe(-30, false);
    for (let i = 0; i < 200; i++) gate.observe(-45, true);
    expect(gate.floor).toBe(-60);
  });
});

describe('detectPitch — 목소리 판정(느슨한 선명도)', () => {
  it('타자 같은 잡음은 0.75 기준에서도 음정 없음', () => {
    for (let s = 1; s < 6; s++) expect(detectPitch(click(s), RATE, 0.75)).toBeNull();
  });
});
