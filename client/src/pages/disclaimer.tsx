
import { PageContainer } from "@/components/layout/PageContainer";

export default function DisclaimerPage() {
  return (
    <PageContainer>
      <div className="prose dark:prose-invert max-w-none">
        <h1>Disclaimer</h1>
        <p className="text-lg font-semibold mb-8">Last updated: May 5, 2025</p>
        
        {/* Disclaimer content */}
        <div className="space-y-6">
          {/* Content from Disclaimer.md formatted as HTML */}
        </div>
      </div>
    </PageContainer>
  );
}
