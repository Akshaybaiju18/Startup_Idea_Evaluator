Selecting Topic:
    The first thing to do about the assignment was finding suitable topic. I brainstormed for ideas and finally selected the topic - Startup idea evaluator. It takes various input from the user such as the startup idea , factors like Market size, technical feasibilty,competition, capital investment etc. The user also inputs the weights of each factor and rates each factor based on the idea.

Selecting Implementation and Tech stack:
    I decided to build a CLI using the language Python. The reason for choosing CLI was that it is easy to implement and the assigment was more about evaluating the thinking process than the beautified UI.

Pre Implementation:
    As a part before implementation I created an architecture diagram depicting the basic working of the system.

Implementation phase:
    Created a python main file first. Thought about all inputs needed from the user. Inputs to be read from the user - number of ideas (n), n ideas, number of criteria (m), the m criterias , weights of criterias with their type (whether maximizing or minimizing), score of each criterias for the each idea.

    Next part to design was the decision making logic. So I thought and researched about how to rank the ideas based on the input. I already had some idea about using mathematical normalization though were not sure about it . So I used chatgpt to know about some methods. After analyzing that and my own thinking I planned to build a weighted sum model as I already had implemented the code for taking necessary inputs.

    In the weighted sum model each startup idea’s final score is calculated by multiplying its performance on each criterion by the criterion’s importance weight and the sum of the results is taken to rank the idea.

    Initially my idea was to build a system for evaluating the success of an idea but later I realized that the system can predict what idea is best based on the user's priority rather than predicting the success of an idea.

    The next part was to build the function to calculate the weighted scores. The weights were already normalized for mathematical compatability. As I was using the weighted sum model all I had to do was to calculate each idea's final score by multiplying its performance(score) on each criterion by the criterion’s importance weight and sum the results. Also the differnt criteria were of two effects - maximizing and minimizing (For example Fund is maximizing factor as more fund means more chance of success while competition is minimizing factor). So I thought of how to make use of these in calculating the final score. If we just multiply blindily without properly using max and min the scores may produce error (For example if in idea A Fund score = 5, in idea B Competition score = 9 when we calculate score idea B will get higher score but in reality idea B has a high competition therefore has high chance of not being the right choice for the user). After thinking I came to a solution. For the max criteria there need to be no change but for min criteria we will subtract it from 10. Thus the min criteria will be evaluated correctly.
