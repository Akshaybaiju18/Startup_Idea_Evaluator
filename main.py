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

score={}
for i in ideas:
    print("Enter the scores for the idea - ",i,"\n")
    score[i]={}

    for j in criteria:
        s= int(input(f"Enter the score for the {j ["name"]} (1 - 10) : "))
        score[i] [j["name"]] = s



    print("\n=== Input Summary ===")
    print("\nIdeas:", ideas)
    print("\nCriteria:")
    for c in criteria:
        print(c)

    print("\nScores:")
    for idea, sc in score.items():
        print(idea, sc)

