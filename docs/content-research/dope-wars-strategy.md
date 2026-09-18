# Editorial research: one Dope Wars article

Researched September 17, 2026. Selected URL: `/blog/dope-wars-strategy`.

## Topic decision

| Candidate | Search intent and observed evidence | Decision |
| --- | --- | --- |
| Dope Wars strategy, price guide, debt and high scores | Current results include the site's brief rules page, a [GameFAQs guide listing dating to 2000](https://gamefaqs.gamespot.com/pc/562935-dope-wars/faqs), and a [legacy strategy page](https://stevekola.tripod.com/dopewarsguide/id2.html) covering loan mechanics that this remake does not implement. | Chosen. Publish original, version-specific explanations and numbers from the actual game. |
| Drug Wars / Dope Wars history and calculator nostalgia | Searches surface substantial historical coverage and nostalgia discussions; the site already has an `/about` history page. | Less incremental value for this one-post request. |
| Where to play Dope Wars online without downloading | Closely overlaps the site's existing homepage and its instant-play purpose. | Avoid making a second page compete for the same primary job. |
| Best Dope Wars versions or similar games | Results span mobile editions, an onchain game, and an MMO. A defensible comparison would require first-hand testing across products. | Less direct fit than a guide grounded in this product. |

This is qualitative search-result research, not a keyword-volume or ranking-difficulty study. No Search Console, Bing Webmaster Tools, or paid keyword dataset was available; no traffic figures or ranking guarantees are claimed. Search results are evidence of competing content and intent, not proof of search volume.

## Reader and query coverage

- Main reader: a Classic player who knows the controls and wants to make better decisions.
- Primary query theme: Dope Wars strategy.
- Supporting questions: Dope Wars price guide; what to buy first; debt versus bank interest; safest districts; final-day inventory; how to improve a 30-day score.
- Keep `/how-to-play` focused on rules and controls. Link both pages contextually; correct conflicting price, district, and scoring statements there.
- Avoid promises of a guaranteed score, fake first-hand playtest claims, keyword repetition, or treating all Dope Wars editions as the same game.

## Original evidence and calculations

The article's source of authority is the implementation shipped in this repository, not legacy strategy guides:

| Claim | Source |
| --- | --- |
| Opening cash/debt, capacity, 11 price ranges, multipliers, danger levels | `src/engine/constants.ts` |
| One-in-eight unavailability; shared ranges across districts | `src/engine/market.ts` |
| Whole-dollar debt and bank interest; repayment and withdrawals | `src/engine/finance.ts` |
| One unit per slot; sale availability; recorded average cost | `src/engine/inventory.ts` |
| Travel advances time; final trip clears market; fallback inventory valuation | `src/engine/game.ts` |
| Destination police risk; mugging uses carried cash | `src/engine/events.ts` |
| First escape probability, gun damage, victory consumes guns | `src/engine/combat.ts` |
| Market actions do not advance time; no Classic borrowing action | `src/engine/state-machine.ts` |

Price and district tables render from the constants to avoid transcription errors. Examples are expressly hypothetical, not claims about a recorded run. Interest comparison starts separate debt and bank balances at $5,000, then adds `floor(balance * rate)` each trip: after 5/10/20 trips, debt is $8,052/$12,965/$33,621 and bank is $6,379/$8,138/$13,249. The new-game bank balance is explicitly $0.

The [official Unix/Windows dopewars project](https://dopewars.sourceforge.io/) supports the article's edition distinction: it documents a configurable rewrite with features beyond the original. It does not supply this remake's prices. The public article also discloses AI assistance and its verification method, without inventing a named expert reviewer.

## Search implementation rationale

- Server-rendered article, visible summary and question headings, descriptive tables, real author organization, publication date, navigable contents, and crawlable internal links.
- Self-canonical URL, unique title/description, article Open Graph and Twitter metadata, generated social image, `BlogPosting` and `BreadcrumbList` JSON-LD matching visible content, and sitemap entries.
- A small blog index exposes the one article. No filler posts or duplicate article routes.
- Blog-only reading layout supports wide desktops and mobile; the game retains its existing narrow viewport.
- Public SEO URL fallbacks use the verified production domain instead of localhost. Explicit `NEXT_PUBLIC_APP_URL` still takes precedence.
- No claim that FAQ markup, a special AI file, or keyword stuffing produces rankings. Existing robots rules already allow the article.

[Google's AI features documentation](https://developers.google.com/search/docs/appearance/ai-features) says normal SEO fundamentals apply, including crawlability, textual content, internal links and structured data consistent with the page; it does not require special AI files or schema. [Google's Article guidance](https://developers.google.com/search/docs/appearance/structured-data/article) supports relevant article properties such as headline, author, dates and image. [Google's helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) favors useful original information and clear sourcing. These informed the structure; they do not guarantee selection or ranking.

[Bing's AI Performance announcement](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) describes citation reporting for supported Microsoft AI surfaces. After deployment, use Google Search Console to inspect the article and monitor query/page performance; use Bing Webmaster Tools to check indexing and available AI citation reporting. Compare article visits and onward game visits once enough data accumulates. No accounts, submissions, or monitoring automations were changed by this work.

## Verification

- Focused ESLint check and production Webpack build (including TypeScript) passed. Article, index and social image are statically generated.
- Evaluated interest examples with the actual finance function; verified the final-day sale example, unsold inventory fallback, and final bank interest through real engine actions.
- Browser checks at 320, 390, 768 and 1440 pixels: no page overflow, valid anchors, readable tables, working index/article/game navigation. The game returns to its original maximum 480-pixel width after navigating out of the blog.
- Verified full article text with JavaScript disabled, one H1, all 11 price rows and six districts, visible byline/date matching JSON-LD, canonical and social metadata, a successful PNG social card, incoming links, sitemap inclusion and crawl permission. No browser errors.
- Visually reviewed mobile and desktop article/table screenshots and the social image. Added a visible sideways-scroll hint for the price table on narrow screens.
- These are local production checks. Deployment, search indexing, rankings and AI citations have not been claimed or measured.
