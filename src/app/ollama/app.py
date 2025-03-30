import pandas as pd
from langchain.llms import Ollama
from fuzzywuzzy import fuzz
import json

file = pd.read_csv('data/cleaned_recipes.csv')

fridge_file = []
ingredients_file = pd.read_csv('data/ingredients.csv')
fridge = list(fridge_file['fridge'])
ingredients = list(ingredients_file['ingredients'])
tags_file = pd.read_csv('data/tags.csv')
tags = list(tags_file['tags'])

ingredients_list = []
for i in fridge:
    for j in ingredients:
        if fuzz.ratio(i, j) >= 70:
            ingredients_list.append(j)

user_prompt = ''
ollama_model = Ollama(model="gemma3:1b")
prompt = f"""
    Please simplify this user prompt to identify key words:
    {user_prompt}

    Output the selected key words in a comma-separated format. Do not provide any additional text or explanation.
"""
response = ollama_model(prompt)

low = response.split(',')
low_new = []
for i in low:
    i = i.strip()
    i = i.lower()
    low_new.append(i)
tags_list = []
for i in low_new:
    for j in tags:
        if fuzz.ratio(i, j) >= 70:
            tags_list.append(j)


list_of_recipe_ingredients = []
for i in range(len(file)):
    for j in ingredients_list:
        if j in file['ingredients'][i]:
            list_of_recipe_ingredients.append(tuple([file['name'][i], 
                                                     file['ingredients'][i], 
                                                     file['steps'][i], 
                                                     str(file['minutes'][i]), 
                                                     str(file['calories'][i]), 
                                                     str(file['fat'][i]), 
                                                     str(file['sugar'][i]), 
                                                     str(file['sodium'][i]), 
                                                     str(file['saturated_fat'][i])]))

list_of_recipe_tags = []
for i in range(len(file)):
    for j in tags_list:
        if j in file['tags'][i]:
            list_of_recipe_tags.append(tuple([file['name'][i], 
                                              file['ingredients'][i], 
                                              file['steps'][i], 
                                              str(file['minutes'][i]), 
                                              str(file['calories'][i]), 
                                              str(file['fat'][i]), 
                                              str(file['sugar'][i]), 
                                              str(file['sodium'][i]), 
                                              str(file['saturated_fat'][i])]))


list_of_recipes = list(set(list_of_recipe_ingredients) & set(list_of_recipe_tags))
list_of_recipes_only_ingredients = list(set(list_of_recipe_ingredients) - set(list_of_recipe_tags))


titles = ['title', 'ingredients', 'steps', 'time_to_make', 'nutrition']
nutrition_titles = ['calories', 'fat', 'sugar', 'sodium', 'protein', 'saturated_fat']

list_of_recipe_dict = []
for recipe in list_of_recipes:
    nutrition_dict = dict(zip(nutrition_titles, recipe[4:10]))
    recipe_dict = {
        "name": recipe[0],
        "ingredients": recipe[1],
        "steps": recipe[2],
        "minutes": recipe[3],
        "nutrition": nutrition_dict
    }
    list_of_recipe_dict.append(recipe_dict)

with open('recipes.json', 'w') as json_file:
    json.dump(list_of_recipe_dict, json_file, indent=4)
print("Data has been exported to 'recipes.json'")