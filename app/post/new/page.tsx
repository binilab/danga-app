import { PageTitle } from "@/components/PageTitle";
import { ImageUploader } from "@/components/post/ImageUploader";

/**
 * 게시글 업로드 페이지에서 이미지 업로드와 캡션 작성 후 등록까지 처리합니다.
 */
export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Upload"
        description="이미지를 업로드하고 캡션을 입력해 게시글을 등록하세요. 등록되면 피드로 이동합니다."
      />
      <ImageUploader />
    </div>
  );
}
