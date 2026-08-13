# Crypto Advisor

A personalized crypto investor dashboard: a short onboarding quiz shapes a daily dashboard of coin prices, market news, an AI insight and a crypto meme, and every section can be rated to improve future recommendations.

## Live Demo

- **Production:** https://ori-crypto-advisor.up.railway.app
- **Repository:** https://github.com/OriChaiMatan/crypto-advisor

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

- **Frontend** — React, Vite, React Router, SCSS
- **Backend** — Node.js, Express 
- **Database** — MongoDB Atlas
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

The assignment suggested CryptoPanic for market news. During development, its API was not available for the required integration, so NewsData.io was used as a free alternative.

## Setup Instructions

**Prerequisites:** Node.js 20+ and a MongoDB connection string.

```bash
# clone
git clone https://github.com/OriChaiMatan/crypto-advisor.git
cd crypto-advisor

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

API keys:

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | AI Insight |
| `NEWSDATA_API_KEY` | Market News |
| `COINGECKO_API_KEY` | Optional demo key, raises the CoinGecko rate limit |

Then start both parts in separate terminals:

```bash
# backend, port 5001
cd backend && npm start

# frontend, port 5173
npm run dev
```

Open http://localhost:5173. The frontend needs no configuration for local development.

## AI Tools Used

I used ChatGPT and Claude Code throughout the project as part of my development workflow.

I defined the application architecture, technology stack, data flow, feature requirements and implementation direction. I then used the AI tools within those decisions rather than asking them to independently design or build the application.

ChatGPT was mainly used to discuss architecture and implementation approaches, think through technical decisions, investigate problems and review solutions.

Claude Code was used directly within the repository to write and modify code according to my specifications. I provided the required behavior, technologies, constraints and implementation direction, then reviewed the generated changes, tested the result and requested corrections or improvements when needed.

I also used Claude Code for debugging, refactoring, running tests and builds, reviewing frontend and backend code, and checking the deployed application.

The process was iterative: define the problem and approach, implement with AI assistance, review the code, test the behavior, identify issues and refine the solution. I remained responsible for the technical decisions, understanding the implementation and validating the final application.

## Future Feedback Improvements - Bonus

The current feedback system was designed not only to store whether a user liked or disliked something, but also to preserve the context behind that decision.

Each vote is stored together with the user's preferences and the content that was shown at that moment. This creates historical labeled data that can later be used to improve personalization and recommendations.

### 1. Collect Feedback Data

Each thumbs-up or thumbs-down can be treated as a positive or negative example.

A future recommendation dataset could include:

- User and investor type
- Selected crypto assets
- Content preferences
- Dashboard section
- Content shown to the user
- Content source
- Relevant market context
- Positive or negative vote
- Timestamp

Keeping the historical context is important because a vote only has meaning when we know what the user was reacting to.

### 2. Build a Recommendation Dataset

As more feedback is collected, the historical records can be transformed into a dataset describing which types of users responded positively or negatively to different types of content.

For example, the system may learn that Day Traders following BTC tend to prefer short-term market comparisons, while HODLers may respond better to longer-term market context.

Before using this data, duplicate or invalid records should be removed and highly active users should be prevented from having disproportionate influence on the results.

### 3. Start With Content Ranking

I would not start by training or fine-tuning an LLM.

The first improvement would be an explainable ranking layer that aggregates feedback by factors such as investor type, selected assets and content preferences.

These scores could influence:

- Which news articles are prioritized
- Which dashboard sections appear first
- Which type of AI insight is generated
- Which content categories receive more exposure

New users could initially receive recommendations based on their onboarding preferences and feedback from similar users.

### 4. Add Individual Personalization

As an individual user generates more feedback, their own history can gradually receive more weight than general group behavior.

This allows two users with the same onboarding choices to develop different experiences over time.

A recommendation score could conceptually combine:

`segment preferences + individual history + current content relevance`

This creates a gradual transition from onboarding-based personalization to behavior-based personalization.

### 5. Personalize AI Insights

Feedback on AI Insights can first be used to improve the context and instructions sent to the LLM without training a new model.

For example, if a user consistently likes short asset comparisons and 24-hour market movements, future prompts can prioritize that style. Another user may prefer broader market explanations or longer-term context.

This provides personalized AI output while continuing to use the same underlying model.

### 6. Prepare Feedback for Future Model Training

Once enough high-quality feedback has been collected, the historical records could be converted into a training dataset.

For AI Insights, each training example could contain:

`user preferences + market context + generated insight + user feedback`

Thumbs-up examples would represent responses that worked well for a given context, while thumbs-down examples would represent responses that should be avoided or improved.

The preparation process would include cleaning invalid or duplicate records, balancing the dataset so that highly active users do not dominate it, and splitting the data into training, validation and test sets.

For preference-based training, positive and negative examples from similar contexts could also be paired:

`user context + market context + preferred insight + non-preferred insight`

This dataset could later be used to train a recommendation model that predicts which content a user is likely to prefer, or, with enough AI Insight feedback, to fine-tune or preference-optimize an LLM toward the types of insights users respond to positively.

I would not start with LLM fine-tuning. Ranking and prompt personalization can use the collected feedback much earlier, while model training should only begin once the dataset is large, diverse and reliable enough.

### 7. Measure the Improvement

Any recommendation change should be evaluated against the current system.

Useful metrics could include:

- Positive feedback rate
- Negative feedback rate
- Feedback participation
- Section engagement
- Repeat usage

A larger version of the product could also use A/B testing to compare the existing dashboard with the feedback-based recommendation system.

### Future Feedback Loop

The long-term process would be:

`Show content → Collect contextual feedback → Store user, content and context → Build and clean the dataset → Improve ranking and AI prompts → Train when enough data exists → Evaluate results → Repeat`

This creates a continuous personalization loop where recommendations improve as more meaningful feedback is collected.

The current implementation already provides the foundation for this process by preserving historical feedback together with the context that gives each vote meaning. The next step would therefore be ranking and personalization, followed by model training only when the collected dataset is large, diverse and reliable enough.

## Database Access

Read-only access to the MongoDB Atlas database is available for review. The connection details and reviewer credentials are provided separately with the submission and are not stored in this repository.
