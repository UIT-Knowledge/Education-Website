<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2024-04-29 | Updated: 2024-04-29 -->

# Assets

## Purpose
Static assets and resources for the UIT Knowledge platform including fonts, images, and media files used across the application.

## Key Files
| File | Description |
|------|-------------|

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `fonts/` | Web font files (Geist and Geist Mono) for typography |
| `images/` | Static images including profile pictures and UI backgrounds |

## For AI Agents

### Working In This Directory
- Assets are referenced by CSS and HTML files in the root directory
- Font files are loaded via CSS @font-face declarations
- Images are used for UI elements and branding
- Optimize images for web delivery before adding new assets

### Testing Requirements
- Verify font loading in different browsers
- Check image optimization and file sizes
- Ensure assets are properly referenced in CSS/HTML

### Common Patterns
- Use WOFF2 format for best compression
- Optimize images for web (JPEG/PNG/WebP)
- Follow naming conventions for asset organization

## Dependencies

### Internal
- Referenced by styles.css and HTML templates
- Used in admin panel and landing page

### External
- Geist font family by Vercel
- Image optimization tools for web delivery

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->