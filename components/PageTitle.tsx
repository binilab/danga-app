type PageTitleProps = {
  title: string;
  description: string;
};

/**
 * 페이지마다 같은 형태의 제목 영역을 재사용하기 위한 컴포넌트입니다.
 */
export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <section className="mb-4 sm:mb-6">
      <h1 className="danga-title">{title}</h1>
      <p className="danga-subtitle mt-2">{description}</p>
    </section>
  );
}
