# AI Crypto Advisor

A personalized crypto investor dashboard: a short onboarding quiz shapes a daily dashboard of coin prices, market news, an AI insight and a crypto meme, and every section can be rated to improve future recommendations.

## Live Demo

- **Production:** https://ori-crypto-advisor.up.railway.app
- **Repository:** https://github.com/OriChaiMatan/moveo-crypto-advisor

## Features

### Authentication

Sign up with name, email and password, then log in with email and password. The session survives page reloads and ends on logout.

### Personalized Onboarding

A three-step quiz asks which crypto assets the user follows, what kind of investor they are, and what content they want to see. The answers are saved to the database as user preferences.

### Personalized Dashboard

Four sections built from those preferences:

- **Coin Prices** — live prices, 24h change, market cap, volume and a year-to-date chart for the user's assets
- **Market News** — recent articles filtered to the assets the user follows
- **AI Insight of the Day** — a short market comment written for the user, generated once per day
- **Crypto Meme** — a fresh meme on each dashboard load

The user's content preference decides which section appears first.

### Feedback

Thumbs up or down on each of the four sections. Votes are stored in MongoDB together with the preferences and content that were on screen, and are restored when the page is reloaded.

## Technology Stack

- **Frontend** — React 19, Vite, React Router, SCSS
- **Backend** — Node.js, Express 5
- **Database** — MongoDB Atlas (official Node driver)
- **Authentication** — JWT in an HttpOnly cookie, bcrypt password hashing
- **External APIs** — CoinGecko, NewsData.io, OpenRouter, meme-api.com
- **Deployment** — Railway (single service serving both the API and the built frontend)

All external API calls are made by the backend, so API keys never reach the browser.

## APIs and Fallbacks

| Section | Source | Fallback |
|---|---|---|
| Coin Prices | CoinGecko | None — the section reports that data is unavailable rather than showing invented prices |
| Market News | NewsData.io | Predefined local fallback content |
| AI Insight | OpenRouter | A factual summary generated from the current market data |
| Crypto Meme | meme-api.com | One of four memes included with the project |

## Setup Instructions

**Prerequisites:** Node.js 20+ and a MongoDB connection string.

```bash
# clone
git clone https://github.com/OriChaiMatan/moveo-crypto-advisor.git
cd moveo-crypto-advisor

# install dependencies
npm install
npm install --prefix backend

# configure the backend
cp backend/.env.example backend/.env
```

Required variables in `backend/.env`:

| Variable | Description |
|---|---|
| `DB_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens |

Optional API keys — without them the matching section falls back to local content:

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | AI Insight |
| `NEWSDATA_API_KEY` | Market News |
| `COINGECKO_API_KEY` | Optional demo key, raises the CoinGecko rate limit |

Then start both parts in separate terminals:

```bash
# backend, port 5001
cd backend && npm run dev

# frontend, port 5173
npm run dev
```

Open http://localhost:5173. The frontend needs no configuration for local development.

## AI Tools Used

ChatGPT and Claude Code were used as engineering assistants during development. They supported architecture discussions, debugging external API behaviour, code review and refactoring, and verification of the deployed application. I used these tools to explore alternatives and review implementation decisions, while keeping responsibility for the final design and code.

## Future Feedback Improvements

*A proposal for the assignment bonus — not implemented.*

The application already stores useful feedback data for future personalization. Each vote is saved together with the user's preferences, the section being rated, and the specific content that was shown at that moment. This creates historical examples of which content different users reacted positively or negatively to.

A future recommendation process could use this data in stages:

1. **Content ranking** — aggregate feedback by assets, investor type and content preferences to learn which types of content perform better for different user groups, then use those scores to influence the order and selection of dashboard content.

2. **Personalized recommendations** — as more feedback is collected for an individual user, their own history could receive more weight than general group behavior. For example, two Day Traders following Bitcoin could gradually receive different recommendations based on what each of them consistently likes or dislikes.

3. **AI Insight personalization** — feedback on daily insights could be used to adjust what the AI focuses on and how the insight is written for each user, such as favoring short-term movements, comparisons or broader market context.

I would start with ranking and recommendation logic before considering model fine-tuning. It is simpler, explainable, and can already make use of the feedback data the application collects today. Model training would only become relevant after enough high-quality feedback has been accumulated.
