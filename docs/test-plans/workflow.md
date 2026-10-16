# Workflow test-plan ledger

Append-only after a section lands on its recorded target branch. No automated tests have been created or run for this proposed section.

## NB-01 — React governance, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md)
Approval: Pending.

| ID | Type | Behavior and expected result |
|---|---|---|
| WF-01 | Unit/Node | Missing canonical files fail; after installation both root files exist and are byte-identical. |
| WF-02 | Unit/Node | Rules retain approval/TDD/immutable-history/remote-operation restrictions and React-specific automation semantics. |
| WF-03 | Unit/Node | Canonical rules contain no Flutter formatter/analyzer/test commands. |
| WF-04 | Integration/Node Git invocation | Git ignores a hypothetical evidence log path; no scratch evidence is tracked. |
| WF-05 | Unit/Node | Each registered plan resolves to a real planning file and section test plan, with proposed approval state before activation. |

Test location: `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/workflow/governance.test.mjs`.
Red execution must precede canonical file/config installation. Record red initially in the tool transcript; copy output to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/workflow/` only after its ignore rule is verified. No screenshots are required. Node built-in testing avoids dependency-install prerequisites for this bootstrap task.

Results: NOT RUN — awaiting plan approval.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.

---

## NB-01 execution — 2026-10-16

Approval: The owner approved the complete package on 2026-10-16. WF-05 now checks the activated approved registry while the proposed section above preserves its earlier state.

Red: `node --test test/unit/workflow/governance.test.mjs` from `/Users/pranav/Pranav_projects/github/no-brainy` exited 1 with five expected failures and one existing-registry pass. Green: the same command exited 0, six checks passed. Node syntax and Git whitespace checks also passed. Product suites and automated formatting require NB-02 dependencies and were not run. Execution record: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/workflow/tdd.md` (ignored).
