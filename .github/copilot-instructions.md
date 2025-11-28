# GitHub Copilot Instructions for AutoTrixel

## Project Overview

AutoTrixel is a web-based triangle-pixel art engine that renders images using triangular pixels instead of traditional square pixels. The system allows users to create and manipulate triangle-based pixel art through an interactive web interface.

## Repository Structure

-   **`/src`** - Vue 3 source code (components, logic, assets)
-   **`/public`** - Static assets served directly
-   **`/src/logic`** - Core triangle-pixel rendering and generation logic
-   **`/src/components`** - Vue components for UI and canvas interaction

## Technology Stack

### Frontend

-   **Framework**: Vue 3.5.21 with Composition API (`<script setup>` SFCs)
-   **Build Tool**: Vite 7.1.7
-   **Routing**: Vue Router 4.5.1
-   **Styling**: Tailwind CSS 4.1.13

## Core Domain Concepts

The system is built around four hierarchical concepts:

### 1. Locations

Physical points in the airport with unique 3-character IDs:

-   **Framework**: Vue 3.5.21 with Composition API (`<script setup>` SFCs)
-   **Build Tool**: Vite 7.1.7
-   **Routing**: Vue Router 4.5.1
-   **Styling**: Tailwind CSS 4.1.13

## Core Domain Concepts

The system is built around rendering and manipulating triangle-based pixel art:

### 1. Triangle Pixels

The fundamental rendering unit - triangular shapes instead of square pixels:

-   **Purpose**: Create unique artistic effects by using triangular grid patterns
-   **Rendering**: Canvas-based drawing with precise triangle geometry
-   **Color**: Each triangle can have independent color values

### 2. Canvas System

Interactive drawing surface for triangle-pixel manipulation:

-   **Purpose**: Provide real-time rendering and user interaction
-   **Features**: Pan, zoom, color selection, triangle manipulation
-   **Events**: Mouse/touch interaction for drawing and editing

### 3. Image Processing

Convert traditional images to triangle-pixel format:

-   **Input**: Standard image formats (PNG, JPG, etc.)
-   **Processing**: Analyze pixel data and map to triangular grid
-   **Output**: Triangle-based representation of the source image

### 4. Export/Save

Output triangle-pixel art in various formats:

-   **Formats**: Export as image files or save project data
-   **Quality**: Configurable resolution and triangle density
-   **Sharing**: Generate shareable URLs or download files

## Coding Standards

### JavaScript/Vue (Frontend)

-   Use **Vue 3 Composition API** with `<script setup>` syntax
-   Follow **single-file component (SFC)** structure
-   Use **Vue Router** for navigation (if multi-page)
-   Apply **Tailwind CSS** utility classes for styling
-   Keep components focused and modular

### Canvas/Rendering

-   Use **Canvas API** for efficient triangle rendering
-   Optimize drawing loops for performance
-   Handle **device pixel ratio** for high-DPI displays
-   Implement **requestAnimationFrame** for smooth animations

## Development Guidelines

### Adding New Features

1. **Rendering Logic**: Add/update logic in `src/logic/createAutoTrixel.js`
2. **UI Components**: Create/update Vue components in `src/components/`
3. **Styling**: Use Tailwind utilities in component templates
4. **Testing**: Test across different browsers and devices

### Triangle Rendering System

-   Maintain consistent triangle geometry calculations
-   Optimize for performance (avoid unnecessary redraws)
-   Handle edge cases (canvas boundaries, color transitions)

## Version Control and Branching Strategy

### Branch Structure

The repository follows a structured branching model with two long-lived branches:

-   **`main`** - Primary development branch

    -   Contains the latest stable development code
    -   Receives PRs from feature and bug branches
    -   Protected branch with required reviews
    -   Sends monthly PRs to `release` branch

-   **`release`** - Production-ready code
    -   Contains code that is deployed to production
    -   Receives monthly PRs from `main` branch
    -   Tagged with version numbers
    -   Protected branch with required reviews

### Branch Naming Conventions

When creating new branches, follow these naming patterns:

-   **Feature branches**: `feature/{feature_name}`

    -   Example: `feature/color-picker`, `feature/triangle-grid-editor`
    -   Branch off from `main`
    -   PR back to `main` when feature is complete
    -   **For Copilot tasks**: If tasked to work on a feature, create a sub-branch from the feature branch (e.g., `feature/color-picker/copilot-task`), complete the work, PR back to the feature branch first, then the feature branch PRs to `main`

-   **Bug fix branches**: `bug/{bug_fix}`
    -   Example: `bug/canvas-rendering`, `bug/color-palette-load`
    -   Branch off from `main`
    -   PR back to `main` when bug is fixed
    -   **For Copilot tasks**: If tasked to work on a bug fix, create a sub-branch from the bug branch (e.g., `bug/canvas-rendering/copilot-fix`), complete the work, PR back to the bug branch first, then the bug branch PRs to `main`

### Versioning Scheme

This project uses **Calendar-Based Versioning** with automatic version bumping:

#### Version Format: `YY.MM.minor.patch`

-   **YY**: Two-digit year (e.g., `25` for 2025)
-   **MM**: Two-digit month (e.g., `11` for November, `01` for January)
-   **minor**: Feature counter (increments with each feature, accumulates throughout the year)
-   **patch**: Bug fix counter (increments with each bug fix, resets to 0 when minor increments)

#### Automatic Version Bumping

Version numbers are automatically incremented when PRs are merged to `main`:

-   **Feature branches** (`feature/*`) → Increments **minor**, resets **patch** to 0
    -   Example: `25.11.2.3` → `25.11.3.0`
-   **Bug branches** (`bug/*`) → Increments **patch**

    -   Example: `25.11.2.3` → `25.11.2.4`

-   **Other branches** → No automatic version bump

#### Version Reset Rules

-   **New month**: Month (MM) must be manually updated in VERSION file before first merge of the month
    -   Minor and patch continue from previous month
    -   Example: `25.11.5.2` → `25.12.5.2` (month updated manually)
-   **New year**: Year (YY) must be manually updated, minor and patch reset to 0
    -   Example: `25.12.47.3` → `26.01.0.0` (manual update for new year)

#### Versioning Examples

```
25.11.0.0       # November 2025, first release
25.11.1.0       # First feature added
25.11.1.1       # First bug fix after feature 1
25.11.2.0       # Second feature (patch reset to 0)
25.11.2.3       # Three bug fixes after feature 2
25.12.5.0       # December release (month updated manually, 5 features total this year)
26.01.0.0       # January 2026, new year (manual reset)
```

#### Reading Version Numbers

-   `25.11.47.3` means:
    -   Released in **November 2025**
    -   Contains **47 features** developed this year
    -   Has **3 bug fixes** since the last feature

### Release Process

#### For Feature Development:

1. Create a feature branch from `main`: `feature/{feature_name}`
2. Make your changes in the feature branch or sub-branches
3. If working on a sub-task, create a branch from the feature branch, complete work, and PR back to the feature branch
4. Create a pull request from the feature branch to `main`
5. After PR approval and merge to `main`:
    - The `version-bump.yml` workflow **automatically** increments the minor version
    - The VERSION file is updated and committed automatically

#### For Bug Fixes:

1. Create a bug branch from `main`: `bug/{bug_fix}`
2. Make your changes in the bug branch or sub-branches
3. If working on a sub-task, create a branch from the bug branch, complete work, and PR back to the bug branch
4. Create a pull request from the bug branch to `main`
5. After PR approval and merge to `main`:
    - The `version-bump.yml` workflow **automatically** increments the patch version
    - The VERSION file is updated and committed automatically

#### For Production Releases:

1. Monthly (or as needed), create a PR from `main` to `release` (use **Rebase** strategy)
2. The `version-validation.yml` workflow validates the version format
3. After PR approval and merge to `release`, the `release.yml` workflow automatically creates a GitHub release with the version tag
4. Deploy from `release` branch to production

#### Important Guidelines for Copilot Tasks:

-   **Never branch directly from `main`** when working on a feature or bug task
-   Always branch from the respective `feature/{name}` or `bug/{name}` branch
-   Complete your work and PR back to the parent feature/bug branch first
-   The feature/bug branch owner then PRs to `main` when ready

### Branch Protection

-   **`main`** branch is protected from deletion and requires pull request reviews
-   **`release`** branch is protected from deletion and requires pull request reviews
-   Direct pushes to protected branches are not allowed
-   See `.github/BRANCH_PROTECTION.md` for detailed protection rules

### CI/CD Pipeline

The repository includes automated workflows:

-   **`version-bump.yml`**: Automatically increments version numbers when feature/bug branches merge to `main`
-   **`version-validation.yml`**: Validates VERSION file format on all PRs to `main` or `release`
-   **`release.yml`**: Creates Git tags and GitHub releases when PRs are merged to `release`

**Note**: The `release` branch receives monthly PRs from `main` (manual process, not automatic on every merge)

## Build and Run

### Environment Setup

The Copilot coding agent environment is configured to use Ubuntu 20.04 (`.github/copilot-environment.yml`). For local development, install the following:

### Frontend

```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
```

## Testing

-   Test rendering across different browsers and devices
-   Verify triangle geometry calculations
-   Test color processing and image conversion

## Important Notes

-   **Minimal Changes**: Make surgical, focused changes to existing code
-   **Documentation**: Update README files when changing core functionality
-   **Performance**: Optimize canvas rendering for smooth interactions
-   **Browser Compatibility**: Test across major browsers (Chrome, Firefox, Safari, Edge)
-   **Database Integrity**: Maintain referential integrity and follow existing schema patterns
-   **Location IDs**: Never manually create location IDs; always use the hashing algorithm
-   **WebSocket Updates**: Ensure real-time updates are sent for critical state changes
