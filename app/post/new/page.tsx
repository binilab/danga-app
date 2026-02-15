import { PageTitle } from "@/components/PageTitle";
import { ImageUploader } from "@/components/post/ImageUploader";

/**
 * 게시글 업로드 페이지에서 이미지 업로드와 캡션 작성 후 등록까지 처리합니다.
 */
export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="코디 올리기"
        description="이미지를 올리고 한 번에 공개해봐. 반응은 피드에서 바로 확인할 수 있어."
      />
      <ImageUploader />
    </div>
  );
}
