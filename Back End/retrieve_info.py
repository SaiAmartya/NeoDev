import requests 

# Define constants for the Open Food Facts API
API_BASE_URL = "https://world.openfoodfacts.org/api/v0/product/"

# Function to fetch product data by barcode
def fetch_product_data(barcode): 
    """Fetch product data from Open Food Facts API using a product barcode."""
    url = f"{API_BASE_URL}{barcode}.json"
    response = requests.get(url)
    
    # ChatGPT
    if response.status_code == 200: 
        product_data = response.json()
        if product_data.get('status') == 1:  # Status 1 means the product was found
            return product_data['product']
        else:
            print("Product not found.")
            return None
    else:
        print("Failed to fetch data from Open Food Facts.")
        return None

# Function to map and display key nutritional facts
def map_nutrition_facts(product):
    """Extract and display main nutritional information of the product."""
    if product == None:
        return None
    try:
        product_name = product.get("product_name", "Unknown Product")
        ingredients = product.get("ingredients_text", "No ingredient information available")
        nutrition_data = product.get("nutriments", {})
        
        # Extract key nutritional values
        energy_kcal = nutrition_data.get("energy-kcal_100g", "N/A")
        sugars_100g = nutrition_data.get("sugars_100g", "N/A")
        salt_100g = nutrition_data.get("salt_100g", "N/A")
        fat_100g = nutrition_data.get("fat_100g", "N/A")
        fiber_100g = nutrition_data.get("fiber_100g", "N/A")
        protein_100g = nutrition_data.get("proteins_100g", "N/A")

        return nutrition_data

        # Display product information and nutrition facts
        print(f"Product Name: {product_name}")
        print(f"Ingredients: {ingredients}")
        print("\nNutritional Information per 100g:")
        print(f"  - Energy (kcal): {energy_kcal}")
        print(f"  - Sugars: {sugars_100g}g")
        print(f"  - Salt: {salt_100g}g")
        print(f"  - Fat: {fat_100g}g")
        print(f"  - Fiber: {fiber_100g}g")
        print(f"  - Protein: {protein_100g}g")

    except KeyError as e:
        print(f"Error in retrieving nutritional facts: {e}")

def calculate_nutritional_content_score(data):
    if data == None:
        return None
    # Initialize content score factors
    nutritional_score = 0

    # Fiber
    fiber = data.get("fiber_100g", 0)
    if fiber >= 5:
        nutritional_score += 10
    elif 3 <= fiber < 5:
        nutritional_score += 5

    # Protein
    protein=data.get("proteins_100g",0)
    if protein >= 10:
        nutritional_score += 10
    elif 5<= protein<10:
        nutritional_score += 5

    # Unsaturated Fat (Healthy Fat)
    total_fat = data.get("fat_100g", 0)
    saturated_fat = data.get("saturated-fat_100g", 0)
    unsaturated_fat = max(total_fat - saturated_fat, 0)
    if unsaturated_fat >= 5:
        nutritional_score += 5
        
    # Vitamins and Minerals
    vitamin_points = 0
    if data.get("calcium_100g", 0) >= 0.2:
        vitamin_points += 1
    if data.get("iron_100g", 0) >= 0.2:
        vitamin_points += 1
    if data.get("vitamin-a_100g", 0) >= 0.2:
        vitamin_points += 1
    if data.get("vitamin-c_100g", 0) >= 0.2:
        vitamin_points += 1
    nutritional_score += min(vitamin_points, 10)

    # Negative points

    # Saturated Fats
    saturatedFats= data.get("saturated-fat_100g", 0)
    if saturatedFats >= 5:
        nutritional_score -= 8
    elif 2<= saturatedFats <5:
        nutritional_score-=8
    
    # Trans fat 
    trans_fat= data.get("trans-fat_100g", 0)
    if trans_fat >0 :
        nutritional_score-=10

    # Sodium
    sodium = data.get("sodium_100g", 0) * 1000  # Converting to mg for consistency
    if sodium >= 500:
        nutritional_score -= 5
    elif 250 <= sodium < 500:
        nutritional_score -= 2

    # Calories
    calories = data.get("energy-kcal_100g", 0)
    if calories >= 400:
        nutritional_score -= 2

   
    # Normalize to a score between 0 and 70 
    nutritional_content_score = max(min(nutritional_score, 70), 0) #ChatGPT
    return nutritional_content_score

    
def calculate_ingredient_quality_score(data): #Chat GPT
    if data is None:
        return None
    # Ingredient Quality Score factors
    ingredient_score = 0
    
    # Positive Factors
    # Whole Foods as Primary Ingredients
    whole_food = data.get("fruits-vegetables-nuts-estimate-from-ingredients_100g", 0)
    if whole_food >= 50:  # Arbitrary threshold for primary whole food content
        ingredient_score += 5

    # No Artificial Additives (Assuming we know no artificial additives are included)
    # Check for some additives keywords (for demonstration purposes, assume no keywords for clean)
    additives = ["artificial", "preservative", "color", "flavor"]
    ingredient_text = str(data)  # assuming ingredient info is in text; use actual ingredient list in production
    if not any(additive in ingredient_text.lower() for additive in additives):
        ingredient_score += 5

    # Organic Ingredients (if possible; assume 70% threshold if "organic" appears in data)
    # Note: Here, an actual label would be used if available.
    if "organic" in ingredient_text.lower():
        ingredient_score += 5

    # Negative Factors
    # High-Fructose Corn Syrup (if appears in ingredient text)
    if "high-fructose corn syrup" in ingredient_text.lower():
        ingredient_score -= 5

    # Hydrogenated Oils
    if "hydrogenated" in ingredient_text.lower():
        ingredient_score -= 5

    # Normalize to a score between 0 and 30
    ingredient_quality_score = max(min(ingredient_score, 30), 0)
    return ingredient_quality_score


def calculate_total_product_score(data):
    if data is None:
        return None
    # Calculate both scores
    nutritional_content_score = calculate_nutritional_content_score(data)
    ingredient_quality_score = calculate_ingredient_quality_score(data)
    
    # Total score as per defined weightage
    total_score = nutritional_content_score + ingredient_quality_score
    return total_score

# Categorize Score
def categorize_score(final_score):
    # Categorize the final score
    if final_score >= 90:
        return "Excellent"
    elif final_score >= 50:
        return "Average"
    else:
        return "Poor"

nutrition_info = map_nutrition_facts(fetch_product_data("060410050910"))
product_score = calculate_total_product_score(nutrition_info)