## Summary

<!--- What does this PR do? 1-3 bullet points. -->

## Related Issue

<!--- Link to the issue if applicable, e.g., "Closes #123". -->

## Type of Change

<!--- Check the relevant box(es). -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Refactor (no functional change)
- [ ] Infrastructure (CI, Docker, deps, etc.)
- [ ] Documentation

## Checklist

<!--- Ensure the following are complete before requesting review. -->

- [ ] I have following the [technical guidelines](../AGENTS.md).
- [ ] Lint and typecheck pass locally (`moon run :lint && moon run :typecheck && moon run :check`).
- [ ] Pydantic schema changes are reflected in `packages/core/src/schema.d.ts` (ran `moon run core:generate`).
- [ ] New SQLAlchemy models are imported in `alembic/env.py` and a migration was created.
- [ ] Changes are covered by existing tests or test coverage is not applicable.

<!-- 
  For the reviewer: ensure the PR description is clear, 
  the changes are well-scoped, and the checklist is complete.
-->
