import { PortfolioDetailPage } from "@/features/portfolios/portfolio-detail-page";

export default function PortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  return <PortfolioDetailPage params={params} />;
}
