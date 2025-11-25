# Design Guidelines: AI Mortgage Calculator Mobile App

## Design Approach
**Reference-Based Approach**: This app takes primary inspiration from modern fintech applications like Robinhood, Chime, and Cash App, with influences from the provided design mockups. The aesthetic prioritizes clarity, trust, and efficiency - essential for financial applications where users need to make informed decisions quickly.

## Core Design Principles
1. **Trust Through Transparency**: Clear data presentation with no hidden information
2. **Mobile-First Precision**: Every interaction optimized for thumb reach and single-hand use
3. **Progressive Disclosure**: Complex financial data revealed in digestible chunks
4. **Scannable Information**: Visual hierarchy that supports quick comprehension

## Typography System

**Font Family**: SF Pro Display (iOS) / Roboto (Android) for native feel, or Inter for web consistency

**Type Scale**:
- **Hero Numbers**: 48px, bold - for total monthly payment display
- **Section Headers**: 24px, semibold - for screen titles
- **Subsection Headers**: 18px, medium - for breakdown categories  
- **Body Text**: 16px, regular - for input labels and descriptions
- **Detail Text**: 14px, regular - for helper text and metadata
- **Fine Print**: 12px, regular - for disclaimers and footnotes

**Key Rule**: Financial figures always use tabular/monospaced number formatting for vertical alignment

## Layout System

**Spacing Primitives**: Use Tailwind units of 3, 4, 6, 8, and 12 for consistent rhythm
- Tight spacing (p-3): Between related form elements
- Standard spacing (p-4, p-6): Card padding and section gaps
- Generous spacing (p-8, p-12): Between major sections

**Screen Structure**:
- Top bar: 16px (p-4) vertical padding
- Content area: 16-24px (p-4 to p-6) horizontal margins
- Bottom navigation: Fixed 80px height with safe area inset
- Cards: 16px (p-4) internal padding with 12px (m-3) gaps between

**Grid System**: Single column on mobile with full-width cards, allowing 2-column layouts only for compact data pairs (e.g., "Age | Income")

## Component Library

### Navigation
**Bottom Tab Bar**:
- Fixed position with 4 tabs: Home, Saved, Alerts, Profile
- Icon + label format with 24px icons
- Active state: Primary blue with filled icon
- Inactive state: Gray with outline icon
- Height: 80px with safe area consideration

**Top Bar**:
- Minimal header with screen title centered or left-aligned
- Optional back button (left) and action button (right)
- Subtle shadow or border-bottom for depth

### Cards & Containers
**Primary Card**:
- White background with rounded corners (16px border radius)
- Subtle shadow: 0 2px 8px rgba(0,0,0,0.08)
- 16px internal padding
- 12px margin between cards

**Breakdown Card** (Payment details):
- List item format with icon + label + value
- Icon: 24px, primary blue tint
- Left-aligned label, right-aligned value
- 16px vertical padding per item
- Divider lines between items (1px, light gray)

### Form Inputs
**Text Input**:
- Height: 56px for touch-friendly interaction
- Rounded corners: 12px
- Border: 1px solid light gray, focus state gets primary blue border
- Label above input: 14px medium weight
- Placeholder text: Gray, 16px

**Slider Input** (Credit Score):
- Custom thumb: 32px circle
- Track height: 8px
- Active track: Primary blue gradient
- Inactive track: Light gray
- Value display above thumb

**Dropdown/Select**:
- Same styling as text input with chevron-down icon
- Options presented in bottom sheet modal on mobile

**Checkbox** (Homestead Exemption):
- 24px square with 6px border radius
- Checked: Primary blue fill with white checkmark
- Label to the right: 16px regular

### Buttons
**Primary Action** (Calculate Mortgage):
- Full width on mobile
- Height: 56px
- Bold rounded corners: 28px (pill shape)
- Primary blue background
- White text: 16px semibold
- Tap state: Slightly darker blue
- Disabled state: Light gray

**Secondary Action** (Edit, Clear):
- Same dimensions as primary
- White background with primary blue border
- Primary blue text
- Can be inline (not full-width) for secondary actions

**Icon Button** (Camera, Clear):
- 48px square
- Minimal: No background, just icon
- Tap state: Light gray circular background

### Data Visualization
**Payment Breakdown Items**:
- Consistent icon set (house, percentage, shield, document, etc.)
- Two-column layout: Description + Amount
- Amount always right-aligned with bold weight
- Total row: Heavier weight, larger text (20px), top border separator

**Financial Profile Display**:
- Key-value pairs in card format
- Label: 14px gray
- Value: 18px semibold dark
- 2-column grid for compact display where appropriate

### Photo/Image Handling
**Property Photo Upload**:
- Square aspect ratio preview (1:1)
- Dashed border placeholder state
- Camera icon centered when empty
- 120px x 120px thumbnail in saved calculations
- 16:9 aspect ratio for larger displays

**Saved Calculation Thumbnails**:
- 80px x 80px square with rounded corners (8px)
- Address text overlay if no photo
- Subtle gradient overlay for text legibility

### Modal/Sheet Patterns
**Bottom Sheet** (for selects, confirmations):
- Slides up from bottom
- Rounded top corners: 20px
- Handle indicator: 4px x 40px gray rounded bar
- Content padding: 24px
- Backdrop: Semi-transparent black (0.5 opacity)

## Screen-Specific Layouts

### Home Screen
- Top section: Logo/title with tagline
- Address input: Autocomplete-enabled text field
- Asking price: Currency input with $ prefix
- Photo upload: Optional centered card
- Calculate button: Fixed at bottom or inline after inputs
- Recent searches: List below main form (if saved calculations exist)

### Financial Profile Screen  
- Form layout with grouped sections
- Age + Income: Two-column on larger phones
- Credit score: Full-width slider with min/max labels
- Down payment: Currency input
- Mortgage type: Dropdown (30-year, 15-year, ARM, etc.)
- Monthly debt: Currency input
- Homestead exemption: Checkbox at bottom
- Save button: Fixed at bottom

### Payment Breakdown Screen
- Hero section: Total monthly payment in large bold text with "Estimated" label above
- Breakdown card: Itemized list with icons
- Each line item: Icon + label + amount
- Expandable details: Tap item to see calculation methodology
- Bottom actions: Save Calculation button and Share button

### Saved Calculations List
- Card-based list of saved calculations
- Each card: Thumbnail + address + total payment + date
- Swipe actions: Delete (left swipe)
- Empty state: Illustration + "No saved calculations" message

## Animation Guidelines
**Use sparingly and purposefully**:
- Screen transitions: Simple slide animations (300ms ease-out)
- Button taps: Subtle scale down (0.97) with 100ms duration
- Loading states: Skeleton screens or simple spinner, no elaborate animations
- Success states: Checkmark animation after calculation completes
- No: Parallax, complex scroll animations, decorative motion

## Accessibility
- Minimum touch target: 44px x 44px
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Form labels: Always visible, never placeholder-only
- Error states: Red text + icon, clear messaging
- Success states: Green accent with checkmark
- Screen reader labels for all interactive elements
- Dynamic type support: Text scales appropriately

## Images
- **Property Photos**: User-uploaded via camera or gallery, square aspect ratio for consistency in lists, larger preview on breakdown screen
- **Empty States**: Simple illustration or icon for "no saved calculations" state
- **Icons**: Use Heroicons (outline for inactive states, solid for active states) - 24px standard size