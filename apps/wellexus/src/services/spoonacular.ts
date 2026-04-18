import type { SpoonacularRecipe } from '../types';

const BASE = 'https://api.spoonacular.com';

interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  nutrition?: { nutrients: Array<{ name: string; amount: number }> };
}

interface SpoonacularResponse {
  results: SpoonacularSearchResult[];
}

export async function getMealByQuery(query: string): Promise<SpoonacularRecipe | null> {
  const apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
  if (!apiKey) {
    return PLACEHOLDER_MEAL;
  }

  try {
    const url = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=1&addRecipeNutrition=true&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return PLACEHOLDER_MEAL;

    const data: SpoonacularResponse = await res.json();
    const result = data.results?.[0];
    if (!result) return PLACEHOLDER_MEAL;

    const calories = result.nutrition?.nutrients?.find((n) => n.name === 'Calories')?.amount;

    return {
      id: result.id,
      title: result.title,
      image: result.image,
      readyInMinutes: result.readyInMinutes ?? 30,
      servings: result.servings ?? 2,
      calories,
    };
  } catch {
    return PLACEHOLDER_MEAL;
  }
}

const PLACEHOLDER_MEAL: SpoonacularRecipe = {
  id: 0,
  title: 'Avocado & Quinoa Power Bowl',
  image: '',
  readyInMinutes: 20,
  servings: 2,
  calories: 420,
  summary: 'A nourishing bowl packed with protein, healthy fats, and complex carbs.',
};
