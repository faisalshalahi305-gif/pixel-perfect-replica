<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Lesson content lives as one JSON block list in `lesson_content` (id 'main'); templates in `templates`. Why: the app has no sign-in, so all rows are shared and policy-limited.
- There is no AI template studio; templates are built in code (NovaFrames/NovaMore) and shown through the ➕ gallery. Why: the user removed the AI studio.
- Every block may carry an optional `fx` style layer (colors, light, shape, position, lock); merged/disassembled templates become a `group` block whose `children` are ordinary blocks/pieces. Why: one universal edit system for all templates with no x/y coordinates.
