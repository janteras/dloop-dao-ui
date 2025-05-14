
# D-Loop UI Style Guide

## Brand Colors

The D-Loop interface uses a carefully selected color palette defined in CSS variables:

### Light Mode
- Background: `hsl(210 40% 98%)`
- Foreground: `hsl(222 47% 11%)`
- Primary/Accent: `hsl(158 79% 45%)`
- Warning: `hsl(0 84% 60%)`

### Dark Mode
- Background: `hsl(0 0% 13%)`
- Foreground: `hsl(0 0% 95%)`
- Primary/Accent: `hsl(158 79% 55%)`
- Warning: `hsl(8 83% 55%)`

## Typography

### Headings
- H1: 1.875rem (30px), font-bold
- H2: 1.5rem (24px), font-semibold
- H3: 1.25rem (20px), font-medium

### Body Text
- Default: 1rem (16px)
- Small: 0.875rem (14px)
- Micro: 0.75rem (12px)

### Font Families
- Primary: System font stack
- Monospace: For addresses and code

## Components

### Buttons
```css
/* Primary Button */
.btn-primary {
  @apply bg-accent text-dark-bg font-medium hover:bg-darker-accent transition-colors;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
}

/* Danger Button */
.btn-danger {
  @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
}
```

### Cards
```css
.card {
  @apply bg-card text-card-foreground rounded-lg border border-border p-6;
}

.proposal-card {
  @apply hover:border-accent transition-all duration-300;
}
```

### Form Elements
```css
/* Input Fields */
.input {
  @apply bg-input text-input-foreground border-input-border rounded-md px-3 py-2;
}

/* Select Dropdowns */
.select {
  @apply bg-input text-input-foreground border-input-border rounded-md;
}
```

### Spacing System
- Extra Small: 0.5rem (8px)
- Small: 1rem (16px)
- Medium: 1.5rem (24px)
- Large: 2rem (32px)
- Extra Large: 3rem (48px)

### Layout
- Container Max Width: 1280px
- Grid Gap: 1.5rem (24px)
- Component Padding: 1rem (16px)

### Animation & Transitions
```css
/* Standard Transition */
.transition-standard {
  @apply transition-all duration-300;
}

/* Hover Effect */
.btn-hover-effect:hover {
  @apply transform -translate-y-0.5 shadow-md shadow-accent/20;
}
```

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: >= 640px
- Desktop: >= 1024px
- Large Desktop: >= 1280px

## Usage Guidelines

1. Always use the defined CSS variables for colors
2. Maintain consistent spacing using the spacing system
3. Ensure responsive design works on all breakpoints
4. Use existing component classes rather than creating new ones
5. Follow mobile-first approach in all implementations

## Accessibility

- Maintain WCAG 2.1 AA compliance
- Use semantic HTML elements
- Ensure sufficient color contrast (minimum 4.5:1)
- Provide focus states for interactive elements
- Support keyboard navigation

## Best Practices

1. Use Tailwind utility classes for layout and spacing
2. Leverage CSS variables for theme consistency
3. Follow mobile-first responsive design
4. Maintain consistent component spacing
5. Use defined transition classes for interactions
