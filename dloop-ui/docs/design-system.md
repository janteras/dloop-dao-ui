# D-LOOP UI Design System

This document outlines the design system and UI components used in the D-LOOP UI application.

## Design Philosophy

The D-LOOP UI design system is built on principles of clarity, consistency, and usability, with a focus on providing an intuitive experience for both blockchain experts and newcomers alike. The design prioritizes mobile-first responsive layouts while maintaining a professional, data-rich interface that conveys complex governance information clearly.

## Color Palette

### Primary Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary | `#3B82F6` | Primary actions, key UI elements, highlights |
| Primary Dark | `#2563EB` | Hover states for primary elements |
| Primary Light | `#93C5FD` | Backgrounds, subtle highlights |

### Neutral Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Background | `#FFFFFF` / `#0F172A` | Page background (light/dark mode) |
| Surface | `#F8FAFC` / `#1E293B` | Card backgrounds, elevated surfaces (light/dark mode) |
| Border | `#E2E8F0` / `#334155` | Subtle dividers and borders (light/dark mode) |

### Semantic Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Success | `#10B981` | Positive actions, confirmations |
| Warning | `#F59E0B` | Caution states, warnings |
| Danger | `#EF4444` | Errors, destructive actions |
| Info | `#3B82F6` | Informational elements |

### Typography Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Text Primary | `#0F172A` / `#F8FAFC` | Primary text (light/dark mode) |
| Text Secondary | `#64748B` / `#94A3B8` | Secondary text, labels (light/dark mode) |
| Text Muted | `#94A3B8` / `#64748B` | Helper text, disabled states (light/dark mode) |

## Typography

### Font Families

- **Primary Font**: Inter (Sans-serif)
- **Monospace Font**: JetBrains Mono (for code, addresses, etc.)

### Font Sizes

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| xs | 12px | 16px | Small labels, captions |
| sm | 14px | 20px | Secondary text, buttons |
| base | 16px | 24px | Body text, inputs |
| lg | 18px | 28px | Section headings |
| xl | 20px | 28px | Subheadings |
| 2xl | 24px | 32px | Page titles |
| 3xl | 30px | 36px | Major headings |
| 4xl | 36px | 40px | Hero text |

### Font Weights

- **Regular**: 400
- **Medium**: 500
- **Semi-Bold**: 600
- **Bold**: 700

## Spacing System

Our spacing system uses a 4px base unit (0.25rem):

| Name | Size | Rem Value |
|------|------|-----------|
| 0 | 0px | 0 |
| 1 | 4px | 0.25rem |
| 2 | 8px | 0.5rem |
| 3 | 12px | 0.75rem |
| 4 | 16px | 1rem |
| 5 | 20px | 1.25rem |
| 6 | 24px | 1.5rem |
| 8 | 32px | 2rem |
| 10 | 40px | 2.5rem |
| 12 | 48px | 3rem |
| 16 | 64px | 4rem |
| 20 | 80px | 5rem |
| 24 | 96px | 6rem |

## Breakpoints

| Name | Size |
|------|------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

## Shadow System

| Name | Value | Usage |
|------|-------|-------|
| sm | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Subtle elevation |
| md | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` | Cards, dropdowns |
| lg | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` | Popovers, dialogs |
| xl | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` | Modals |
| 2xl | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` | Major UI elements |

## Border Radius

| Name | Value |
|------|-------|
| none | `0px` |
| sm | `0.125rem` (2px) |
| md | `0.375rem` (6px) |
| lg | `0.5rem` (8px) |
| xl | `0.75rem` (12px) |
| 2xl | `1rem` (16px) |
| full | `9999px` |

## Component System

### Basic Components

#### Button

Buttons follow a consistent structure with variants and sizes:

**Variants**:
- **Primary**: Filled background, used for primary actions
- **Secondary**: Outlined, used for secondary actions
- **Ghost**: No background or border, used for tertiary actions
- **Destructive**: Red background, used for destructive actions
- **Link**: Appears as a link, used for navigation actions

**Sizes**:
- **xs**: Compact size for tight spaces
- **sm**: Small size for secondary actions
- **md**: Default size for most actions
- **lg**: Large size for prominent actions

**States**:
- Default
- Hover
- Focus
- Active
- Disabled

#### Input

Form inputs with consistent styling:

**Variants**:
- **Default**: Standard input field
- **Filled**: Input with background fill
- **Error**: Input in error state

**States**:
- Default
- Focus
- Disabled
- Error

### Compound Components

#### Card

Container component for grouping related content:

**Variants**:
- **Default**: Standard card with subtle shadow
- **Elevated**: Card with more pronounced shadow
- **Bordered**: Card with border instead of shadow

#### Modal/Dialog

Overlay component for important actions or information:

**Variants**:
- **Standard**: Default modal with title, content, and actions
- **Alert**: Warning/error modal with emphasis
- **Side Sheet**: Slides in from side for additional information

#### Tabs

Navigation component for switching between related views:

**Variants**:
- **Default**: Standard horizontal tabs
- **Underlined**: Tabs with underline indicator
- **Filled**: Tabs with background fill for selected state
- **Vertical**: Tabs arranged vertically for side navigation

### Data Display Components

#### Table

Component for displaying structured data:

**Features**:
- Sortable columns
- Selectable rows
- Pagination
- Mobile-responsive variants

#### Chart

Components for data visualization:

**Types**:
- Line charts
- Bar charts
- Pie/Donut charts
- Area charts

#### Leaderboard

Specialized component for ranking display:

**Features**:
- Rank indicators
- Score/metric display
- User/entity information
- Status indicators

### Navigation Components

#### Navbar

Main navigation component:

**Features**:
- Brand area
- Navigation links
- User account area
- Mobile responsive collapse

#### Bottom Navigation (Mobile)

Mobile-specific navigation:

**Features**:
- Icon and label for each destination
- Active state indicator
- Context-aware help

#### Sidebar

Side navigation for desktop views:

**Features**:
- Section organization
- Collapsible sections
- Visual hierarchy of items
- Compact and expanded states

## Accessibility Guidelines

- **Color Contrast**: All text meets WCAG AA standard (4.5:1 for normal text, 3:1 for large text)
- **Keyboard Navigation**: All interactive elements are accessible via keyboard
- **Screen Readers**: Proper ARIA attributes and semantic HTML
- **Focus States**: Visible focus indicators for all interactive elements
- **Touch Targets**: Minimum 44x44px touch targets for mobile

## Dark Mode

The design system supports both light and dark modes:

- **Color Mapping**: Each color has a light and dark mode variant
- **Contrast Preservation**: Text remains legible in both modes
- **Transition**: Smooth transition between modes
- **Media Query**: Respects user system preference by default

## Implementation Details

The design system is implemented using TailwindCSS with custom theme configuration:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#93C5FD'
        },
        // ... other colors
      },
      // ... other theme extensions
    }
  },
  // ... other configuration
}
```

Components are built using:
- TailwindCSS for styling
- shadcn/ui as a component base
- Radix UI for accessible primitives

## Using the Design System

### Component Usage Example

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

function ProposalCard({ proposal }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{proposal.title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{proposal.description}</p>
        {/* Additional proposal details */}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="ghost">Decline</Button>
        <Button>Vote</Button>
      </CardFooter>
    </Card>
  );
}
```

### Utility Class Patterns

Common utility class combinations:

**Container widths**:
```html
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>
```

**Responsive grids**:
```html
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Grid items -->
</div>
```

**Card layouts**:
```html
<div className="space-y-4">
  <div className="bg-card rounded-lg shadow-md p-4">
    <!-- Card content -->
  </div>
</div>
```

## Design Tokens

Design tokens are available as CSS variables for use outside the component system:

```css
:root {
  --color-primary: #3B82F6;
  --color-background: #FFFFFF;
  --font-family-base: 'Inter', sans-serif;
  --spacing-4: 1rem;
  /* ... other tokens */
}

.dark {
  --color-primary: #3B82F6;
  --color-background: #0F172A;
  /* ... other dark mode tokens */
}
```