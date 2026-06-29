import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { personRanks, teamRanks } from '@/data/mock';

const medalStyles = [
  { bg: '#FEF3C7', fg: '#F59E0B' },
  { bg: '#F1F5F9', fg: '#94A3B8' },
  { bg: '#F6EDE4', fg: '#C2825A' },
];

export default function RankingPage() {
  const topThree = personRanks.slice(0, 3);
  const others = personRanks.slice(3);
  const maxTeamLikes = Math.max(...teamRanks.map((team) => team.likes));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink">
            <ArrowLeft size={16} />
            Home Feed
          </Link>
          <h1 className="text-2xl font-extrabold tracking-normal text-ink md:text-3xl">랭킹</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">이번 달 · 개인과 팀 참여도를 함께 확인합니다.</p>
        </div>
        <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink shadow-hairline">
          이번 달
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <h2 className="mb-3 text-sm font-extrabold text-ink">개인 랭킹</h2>
          <div className="mb-5 grid gap-3 md:grid-cols-3 md:items-end">
            {topThree.map((person, index) => {
              const style = medalStyles[index];
              const isFirst = index === 0;
              return (
                <article
                  key={person.id}
                  className={`rounded-2xl border p-5 text-center shadow-hairline ${
                    isFirst ? 'border-[#F7E2B0] bg-[#FFFAF0] md:order-2 md:-translate-y-4' : 'border-slate-200 bg-white'
                  } ${index === 1 ? 'md:order-1' : ''} ${index === 2 ? 'md:order-3' : ''}`}
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-extrabold" style={{ background: style.bg, borderColor: style.fg, color: style.fg }}>
                    {person.name.charAt(0)}
                  </div>
                  <span className="mb-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-extrabold text-white" style={{ background: style.fg }}>
                    {index + 1}
                  </span>
                  <p className="font-extrabold text-ink">{person.name}</p>
                  <p className="mb-3 text-xs font-semibold text-slate-400">{person.team}</p>
                  {person.badge && (
                    <span className="mb-3 inline-flex rounded-full bg-[#E6F8F1] px-2 py-0.5 text-[11px] font-bold text-[#0C7A59]">
                      {person.badge}
                    </span>
                  )}
                  <div className="grid grid-cols-3 rounded-xl border border-slate-100 bg-white py-3">
                    <RankMetric label="Agent" value={String(person.agents)} />
                    <RankMetric label="추천" value={String(person.likes)} highlight />
                    <RankMetric label="사용" value={String(person.tried)} />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-hairline">
            {others.map((person, index) => (
              <div key={person.id} className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-b-0">
                <span className="w-7 text-center text-sm font-extrabold text-slate-300">{index + 4}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-600">
                  {person.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{person.name}</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {person.team} · Agent {person.agents}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#0C7A59]">{person.likes}</p>
                  <p className="text-xs font-semibold text-slate-400">추천</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <h2 className="mb-3 text-sm font-extrabold text-ink">팀 랭킹</h2>
          <div className="space-y-3">
            {teamRanks.map((team, index) => {
              const style = medalStyles[index] ?? medalStyles[1];
              const percent = Math.round((team.likes / maxTeamLikes) * 100);
              return (
                <article key={team.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-hairline">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: style.bg, color: style.fg }}>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-ink">{team.name}</p>
                      <p className="text-xs font-semibold text-slate-400">
                        멤버 {team.members}명 · Agent {team.agents}
                      </p>
                    </div>
                    <Trophy size={18} className="text-[#F59E0B]" />
                  </div>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-500">받은 추천</span>
                    <span className="text-[#0C7A59]">{team.likes.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-mint" style={{ width: `${percent}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function RankMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-extrabold ${highlight ? 'text-[#0C7A59]' : 'text-ink'}`}>{value}</p>
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}
