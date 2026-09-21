import { CAT_TYPES, type CatTypeId } from '../catTypes'

export function PatternCard({ typeId }: { typeId: CatTypeId }) {
  const t = CAT_TYPES[typeId]
  return (
    <section className="card">
      <h3>
        {t.name} · {t.tagline}
      </h3>
      <p className="card__desc">{t.personality}</p>
      <ul>
        {t.patterns.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  )
}
