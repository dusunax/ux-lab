import HomeFeed from '@/components/HomeFeed';
import { agents } from '@/data/mock';

export default function HomePage() {
  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold text-slate-500">이번 주 인기 Agent</p>
          <h1 className="text-2xl font-extrabold tracking-normal text-ink md:text-3xl">사내 Agent를 발견하고 바로 실행하세요</h1>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          등록 Agent <span className="text-ink">{agents.length}</span>개 · mock Sprint 1
        </p>
      </div>
      <HomeFeed />
    </div>
  );
}
