import os


def load_env_file():
    # Load environment variables from .env file
    try:
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key] = value
    except FileNotFoundError:
        pass


def get_ai_explanation(prompt_data):
    # Call Groq API to get natural language explanation, returns None if API fails
    try:
        from groq import Groq

        load_env_file()
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return None

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {"role": "system", "content": "You are a startup idea evaluator. Write one clear paragraph explaining why the winning idea ranked first. Be concise and specific."},
                {"role": "user", "content": prompt_data}
            ]
        )
        return response.choices[0].message.content
    except Exception:
        return None


def normalize_weights(criteria):
    # Convert criteria weights to normalized values that sum to 1
    total_weight = sum(c["weight"] for c in criteria)
    if total_weight == 0:
        return criteria
    for c in criteria:
        c["normalized_weight"] = c["weight"] / total_weight
    return criteria


def calculate_weighted_score(scores, criteria):
    # Calculate weighted sum score for an idea, handling max and min criteria types
    total_score = 0
    for c in criteria:
        raw_score = scores[c["name"]]
        if c["type"] == "min":
            adjusted_score = 10 - raw_score
        else:
            adjusted_score = raw_score
        total_score += adjusted_score * c["normalized_weight"]
    return total_score


def build_explanation_data(idea, scores, criteria, final_scores, ranked):
    # Build structured comparison data for the winning idea against all others
    data = {
        "winner": idea,
        "winner_score": round(final_scores[idea], 3),
        "comparisons": []
    }

    for idx in range(1, len(ranked)):
        other_idea = ranked[idx][0]
        other_score = final_scores[other_idea]
        margin = final_scores[idea] - other_score

        comparison = {
            "other_idea": other_idea,
            "other_score": round(other_score, 3),
            "margin": round(margin, 3),
            "advantages": []
        }

        for c in criteria:
            raw_this = scores[idea][c["name"]]
            raw_other = scores[other_idea][c["name"]]
            if c["type"] == "min":
                adj_this = 10 - raw_this
                adj_other = 10 - raw_other
            else:
                adj_this = raw_this
                adj_other = raw_other
            if adj_this > adj_other:
                score_diff = adj_this - adj_other
                weighted_diff = score_diff * c["normalized_weight"]
                comparison["advantages"].append({
                    "criterion": c["name"],
                    "weight": c["weight"],
                    "winner_score": round(adj_this, 1),
                    "other_score": round(adj_other, 1),
                    "weighted_advantage": round(weighted_diff, 3)
                })

        # Sort advantages by weighted advantage
        for i in range(len(comparison["advantages"])):
            for j in range(i + 1, len(comparison["advantages"])):
                if comparison["advantages"][j]["weighted_advantage"] > comparison["advantages"][i]["weighted_advantage"]:
                    temp = comparison["advantages"][i]
                    comparison["advantages"][i] = comparison["advantages"][j]
                    comparison["advantages"][j] = temp

        data["comparisons"].append(comparison)

    return data


def explain_ranking(idea, scores, criteria, final_scores, ranked):
    # Find rank
    rank = 1
    for name, _ in ranked:
        if name == idea:
            break
        rank = rank + 1

    # Only explain for rank 1
    if rank != 1:
        return

    # Build structured data
    data = build_explanation_data(idea, scores, criteria, final_scores, ranked)

    # Build prompt for AI explanation
    prompt = "Winning Idea: " + data["winner"] + " (Score: " + str(data["winner_score"]) + ")\n\n"

    for comp in data["comparisons"]:
        prompt = prompt + "vs " + comp["other_idea"] + " (Score: " + str(comp["other_score"]) + ", Margin: " + str(comp["margin"]) + "):\n"
        if len(comp["advantages"]) > 0:
            for adv in comp["advantages"][:2]:
                prompt = prompt + "- " + adv["criterion"] + " (weight " + str(adv["weight"]) + "): " + str(adv["winner_score"]) + " vs " + str(adv["other_score"]) + "\n"
        prompt = prompt + "\n"

    prompt = prompt + "Explain why the winning idea ranked first based on these comparisons."

    ai_output = get_ai_explanation(prompt)

    print("\n" + "="*50)
    print("Why '" + idea + "' is ranked first")
    print("="*50)

    if ai_output:
        print("[AI-enhanced explanation]")
        print("\n" + ai_output)
    else:
        print("[Fallback mode - API not available]")
        # Fallback to structured output
        print("\n'" + idea + "' achieved the highest score of", data["winner_score"], ".")
        print("\nHere is how it compared to all other ideas:")

        for comp in data["comparisons"]:
            print("\nvs '" + comp["other_idea"] + "' (scored", comp["other_score"], ", margin:", comp["margin"], "points):")
            if len(comp["advantages"]) > 0:
                print(" Outperformed in", len(comp["advantages"]), "criteria.")
                for adv in comp["advantages"][:2]:
                    print("  - '" + adv["criterion"] + "' (importance:", adv["weight"], "): scored", adv["winner_score"], "vs", adv["other_score"], "(+", adv["weighted_advantage"], "weighted points)")


# Get number of ideas and their names
no_idea = int(input("Enter the number of ideas: "))
ideas = []
for i in range(no_idea):
    idea = input("Enter the idea: ")
    ideas.append(idea)

# Get number of criteria and their properties
no_criteria = int(input("\nEnter the number of criteria: "))
criteria = []
for i in range(no_criteria):
    c_name = input("Enter the name of criterion " + str(i+1) + ": ")
    c_weight = int(input("Enter the importance (1-10): "))
    c_type = input("Enter type (max/min): ")
    criteria.append({"name": c_name, "weight": c_weight, "type": c_type})

criteria = normalize_weights(criteria)

# Get scores for each idea against each criterion
score = {}
for idea in ideas:
    print("\nEnter scores for '" + idea + "':")
    score[idea] = {}
    for c in criteria:
        s = int(input("  " + c["name"] + " (1-10): "))
        score[idea][c["name"]] = s



print("\n=== Final Results ===")
print("\nCriteria:")
for c in criteria:
    print(f"  {c['name']}: weight={c['weight']}, normalized={c['normalized_weight']:.3f}, type={c['type']}")

print("\nScores and Final Weighted Scores:")
final_scores = {}
for idea in ideas:
    weighted_score = calculate_weighted_score(score[idea], criteria)
    final_scores[idea] = weighted_score
    print(f"\n  {idea}:")
    for c in criteria:
        raw = score[idea][c["name"]]
        adj = 10 - raw if c["type"] == "min" else raw
        print(f"    {c['name']}: raw={raw}, adjusted={adj}, weighted={adj * c['normalized_weight']:.3f}")
    print(f"    FINAL SCORE: {weighted_score:.3f}")

print("\n=== Ranking ===")
ranked = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
for rank, (idea, score_val) in enumerate(ranked, 1):
    print(f"  {rank}. {idea}: {score_val:.3f}")

print("\n" + "="*50)
print("DETAILED EXPLANATIONS")
print("="*50)
for idea, _ in ranked:
    explain_ranking(idea, score, criteria, final_scores, ranked)
