
import { PageContainer } from "@/components/layout/PageContainer";

export default function TermsPage() {
  return (
    <PageContainer>
      <div className="prose dark:prose-invert max-w-none">
        <h1>Terms and Conditions</h1>
        <p className="text-lg font-semibold mb-8">Last updated: May 2, 2025</p>
        
        {/* Terms content */}
        <div className="space-y-6">
          {/* Content from Terms_and_Conditions.md formatted as HTML */}
        </div>
      </div>
    </PageContainer>
  );
}
