# Branch Protection Rules

This document describes the branch protection rules that should be configured for this repository.

## Protected Branches

### Main Branch (`main`)

The `main` branch should be protected with the following rules:

#### Protection Settings:

-   **Protect this branch**: ✅ Enabled
-   **Require a pull request before merging**: ✅ Enabled
    -   **Require approvals**: 1 approval required
    -   **Dismiss stale pull request approvals when new commits are pushed**: ✅ Enabled
    -   **Require review from Code Owners**: ⬜ Optional (if CODEOWNERS file exists)
-   **Require status checks to pass before merging**: ✅ Enabled
    -   **Require branches to be up to date before merging**: ✅ Enabled
    -   Required status checks:
        -   `validate-version` (from release.yml workflow)
-   **Require conversation resolution before merging**: ✅ Enabled
-   **Require signed commits**: ⬜ Optional
-   **Require linear history**: ✅ Enabled (prevents merge commits, requires rebase)
-   **Allow force pushes**: ❌ Disabled
-   **Allow deletions**: ❌ Disabled

### Release Branch (`release`)

The `release` branch should be protected with the following rules:

#### Protection Settings:

-   **Protect this branch**: ✅ Enabled
-   **Require a pull request before merging**: ✅ Enabled
    -   **Require approvals**: 2 approvals required (higher than main)
    -   **Dismiss stale pull request approvals when new commits are pushed**: ✅ Enabled
    -   **Require review from Code Owners**: ✅ Enabled (if CODEOWNERS file exists)
-   **Require status checks to pass before merging**: ✅ Enabled
    -   **Require branches to be up to date before merging**: ✅ Enabled
    -   Required status checks:
        -   `validate-version` (from release.yml workflow)
-   **Require conversation resolution before merging**: ✅ Enabled
-   **Require signed commits**: ⬜ Optional
-   **Require linear history**: ✅ Enabled
-   **Allow force pushes**: ❌ Disabled
-   **Allow deletions**: ❌ Disabled

## How to Configure Branch Protection

### Via GitHub Web Interface:

1. Navigate to the repository on GitHub
2. Go to **Settings** → **Branches**
3. Click **Add rule** under "Branch protection rules"
4. Enter the branch name pattern (e.g., `main` or `release`)
5. Configure the protection settings as listed above
6. Click **Create** or **Save changes**

### Via GitHub CLI:

```bash
# Protect main branch
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["validate-version"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Protect release branch
gh api repos/{owner}/{repo}/branches/release/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["validate-version"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":2}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Workflow Integration

The branch protection rules work in conjunction with the automated CI/CD workflows:

-   **`version-bump.yml`**: Automatically increments version numbers when feature/bug/hotfix branches merge to `main`
-   **`version-validation.yml`**: Validates VERSION file format on all PRs to `main` or `release`
-   **`release.yml`**: Creates Git tags and GitHub releases when PRs are merged to `release`

**Note**: The `release` branch receives monthly PRs from `main` (manual process, not automatic on every merge)

## Merge Strategy

The repository uses different merge strategies depending on the direction of the pull request:

### Pull Requests to `main` (Feature/Bug → Main)

-   **Strategy**: **Merge and Commit** (Create a merge commit)
-   **Reason**: Preserves full history of feature/bug development and allows automatic version bumping
-   **Examples**:
    -   `feature/new-feature` → `main`: Merge commit created, version auto-bumped
    -   `bug/fix-issue` → `main`: Merge commit created, version auto-bumped
    -  `hotfix/urgent-fix` → `main`: Merge commit created, version auto-bumped

### Pull Requests from `main` (Main → Feature/Bug)

-   **Strategy**: **Rebase** (Rebase and merge)
-   **Reason**: Keeps feature/bug branches up-to-date with main without creating unnecessary merge commits
-   **Examples**:
    -   `main` → `feature/in-progress`: Rebase to update feature branch
    -   `main` → `bug/work-in-progress`: Rebase to sync with latest changes
    -   `main` → `hotfix/urgent-fix`: Rebase to sync with latest changes

### Pull Requests to `release` (Main → Release)

-   **Strategy**: **Rebase** (Rebase and merge)
-   **Reason**: Keeps release branch clean without merge commits, preventing "1 commit ahead" status from merge commits
-   **Example**: Monthly PR from `main` → `release` rebases changes and triggers release automation

## Version Management

### Calendar-Based Versioning

This project uses **Calendar-Based Versioning** with automatic version bumping:

**Version Format**: `YY.MM.minor.patch`

-   **YY**: Two-digit year (e.g., `25` for 2025)
-   **MM**: Two-digit month (e.g., `11` for November)
-   **minor**: Feature counter (increments with each feature, accumulates throughout the year)
-   **patch**: Bug fix counter (increments with each bug fix, resets to 0 when minor increments)

### Automatic Version Bumping

Version numbers are **automatically** incremented when PRs are merged to `main`:

-   **Feature branches** (`feature/*`) → Increments **minor**, resets **patch** to 0
    -   Example: `25.11.2.3` → `25.11.3.0`
-   **Bug branches** (`bug/*`) → Increments **patch**
    -   Example: `25.11.2.3` → `25.11.2.4`
-   **Other branches** → No automatic version bump

### Manual Version Updates

-   **New month**: Update VERSION file to `YY.MM.minor.patch` before first merge of the month
    -   Minor and patch continue from previous month
    -   Example: `25.11.5.2` → `25.12.5.2`
-   **New year**: Update VERSION file to `YY.01.0.0` for new year
    -   Minor and patch reset to 0
    -   Example: `25.12.47.3` → `26.01.0.0`

### Branching Workflow

**For Features:**

1. Create a feature branch from `main`: `feature/{feature_name}`
2. Make your changes (or create sub-branches for specific tasks)
3. Create a pull request from feature branch to `main` (use **Merge and Commit**)
4. After merge to `main`, the `version-bump.yml` workflow **automatically** increments the minor version

**For Bug Fixes:**

1. Create a bug branch from `main`: `bug/{bug_fix}`
2. Make your changes (or create sub-branches for specific tasks)
3. Create a pull request from bug branch to `main` (use **Merge and Commit**)
4. After merge to `main`, the `version-bump.yml` workflow **automatically** increments the patch version

**For Production Releases:**

1. Monthly (or as needed), create a PR from `main` to `release` (use **Rebase**)
2. The `version-validation.yml` workflow checks the version format
3. After merge to `release`, the `release.yml` workflow automatically creates a GitHub release with the version tag

**For Syncing Feature/Bug Branches with Main:**

1. When `main` has new changes you need in your feature/bug branch
2. Create a PR from `main` to your feature/bug branch (use **Rebase**)
3. This keeps your branch up-to-date without creating unnecessary merge commits

**Important for Copilot Tasks:**

-   When tasked with a feature or bug, never branch directly from `main`
-   Always branch from the respective `feature/{name}` or `bug/{name}` branch
-   Complete work and PR back to the parent feature/bug branch first
-   The feature/bug branch owner then PRs to `main` when ready

### Version File Format

The `VERSION` file in the repository root contains the calendar-based version:

```text
25.11.0.0
```

Examples for different months/years:

```text
25.11.5.2   # November 2025, 5 features, 2 bug fixes
25.12.8.0   # December 2025, 8 features total this year
26.01.0.0   # January 2026, new year reset
```

## Notes

-   Branch protection rules prevent direct pushes to protected branches
-   All changes must go through pull requests
-   Force pushes and branch deletions are blocked to maintain history integrity
-   The `main` branch is protected from deletion as requested
