import Image from "next/image";
import Link from "next/link";
import { createPlaceholderImage, landingGalleryItems } from "@/lib/mock";

/**
 * 샘플 코디 카드를 그리드로 보여주는 섹션입니다.
 */
export function SampleGallery() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Sample gallery
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            커뮤니티에 올라온 코디 반응을 미리 확인해보세요.
          </p>
        </div>
        <Link
          href="/feed"
          className="hidden text-sm font-semibold text-[var(--brand)] sm:inline"
        >
          전체 피드 보기
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {landingGalleryItems.map((item) => (
          <Link
            key={item.id}
            href={`/p/${item.id}`}
            className="danga-panel overflow-hidden transition hover:translate-y-[-1px] hover:shadow-sm"
          >
            <div className="relative h-40 w-full">
              <Image
                src={createPlaceholderImage(item.imageLabel)}
                alt={`${item.imageLabel} 플레이스홀더 이미지`}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-2 p-4">
              <p className="line-clamp-2 text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">@{item.author}</p>
              <div className="flex gap-3 text-xs font-medium text-slate-600">
                <span>투표 {item.votes}</span>
                <span>댓글 {item.comments}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link href="/feed" className="inline-block text-sm font-semibold text-[var(--brand)] sm:hidden">
        전체 피드 보기
      </Link>
    </section>
  );
}
