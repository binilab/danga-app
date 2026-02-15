type PageTitleProps = {
  title: string;
  description: string;
};

/**
 * 페이지마다 같은 형태의 제목 영역을 재사용하기 위한 컴포넌트입니다.
 */
export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <section className="mb-6">
      <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>
    </section>
  );
}
