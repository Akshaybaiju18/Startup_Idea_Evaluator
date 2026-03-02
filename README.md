# Startup Idea Evaluator

A command-line tool that helps you compare and rank startup ideas based on criteria you define — things like market size, technical feasibility, competition, and capital requirements. It scores each idea using a weighted model and explains why the top idea came out ahead.

---

## Understanding the Problem

Choosing between startup ideas is rarely straightforward. Every idea has trade-offs, and different people prioritize different things. The goal here was to build something that brings some structure to this decision — not to replace human judgment, but to support it.

The tool lets you define what matters to you (the criteria), how much each criterion matters (the weight), and whether a higher or lower score is better for that criterion. It then crunches the numbers, ranks your ideas, and explains the result in plain language.

---

## Assumptions Made

- The user knows their ideas well enough to score them on a scale of 1–10 for each criterion.
- All criteria are roughly comparable — this isn't a tool for comparing wildly incompatible inputs.
- Scores are integers between 1 and 10. No decimals, no negative values.
- Criteria weights are integers from 1–10 representing relative importance (not percentages).
- A "min" type criterion means lower is better (e.g., competition level, required investment). A "max" type means higher is better (e.g., market size, scalability).
- If the Groq API key is missing or the call fails, the tool still works — it just falls back to a structured text explanation instead of an AI-generated one.

---

## Why I Structured It This Way

I went with a Weighted Sum Model for the decision-making core. It's transparent, easy to reason about, and fits the problem well — you can see exactly why one idea ranked above another.

The structure is split into clear responsibilities:

- **Input collection** — gather ideas, criteria, weights, and scores interactively from the user
- **Normalization** — convert raw weights into proportions that sum to 1, so the math works regardless of what numbers the user entered
- **Scoring** — calculate each idea's weighted score, accounting for min vs. max criteria
- **Ranking** — sort ideas by their final score
- **Explanation** — compare the winner against all other ideas on the most impactful criteria, then pass that data to the AI for a natural language summary

I kept everything in a single `main.py` file intentionally. This is a small CLI tool, and splitting it into multiple modules would add complexity without much benefit at this scale.

---

## Design Decisions and Trade-offs

**Min criteria inversion**
For "min" criteria (like competition), I invert the score by doing `10 - raw_score`. This keeps the weighted sum model consistent — higher adjusted scores always mean better performance — without needing a separate scoring formula.

**AI as a presenter, not a decision maker**
The ranking is done entirely by the algorithm. The AI (Groq's LLaMA model) only receives the pre-computed comparison data and is asked to explain it in natural language. It cannot change the ranking or introduce its own judgment.

**Graceful fallback**
If the API key isn't set or the call fails, the tool prints a structured text explanation instead. This means the tool is fully usable without any API key.

**Trade-off: No input validation**
Currently, if a user enters a string where a number is expected, the program crashes. Adding validation would make it more robust, but I kept it simple for now to stay focused on the core logic.

---

## Edge Cases Considered

- **Zero total weight** — if all criteria have weight 0, normalization is skipped to avoid a divide-by-zero error.
- **Single idea** — the tool works with just one idea; it will rank it first with no comparisons.
- **All ideas tied** — if two ideas have the same final score, they're ranked in the order they were entered. The explanation still works correctly.
- **API failure** — handled with a try/except block; the fallback explanation kicks in automatically.

---

## How to Run the project

**1. Clone the repo**

```bash
git clone https://github.com/Akshaybaiju18/Startup_Idea_Evaluator.git
cd Startup_Idea_Evaluator
```

**2. Install the Groq library** *(optional — only needed for AI explanations)*

```bash
pip install groq
```

**3. Add your Groq API key** *(optional)*

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_key_here
```

**4. Run the tool**

```bash
python main.py
```

Follow the prompts — enter your ideas, define your criteria, set weights and types, then score each idea. The tool will handle the rest.

---

## What I'd Improve with More Time

- **Input validation** — right now, entering a non-number where a number is expected will crash the program. Proper validation with helpful error messages would make it much more user-friendly.
- **Save and load sessions** — let users save their evaluation to a JSON file and come back to it later, or share it with someone else.
- **Better UI** — the CLI works, but a small web interface would make it accessible to non-technical users and allow for a better visual comparison of ideas.
- **Batch input via file** — instead of answering every prompt manually, let users provide their data via a structured CSV or JSON file.
- **Better AI prompts** — the current prompt is functional but could be improved to produce richer, more actionable explanations.


