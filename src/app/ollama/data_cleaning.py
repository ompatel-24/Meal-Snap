import pandas as pd
import re

file = pd.read_csv('data/RAW_recipes.csv')

'''
(['name', 'id', 'minutes', 'contributor_id', 'submitted', 'tags',
       'nutrition', 'n_steps', 'steps', 'description', 'ingredients',
       'n_ingredients'],
      dtype='object')
'''

# Cleansing Data Language for Names
names_copy = file['name'].copy()
for i in range(len(names_copy)):
    if pd.isna(names_copy[i]):
        continue
    names_copy[i] = names_copy[i].lstrip().capitalize()
    names_copy[i] = re.sub(r'\s+', ' ', names_copy[i].strip())

# Convert Minutes to Str
minutes_copy = file['minutes'].copy()
for i in range(len(minutes_copy)):
    minutes_copy[i] = str(minutes_copy[i])

# Cleansing Data Language for List of Tags
tags_copy = file['tags'].copy()
for i in range(len(tags_copy)):
    tags_copy[i] = tags_copy[i][1:-1].replace("'",'').split(',')
    for j in range(len(tags_copy[i])):
        tags_copy[i][j] = tags_copy[i][j].lstrip().capitalize()

# Cleansing Data Language for Calorie Values
calories_copy = file['nutrition'].copy()
for i in range(len(calories_copy)):
    calories_copy[i] = calories_copy[i][1:-1].replace("'",'').split(',')
    calories_copy[i] = calories_copy[i][0].lstrip()

# Cleansing Data Language for Fat Values
fat_copy = file['nutrition'].copy()
for i in range(len(fat_copy)):
    fat_copy[i] = fat_copy[i][1:-1].replace("'",'').split(',')
    fat_copy[i] = fat_copy[i][1].lstrip()

# Cleansing Data Language for Sugar Values
sugar_copy = file['nutrition'].copy()
for i in range(len(sugar_copy)):
    sugar_copy[i] = sugar_copy[i][1:-1].replace("'",'').split(',')
    sugar_copy[i] = sugar_copy[i][2].lstrip()

# Cleansing Data Language for Sodium Values
sodium_copy = file['nutrition'].copy()
for i in range(len(sodium_copy)):
    sodium_copy[i] = sodium_copy[i][1:-1].replace("'",'').split(',')
    sodium_copy[i] = sodium_copy[i][3].lstrip()

# Cleansing Data Language for Protein Values
protein_copy = file['nutrition'].copy()
for i in range(len(protein_copy)):
    protein_copy[i] = protein_copy[i][1:-1].replace("'",'').split(',')
    protein_copy[i] = protein_copy[i][4].lstrip()

# Cleansing Data Language for Saturated Fat Values
saturated_fat_copy = file['nutrition'].copy()
for i in range(len(saturated_fat_copy)):
    saturated_fat_copy[i] = saturated_fat_copy[i][1:-1].replace("'",'').split(',')
    saturated_fat_copy[i] = saturated_fat_copy[i][4].lstrip()

# Cleansing Data Language for List of Steps
steps_copy = file['steps'].copy()
for i in range(len(steps_copy)):
    steps_copy[i] = re.findall(r"'([^']*)'", steps_copy[i][1:-1])
    for j in range(len(steps_copy[i])):
        steps_copy[i][j] = steps_copy[i][j].lstrip().capitalize().replace(' ,', ',')

# Cleansing Data Language for List of Ingredients
ingredients_copy = file['ingredients'].copy()
for i in range(len(ingredients_copy)):
    ingredients_copy[i] = ingredients_copy[i][1:-1].replace("'",'').split(',')
    for j in range(len(ingredients_copy[i])):
        ingredients_copy[i][j] = ingredients_copy[i][j].lstrip().capitalize()


# Drop columns
file = file.drop(['id', 'contributor_id', 'submitted', 'n_steps', 'description', 'n_ingredients', 'nutrition'], axis=1)

# Assigning the cleaned data back to the original DataFrame
file['name'] = names_copy
file['minutes'] = minutes_copy
file['tags'] = tags_copy
file['calories'] = calories_copy
file['fat'] = fat_copy
file['sugar'] = sugar_copy
file['sodium'] = sodium_copy
file['protein'] = protein_copy
file['saturated_fat'] = saturated_fat_copy
file['steps'] = steps_copy
file['ingredients'] = ingredients_copy

# Exporting the cleaned DataFrame to a new CSV file
file.to_csv('data/cleaned_recipes.csv', index=False)
print('Data cleaning completed and saved to cleaned_recipes.csv')