import { useState } from 'react'
import { MAX_AGE_MONTHS, MIN_AGE_MONTHS, formatAge, lifeStage } from '../age'
import { CAT_TYPE_LIST, DEFAULT_CAT_NAME, MAX_CAT_NAME_LENGTH, type CatTypeId } from '../catTypes'
import { DEFAULT_OWNER_NAME, MAX_OWNER_NAME_LENGTH, OWNER_GENDERS, OWNER_GENDER_LABEL, OWNER_SPRITE } from '../owners'
import { DEFAULT_CAT_PROFILE, type CatProfile } from '../profile'
import { GENDER_LABEL, type Gender } from '../types'
import { CatAvatar, spriteUrl } from './CatAvatar'
import { ImageButton } from './ImageButton'
import { OwnerFigure } from './OwnerAvatar'
import { PatternCard } from './PatternCard'

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const GENDERS: Gender[] = ['female', 'male']

/** 두 단계 모두 스크롤 없이 한 화면에 들어가도록 줄인 버튼 너비(원본 약 250px 이하) */
const SELECT_BUTTON_WIDTH = 168

type Step = 'owner' | 'cat'
type Personality = CatTypeId | 'random'

const STEP_TITLE: Record<Step, string> = { owner: '집사는?', cat: '고양이는?' }
const STEPS: Step[] = ['owner', 'cat']

const pickRandomType = (): CatTypeId => CAT_TYPE_LIST[Math.floor(Math.random() * CAT_TYPE_LIST.length)].id

interface Props {
  onBack: () => void
  onConfirm: (profile: CatProfile) => void
}

export function SelectScreen({ onBack, onConfirm }: Props) {
  const [step, setStep] = useState<Step>('owner')
  const [profile, setProfile] = useState<CatProfile>(DEFAULT_CAT_PROFILE)
  const [personality, setPersonality] = useState<Personality>(DEFAULT_CAT_PROFILE.typeId)
  const update = (patch: Partial<CatProfile>) => setProfile((p) => ({ ...p, ...patch }))
  const agePercent = ((profile.startAgeMonths - MIN_AGE_MONTHS) / (MAX_AGE_MONTHS - MIN_AGE_MONTHS)) * 100
  const stage = lifeStage(profile.startAgeMonths).split(' (')[0]

  const goBack = () => (step === 'cat' ? setStep('owner') : onBack())
  // 랜덤이 골라졌다면 시작하는 순간 다섯 성격 중 하나로 정해진다
  const confirm = () => onConfirm({ ...profile, typeId: personality === 'random' ? pickRandomType() : personality })

  return (
    <div className="screen select">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={goBack} aria-label="뒤로">
          ←
        </button>
        <h1>{STEP_TITLE[step]}</h1>
        <span className="steps" aria-label={`${STEPS.indexOf(step) + 1} / ${STEPS.length} 단계`}>
          {STEPS.map((s) => (
            <i key={s} className={s === step ? 'is-on' : ''} />
          ))}
        </span>
      </header>

      {step === 'owner' ? (
        <>
          <div className="owner-preview">
            <OwnerFigure ownerId={OWNER_SPRITE[profile.ownerGender]} height={220} className="owner-preview__figure" />
            <p>{profile.ownerName.trim() || DEFAULT_OWNER_NAME}</p>
          </div>

          <div className="select__footer">
            <label className="field name-field">
              <span>이름</span>
              <input value={profile.ownerName} maxLength={MAX_OWNER_NAME_LENGTH} placeholder={DEFAULT_OWNER_NAME} onChange={(e) => update({ ownerName: e.target.value })} autoComplete="off" />
              <small>
                {profile.ownerName.length}/{MAX_OWNER_NAME_LENGTH}
              </small>
            </label>

            <fieldset className="field gender-field">
              <legend>성별</legend>
              {OWNER_GENDERS.map((g) => (
                <label key={g} className={profile.ownerGender === g ? 'is-active' : ''}>
                  <input type="radio" name="owner-gender" value={g} checked={profile.ownerGender === g} onChange={() => update({ ownerGender: g })} />
                  {OWNER_GENDER_LABEL[g]}
                </label>
              ))}
            </fieldset>

            <ImageButton sprite="btn-select" label="선택하기" onClick={() => setStep('cat')} width={SELECT_BUTTON_WIDTH} />
          </div>
        </>
      ) : (
        <>
          <div className="select__grid" role="radiogroup" aria-label="성격">
            {CAT_TYPE_LIST.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={personality === t.id} className={`pick${personality === t.id ? ' is-active' : ''}`} onClick={() => setPersonality(t.id)}>
                <span className="pick__circle">
                  <CatAvatar typeId={t.id} profile size={60} />
                  {personality === t.id && <CheckIcon className="pick__check" />}
                </span>
                <span className="pick__name">{t.name}</span>
              </button>
            ))}
            <button type="button" role="radio" aria-checked={personality === 'random'} className={`pick${personality === 'random' ? ' is-active' : ''}`} onClick={() => setPersonality('random')}>
              <span className="pick__circle">
                <img src={spriteUrl('bubble-question')} width={44} alt="" draggable={false} />
                {personality === 'random' && <CheckIcon className="pick__check" />}
              </span>
              <span className="pick__name">랜덤</span>
            </button>
          </div>

          {personality === 'random' ? (
            <section className="card">
              <h3>랜덤 · 어떤 성격일까?</h3>
              <p className="card__desc">시작하는 순간 다섯 가지 성격 중 하나가 무작위로 정해져요.</p>
            </section>
          ) : (
            <PatternCard typeId={personality} />
          )}

          <div className="select__footer">
            <label className="field name-field">
              <span>이름</span>
              <input value={profile.name} maxLength={MAX_CAT_NAME_LENGTH} placeholder={DEFAULT_CAT_NAME} onChange={(e) => update({ name: e.target.value })} autoComplete="off" />
              <small>
                {profile.name.length}/{MAX_CAT_NAME_LENGTH}
              </small>
            </label>

            <fieldset className="field gender-field">
              <legend>성별</legend>
              {GENDERS.map((g) => (
                <label key={g} className={profile.gender === g ? 'is-active' : ''}>
                  <input type="radio" name="gender" value={g} checked={profile.gender === g} onChange={() => update({ gender: g })} />
                  {GENDER_LABEL[g]}
                </label>
              ))}
            </fieldset>

            <div className="field age-field">
              <div className="age-field__head">
                <label htmlFor="age-range">나이</label>
                <output htmlFor="age-range">
                  {formatAge(profile.startAgeMonths)} · {stage}
                </output>
              </div>
              <div className="age-field__row">
                <span aria-hidden="true">{formatAge(MIN_AGE_MONTHS)}</span>
                <input
                  id="age-range"
                  className="gauge"
                  type="range"
                  min={MIN_AGE_MONTHS}
                  max={MAX_AGE_MONTHS}
                  step={1}
                  value={profile.startAgeMonths}
                  style={{ '--pct': `${agePercent}%` } as React.CSSProperties}
                  onChange={(e) => update({ startAgeMonths: Number(e.target.value) })}
                />
                <span aria-hidden="true">{formatAge(MAX_AGE_MONTHS)}</span>
              </div>
            </div>

            <ImageButton sprite="btn-select" label="선택하기" onClick={confirm} width={SELECT_BUTTON_WIDTH} />
          </div>
        </>
      )}
    </div>
  )
}
