# CI/CD Versioning Setup

This document explains the CI/CD versioning and release automation setup for the AutoTrixel repository.

## Overview

The repository uses GitHub Actions to automate versioning and release management based on calendar-based versioning (`YY.MM.minor.patch`). Version numbers are automatically incremented when feature or bug branches are merged to `main`. Releases are automatically created when pull requests are merged to the `release` branch. Note: Pull requests to the `release` branch are performed manually on a monthly (or as needed) schedule from `main`, not automatically on every merge.

## Components

### 1. Workflow Files

**Location**: `.github/workflows/`

#### version-bump.yml

-   **Triggers**: When pull requests are merged to `main` branch
-   **Purpose**: Automatically increments version numbers based on branch type
-   **Actions**:
    -   Feature branches (`feature/*`) → Increments **minor**, resets **patch** to 0
    -   Bug branches (`bug/*`) → Increments **patch**
    -   Commits updated VERSION file back to `main`
-   **Safeguards**: Validates year/month match current date, exits with error if mismatch

#### version-validation.yml

-   **Triggers**: On pull requests to `main` or `release` branches (opened, synchronized, reopened)
-   **Purpose**: Validates that the VERSION file contains a valid calendar-based version
-   **Validation**:
    -   Checks format matches `YY.MM.minor.patch`
    -   Validates month is between 01-12
    -   Warns if year doesn't match current year
    -   For PRs to release: ensures version differs from latest tag

#### release.yml

-   **Triggers**: When a pull request is merged to the `release` branch
-   **Purpose**: Automatically creates a Git tag and GitHub release
-   **Actions**:
    -   Reads version from VERSION file
    -   Creates Git tag `v{VERSION}`
    -   Parses version to extract month name, year, feature count, and bug fix count
    -   Creates GitHub release with enhanced release notes showing statistics

### 2. VERSION File

**Location**: `VERSION` (repository root)

Contains the current version number in calendar-based format. Examples:

```text
25.11.0.0
25.11.5.2
26.01.0.0
```

### 3. Branch Protection

**Documentation**: `.github/BRANCH_PROTECTION.md`

Defines protection rules for `main` and `release` branches to ensure quality and prevent accidental changes.

## Merge Strategy

The repository uses different merge strategies depending on the direction of the pull request:

-   **Pull Requests to `main`** (Feature/Bug → Main): **Merge and Commit** - Preserves full history and triggers automatic version bumping
-   **Pull Requests from `main`** (Main → Feature/Bug): **Rebase** - Keeps branches up-to-date without unnecessary merge commits
-   **Pull Requests to `release`** (Main → Release): **Rebase** - Keeps release branch clean without merge commits, prevents "1 commit ahead" status

## Workflow Process

### For Feature Development

1. Create a feature branch from `main`: `feature/{feature_name}`
2. Develop your feature
3. Create a PR from feature branch to `main` (use **Merge and Commit** strategy)
4. The `version-validation.yml` workflow validates version format
5. After review and approval, merge to `main`
6. The `version-bump.yml` workflow **automatically** increments the minor version and commits the change

### For Bug Fixes

1. Create a bug branch from `main`: `bug/{bug_fix}`
2. Fix the bug
3. Create a PR from bug branch to `main` (use **Merge and Commit** strategy)
4. The `version-validation.yml` workflow validates version format
5. After review and approval, merge to `main`
6. The `version-bump.yml` workflow **automatically** increments the patch version and commits the change

### For Syncing Feature/Bug Branches

1. When `main` has new changes you need in your feature/bug branch
2. Create a PR from `main` to your feature/bug branch (use **Rebase** strategy)
3. This keeps your branch up-to-date without creating unnecessary merge commits

### For Production Releases

1. Monthly (or as needed), create a PR from `main` to `release` (use **Rebase** strategy)
2. The `version-validation.yml` workflow validates version format
3. After review and approval (requires 2 approvals for `release` branch), merge the PR
4. The `release.yml` workflow automatically:
    - Creates a Git tag `v{VERSION}` (e.g., `v25.11.0.0`)
    - Parses version to extract month name, year, and statistics
    - Creates a GitHub release with enhanced release notes showing feature count and bug fix count
5. Deploy from the `release` branch to production

## Calendar-Based Versioning Guide

### Version Format: `YY.MM.minor.patch`

-   **YY**: Two-digit year (e.g., `25` for 2025)
-   **MM**: Two-digit month (e.g., `11` for November, `01` for January)
-   **minor**: Feature counter (increments with each feature, accumulates throughout the year)
-   **patch**: Bug fix counter (increments with each bug fix, resets to 0 when minor increments)

### Automatic Version Bumping

-   **Feature branches** (`feature/*`) → Increments **minor**, resets **patch** to 0
    -   Example: `25.11.2.3` → `25.11.3.0`
-   **Bug branches** (`bug/*`) → Increments **patch**
    -   Example: `25.11.2.3` → `25.11.2.4`

### Manual Version Updates

-   **New month**: Update VERSION file before first merge of the month
    -   Minor and patch continue from previous month
    -   Example: `25.11.5.2` → `25.12.5.2`
-   **New year**: Update VERSION file to reset for new year
    -   Minor and patch reset to 0
    -   Example: `25.12.47.3` → `26.01.0.0`

### Examples

```text
25.11.0.0       # November 2025, first release
25.11.1.0       # First feature added
25.11.1.1       # First bug fix after feature 1
25.11.2.0       # Second feature (patch reset to 0)
25.11.2.3       # Three bug fixes after feature 2
25.12.5.0       # December release (5 features total this year)
26.01.0.0       # January 2026, new year reset
```

## Setting Up the Release Branch

The `release` branch is a long-lived branch that contains production-ready code. To create it:

```bash
# From main branch
git checkout main
git pull origin main
git checkout -b release
git push origin release
```

Once created, the branch should be protected according to the rules in `.github/BRANCH_PROTECTION.md`.

## Troubleshooting

### Version Validation Fails

-   Ensure VERSION file exists at repository root
-   Check that version follows calendar-based format: `YY.MM.minor.patch`
-   Valid examples: `25.11.0.0`, `25.12.5.2`, `26.01.0.0`
-   Month must be between 01-12

### Automatic Version Bump Fails

-   Check that year/month in VERSION file matches current year/month
-   If month or year has changed, manually update VERSION file before merging
-   Review GitHub Actions logs for specific error details

### Release Not Created

-   Verify PR was merged to `release` branch (not `main`)
-   Check that VERSION file is present and valid
-   Review GitHub Actions logs for error details

### Tag Already Exists

-   Ensure the version in VERSION file is unique
-   Each release must have a unique version number
-   Check existing tags with: `git tag -l`

## Manual Release Process (Fallback)

If automatic release fails, you can create a release manually:

```bash
# Read version from VERSION file
VERSION=$(cat VERSION)

# Create and push tag
git tag -a "v$VERSION" -m "Release version $VERSION"
git push origin "v$VERSION"

# Then create release via GitHub UI or gh CLI:
gh release create "v$VERSION" --title "Release v$VERSION" --notes "Release notes here"
```

## CI/CD Best Practices

1. **Always update VERSION file** when making changes that will be released
2. **Follow SemVer strictly** to communicate changes to users clearly
3. **Use pre-release tags** for versions not ready for production
4. **Test thoroughly** before merging to `release` branch
5. **Review release notes** in PR descriptions as they become release notes
6. **Never force push** to `main` or `release` branches
7. **Keep release branch stable** - only merge well-tested code from `main`

## References

-   [Semantic Versioning Specification](https://semver.org/)
-   [GitHub Actions Documentation](https://docs.github.com/en/actions)
-   [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
