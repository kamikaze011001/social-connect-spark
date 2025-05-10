# Dark Theme Implementation Guide

## Overview
This guide outlines the dark theme implementation in our application, which uses Tailwind CSS and the `next-themes` package for theme management.

## Current Implementation

### Theme Configuration
The application uses a CSS variables-based theming system defined in `src/index.css`. The theme includes:

- Light theme (default)
- Dark theme
- System preference detection

### Theme Variables
The theme is controlled through CSS variables that define colors for various UI elements:

```css
:root {
  /* Light theme variables */
  --background: 260 36% 98%;
  --foreground: 260 10% 10%;
  /* ... other light theme variables ... */
}

.dark {
  /* Dark theme variables */
  --background: 260 15% 10%;
  --foreground: 260 5% 95%;
  /* ... other dark theme variables ... */
}
```

### Theme Switching
Theme switching is implemented in the Settings page (`src/pages/SettingsPage.tsx`) with three options:
- Light
- Dark
- System (follows system preference)

## Components and Styling

### Base Components
All UI components are built with dark mode support using Tailwind's dark mode classes. Components automatically adapt to the current theme using the following patterns:

1. Background colors: `bg-background`
2. Text colors: `text-foreground`
3. Border colors: `border-border`
4. Accent colors: `bg-accent text-accent-foreground`

### Component Examples

#### Buttons
```tsx
<Button variant="default">Default Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="outline">Outline Button</Button>
```

#### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card Content</CardContent>
</Card>
```

## Best Practices

1. **Use Theme Variables**
   - Always use the predefined theme variables instead of hardcoding colors
   - Use semantic color names (e.g., `bg-background` instead of specific colors)

2. **Component Development**
   - Test components in both light and dark modes
   - Use Tailwind's dark mode modifier (`dark:`) for theme-specific styles
   - Ensure sufficient contrast ratios in both themes

3. **Custom Components**
   When creating new components:
   ```tsx
   // Good
   <div className="bg-background text-foreground">
     <p className="text-muted-foreground">Content</p>
   </div>

   // Avoid
   <div className="bg-white dark:bg-gray-900">
     <p className="text-gray-600 dark:text-gray-400">Content</p>
   </div>
   ```

4. **Images and Icons**
   - Use SVG icons that support both themes
   - Consider using different image assets for light/dark modes when necessary
   - Use `opacity` or `filter` for theme-specific image adjustments

## Theme-Specific Considerations

### Colors
- Primary: Used for main actions and brand identity
- Secondary: Used for secondary actions and UI elements
- Accent: Used for highlights and special elements
- Muted: Used for less prominent UI elements
- Destructive: Used for error states and dangerous actions

### Contrast
- Maintain WCAG 2.1 AA standards for contrast ratios
- Test text readability in both themes
- Ensure interactive elements are clearly visible

### Transitions
- Use smooth transitions between themes
- Default transition duration: 200ms
- Apply transitions to color changes only

## Testing

1. **Manual Testing**
   - Test all components in both themes
   - Verify theme persistence across page reloads
   - Check system preference detection

2. **Automated Testing**
   - Include theme-specific tests in component tests
   - Test theme switching functionality
   - Verify color contrast ratios

## Troubleshooting

### Common Issues
1. **Theme Not Persisting**
   - Check localStorage implementation
   - Verify theme provider setup

2. **Inconsistent Colors**
   - Ensure using theme variables
   - Check for hardcoded colors
   - Verify Tailwind configuration

3. **Flickering on Load**
   - Implement proper theme initialization
   - Use proper transition timing

## Future Improvements

1. **Theme Customization**
   - Allow users to customize accent colors
   - Implement theme presets

2. **Accessibility**
   - Add high contrast theme option
   - Implement reduced motion preferences

3. **Performance**
   - Optimize theme switching performance
   - Implement theme preloading

## Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) 