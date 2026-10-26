# Cosmic Lesson Studio

Clone and build the project from GitHub repository: faisalshalahi305-gif/smart-template-studio-d71e06fa

Requirements:
1. Exact Design & Page Copy:
   - Recreate the main lesson page (Kepler's laws & universal gravitation physics lesson) exactly as in `src/routes/index.tsx` with all interactive blocks (tables, cards, callouts, equations, question/answer cards, image cards, stars background, editable text fields).
   - Keep the design, dark space theme, fonts, animations, and exact styling 100% faithful to the original.
   - Maintain the top action bar: editable headers, save button (`💾 حفظ`), and below it the second action button.

2. Remove the old Template Studio ("مصنع القوالب") routes and UI:
   - Remove the `/studio` and `/studio/$id` routes and complex factory editor.
   - Instead, the button under the save button (formerly "🏭 مصنع القوالب") should now open a dedicated full-screen overlay / studio page:
     - Toggleable clean full-screen canvas (white or black canvas background as chosen by the user).
     - AI Template Assistant (similar to AiPanel / smart generator):
       - User gives prompts / instructions and detailed requests in Arabic.
       - The AI generates the template and renders it directly on the canvas preview in real time.
       - User can send follow-up instructions to refine specific points.
       - "قبول" (Accept) and "رفض" (Reject) buttons:
         - Reject ("رفض"): discards the generated template draft.
         - Accept ("قبول"): saves the template directly to the database and adds it to the "+" menu under "قوالبي" with the exact standard size, format, and behavior of other lesson templates.
       - When inserted into the lesson via "+", it can be placed anywhere, shows the "+" / controls menu, and allows customizing color, size, positioning, etc.

3. AI Model Selector & Multi-Provider Support:
   - In the settings / AI panel, provide a selector between 3 AI providers:
     1. `GPT` (OpenAI / GPT models)
     2. `Gemini — Auto` (Google Gemini / Lovable AI)
     3. `Grok` (xAI Grok)
   - When the user selects a model and clicks save, the app actually switches the active AI provider for template generation.
   - Support Lovable AI / Edge functions / API keys so switching is functional and real.

4. Database & Persistence:
   - Setup Lovable Cloud / Supabase database with the tables:
     - `lesson_content` (id: 'main', blocks: jsonb, updated_at)
     - `templates` (id, name, category, width, height, background, elements: jsonb, created_at, updated_at, display_mode, sort_order, is_system)
     - `ai_settings` / user preferences for active model.
   - Ensure the Save button (`💾 حفظ`) works end-to-end, saves to the database immediately with success feedback, and syncs on page load.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/46e16fec-27b6-4f4a-800e-994e2b4770b5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
