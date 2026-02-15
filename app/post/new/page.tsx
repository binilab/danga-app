import { PageTitle } from "@/components/PageTitle";
import { ImageUploader } from "@/components/post/ImageUploader";

/**
 * 게시글 업로드 페이지에서 이미지 업로드 영역과 기본 입력 폼을 제공합니다.
 */
export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Upload"
        description="사진/설명/태그를 입력해 코디를 올리는 화면입니다. 이미지 업로드는 R2에 저장됩니다."
      />

      <ImageUploader />

      <form className="danga-panel space-y-5 p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            제목
          </label>
          <input
            type="text"
            placeholder="예: 단번에 정리한 출근룩"
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            코디 설명
          </label>
          <textarea
            placeholder="어떤 포인트를 살렸는지 간단히 적어주세요."
            rows={5}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            스타일 태그
          </label>
          <input
            type="text"
            placeholder="예: 미니멀, 스트릿, 톤온톤"
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)]"
          />
        </div>

        <button
          type="button"
          className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          업로드 준비 완료
        </button>
      </form>
    </div>
  );
}
