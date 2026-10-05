import { describe, expect, it } from 'vitest';
import { SPEECH, encodeWav, interpretTranscript, isSpeechClip, judgeTranscript, resolveClip } from './speech';

describe('interpretTranscript', () => {
  it('이름만 부르면 name-call', () => {
    expect(interpretTranscript(' 터피야!')).toEqual({ kind: 'name-call' });
    expect(interpretTranscript('토피')).toEqual({ kind: 'name-call' });
    expect(interpretTranscript('터키야')).toEqual({ kind: 'name-call' });
  });

  it('이름과 내용이 있으면 addressed speech', () => {
    expect(interpretTranscript('터피야 오늘 날씨 어때?')).toEqual({ kind: 'speech', text: '터피야 오늘 날씨 어때?', addressed: true });
  });

  it('이름 없는 말은 addressed=false (호격 없는 "터키"는 나라 이름)', () => {
    expect(interpretTranscript('회의 몇 시였지')).toMatchObject({ kind: 'speech', addressed: false });
    expect(interpretTranscript('터키 여행 가고 싶다')).toMatchObject({ kind: 'speech', addressed: false });
  });

  it('whisper 환각 문구와 효과음 표기는 버린다', () => {
    expect(interpretTranscript('시청해 주셔서 감사합니다.')).toBeNull();
    expect(interpretTranscript('[음악]')).toBeNull();
    expect(interpretTranscript('감사합니다.')).toBeNull();
    expect(interpretTranscript('오우우우우우우')).toBeNull();
  });

  it('잡음에서 같은 말을 되풀이한 결과는 버린다 (실측 "아래의 아래의…"), 이름을 부르면 살린다', () => {
    expect(interpretTranscript('아래의 아래의 아래의 아래의 아래의 아래')).toBeNull();
    expect(interpretTranscript('하하하하하하')).toBeNull();
    expect(interpretTranscript('터피야 좋아 좋아 좋아')).toMatchObject({ kind: 'speech', addressed: true });
    expect(interpretTranscript('오늘 회의 너무 길었어')).toMatchObject({ kind: 'speech' });
  });
});

describe('영상 자막 환각 문구', () => {
  it('유튜브·방송 자막 말투는 버린다 (실측 "시청해주셔서 감사합니다", "다음 영상에서 만나요")', () => {
    for (const t of [
      '시청해주셔서 감사합니다.', '시청해 주셔서 감사합니다', '다음 영상에서 만나요.', '다음 시간에 만나요',
      '다른 영상에서 또 만나요', '구독과 좋아요 부탁드립니다', '좋아요와 알림 설정 부탁드려요', '구독 눌러주세요',
      '끝까지 시청해 주셔서 감사합니다', 'MBC 뉴스 김현수입니다', '한글자막 제공', '오늘 영상은 여기까지입니다',
    ]) expect(judgeTranscript(t)).toEqual({ signal: null, drop: '영상 자막 문구' });
  });

  it('영상·구독·좋아요가 들어간 일상 문장은 남긴다', () => {
    for (const t of ['이 영상 재밌더라', '좋아요', '구독 취소해야겠다', '다음에 만나서 얘기하자', '뉴스 봤어?']) {
      expect(judgeTranscript(t).signal).toMatchObject({ kind: 'speech' });
    }
  });

  it('버린 이유를 알려 준다', () => {
    expect(judgeTranscript('아').drop).toBe('너무 짧음');
    expect(judgeTranscript('감사합니다.').drop).toBe('감탄·채움 소리');
    expect(judgeTranscript('아래의 아래의 아래의 아래').drop).toBe('같은 말 반복');
  });
});

describe('resolveClip', () => {
  it('음정 구간에서 이름 없는 문장은 허밍으로 본다 (실측: 허밍 → "투데이 이슈 톡")', () => {
    expect(resolveClip(interpretTranscript('투데이 이슈 톡'), 220)).toEqual({ kind: 'hum', hz: 220 });
    expect(resolveClip(null, 220)).toEqual({ kind: 'hum', hz: 220 });
  });

  it('음정 구간이어도 이름을 부르면 말로 믿는다', () => {
    expect(resolveClip(interpretTranscript('터피야 배포 성공했어'), 281)).toMatchObject({ kind: 'speech', addressed: true });
    expect(resolveClip(interpretTranscript('터키야'), 281)).toEqual({ kind: 'name-call' });
  });

  it('음정 구간이 아니면 그대로', () => {
    expect(resolveClip(interpretTranscript('회의는 3시'))).toMatchObject({ kind: 'speech', addressed: false });
  });
});

describe('encodeWav', () => {
  it('RIFF 헤더와 16-bit 길이를 쓴다', () => {
    const wav = encodeWav(new Float32Array([0, 1, -1]), SPEECH.sampleRate);
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe('RIFF');
    expect(wav.length).toBe(44 + 6);
    const view = new DataView(wav.buffer);
    expect(view.getUint32(24, true)).toBe(SPEECH.sampleRate);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x7fff);
  });
});

describe('isSpeechClip', () => {
  it('길이가 0.4~10초인 Float32Array만 받는다', () => {
    expect(isSpeechClip(new Float32Array(SPEECH.sampleRate))).toBe(true);
    expect(isSpeechClip(new Float32Array(100))).toBe(false);
    expect(isSpeechClip(new Float32Array(SPEECH.sampleRate * 11))).toBe(false);
    expect(isSpeechClip([0, 1])).toBe(false);
  });
});
