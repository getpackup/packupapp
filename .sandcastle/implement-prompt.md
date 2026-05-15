# TASK

Fix issue {{TASK_ID}}: {{ISSUE_TITLE}}

Pull in the issue using `gh issue view <ID>`. If it has a parent PRD, pull that in too.

Only work on the issue specified.

Work on branch {{BRANCH}}. Make commits and run tests.

# CONTEXT

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

Before writing any test, read at least two existing `.test.tsx` files in the same or a sibling directory. Copy their import style (relative paths only — never `~` aliases) and their `vi.mock` patterns verbatim. This avoids wasting iterations on path resolution and Firebase/jsdom compatibility issues that are already solved in the existing tests.

# EXECUTION

If applicable, use RGR to complete the task.

1. RED: write one test
2. GREEN: write the implementation to pass that test
3. REPEAT until done
4. REFACTOR the code

# FEEDBACK LOOPS

Before committing, run `pnpm typecheck` and `pnpm test` to ensure the tests pass.

# COMMIT

Make a git commit. The commit message must:

1. Start with "conventional commits" prefix, i.e. `feat:`, `chore:`, `fix:`
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

# THE ISSUE

If the task is not complete, leave a comment on the issue with what was done.

Do not close the issue - this will be done later.

If there is a comment on the issue saying it has been completed, and there is a commit that is not yet on the `main` branch, output <promise>COMPLETE</promise>.

Once complete, output <promise>COMPLETE</promise>.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
