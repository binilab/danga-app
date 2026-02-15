import { CTA } from "@/components/landing/CTA";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RankPreview } from "@/components/landing/RankPreview";
import { SampleGallery } from "@/components/landing/SampleGallery";

/**
 * 랜딩 페이지에서 각 섹션 컴포넌트를 순서대로 조립합니다.
 */
export default function Home() {
  return (
    <div className="space-y-10 pb-4 sm:space-y-12">
      <Hero />
      <HowItWorks />
      <SampleGallery />
      <RankPreview />
      <CTA />
    </div>
  );
}
