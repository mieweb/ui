---
description: Format, lint, commit, and push changes
---

# Commit Workflow

Run the standard commit workflow: format, lint, and commit with a generated message.

## Instructions

Execute these steps in order:

1. **Format the code**
   ```bash
   npm run format:fix
   ```

2. **Lint and fix issues**
   ```bash
   npm run lint:fix
   ```

3. **Check for any remaining errors**
   ```bash
   npm run lint && npm run typecheck
   ```

4. **Stage all changes**
   ```bash
   git add -A
   ```

5. **Generate a commit message** based on the staged changes using conventional commits format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting/styling
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

6. **Commit the changes** with the generated message

7. **Push to the current branch**
   ```bash
   git push
   ```

Report the results of each step and the final commit hash.
