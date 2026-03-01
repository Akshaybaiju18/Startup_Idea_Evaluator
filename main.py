def normalize_weights(criteria):
    total_weight = sum(c["weight"] for c in criteria)
    if total_weight == 0:
        return criteria
    for c in criteria:
        c["normalized_weight"] = c["weight"] / total_weight
    return criteria


def calculate_weighted_score(scores, criteria):
    total_score = 0
    for c in criteria:
        raw_score = scores[c["name"]]
        if c["type"] == "min":
            adjusted_score = 10 - raw_score
        else:
            adjusted_score = raw_score
        total_score += adjusted_score * c["normalized_weight"]
    return total_score


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

    print("\n" + "="*50)
    print("Why '" + idea + "' is ranked first")
    print("="*50)

    print("'" + idea + "' achieved the highest score of", round(final_scores[idea], 3), ".")
    print("\nHere is how it compared to all other ideas:")

    # Compare with each other idea
    for idx in range(1, len(ranked)):
        other_idea = ranked[idx][0]
        other_score = final_scores[other_idea]
        margin = final_scores[idea] - other_score

        print("\nvs '" + other_idea + "' (scored", round(other_score, 3), ", margin:", round(margin, 3), "points):")

        # Find advantages
        advantages = []
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
                advantages.append({"name": c["name"], "weight": c["weight"], "this_score": adj_this, "other_score": adj_other, "weighted_diff": weighted_diff})

        # Sort by weighted difference
        for i in range(len(advantages)):
            for j in range(i + 1, len(advantages)):
                if advantages[j]["weighted_diff"] > advantages[i]["weighted_diff"]:
                    temp = advantages[i]
                    advantages[i] = advantages[j]
                    advantages[j] = temp

        if len(advantages) > 0:
            print(" Outperformed in", len(advantages), "criteria.")
            for i in range(min(2, len(advantages))):
                adv = advantages[i]
                print("  - '" + adv["name"] + "' (importance:", adv["weight"], "): scored", round(adv["this_score"], 1), "vs", round(adv["other_score"], 1), "(+", round(adv["weighted_diff"], 3), "weighted points)")


no_idea= int(input("Enter the number of ideas: "))
ideas=[]
for i in range(no_idea):
    idea= input("\nEnter the idea: ")
    ideas.append(idea)

no_criteria= int(input("\nEnter the number of criteria: "))
criteria=[]
for i in range(no_criteria):
    c_name= input(f"\nEnter the name of criterion {i+1}: ")
    c_weight= int(input("Enter the importance of the criteria (1 - 10) : "))
    c_type = input("Enter the criteria type (max/min) : ")
    print("\n")
    criteria.append({"name":c_name,"weight":c_weight,"type":c_type})

criteria = normalize_weights(criteria)

score={}
for i in ideas:
    print("Enter the scores for the idea - ",i,"\n")
    score[i]={}

    for j in criteria:
        s= int(input(f"Enter the score for the {j ["name"]} (1 - 10) : "))
        score[i] [j["name"]] = s



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
