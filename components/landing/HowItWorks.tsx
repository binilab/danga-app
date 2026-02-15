import { landingHowSteps } from "@/lib/mock";

/**
 * DANGA 사용 흐름을 3단계로 소개하는 안내 섹션입니다.
 */
export function HowItWorks() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          How it works
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          올리고, 반응 받고, 순위로 확인하는 흐름을 단번에 경험하세요.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {landingHowSteps.map((step) => (
          <article key={step.id} className="danga-panel p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-bold text-white">
              {step.id}
            </span>
            <h3 className="mt-3 text-base font-black text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
