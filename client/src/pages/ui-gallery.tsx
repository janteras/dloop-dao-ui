import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function UIGalleryPage() {
  return (
    <div className="space-y-10 p-6">
      <h1 className="text-3xl font-bold">D-Loop UI Enhancements</h1>
      <p className="text-lg text-muted-foreground">
        This page showcases the UI improvements we're working on.
      </p>
      
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">Theme System</h2>
        <p className="mb-4">We've implemented a new theme system with light and dark mode support.</p>
        
        <div className="flex items-center gap-4 mb-6">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">Try toggling the theme!</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Light Mode</h3>
            <p>Optimized for readability and clarity with lighter backgrounds.</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Dark Mode</h3> 
            <p>Reduces eye strain in low-light conditions with darker backgrounds.</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">UI Components</h2>
        <p className="mb-4">We've enhanced several UI components for improved usability and aesthetics:</p>
        
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li>New card components with hover effects and gradient options</li>
          <li>Enhanced buttons with additional variants and animations</li>
          <li>Status badges with color-coding and dot indicators</li>
          <li>Tab components with multiple display styles</li>
          <li>Skeleton loaders for improved loading states</li>
          <li>Tooltips for better information display</li>
        </ul>
        
        <p className="text-sm text-muted-foreground">
          These components are being integrated gradually to ensure compatibility with the existing codebase.
        </p>
      </div>
      
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">Visual Improvements</h2>
        <p className="mb-4">We've implemented several visual enhancements:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Color System</h3>
            <p>Semantic color variables for consistent theming across the application.</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Typography</h3>
            <p>Improved text hierarchy and readability for better content consumption.</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Animations</h3>
            <p>Subtle animations and transitions for a more polished user experience.</p>
          </div>
          
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Responsive Layout</h3>
            <p>Enhanced responsive design that works well on all screen sizes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}