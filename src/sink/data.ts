import manifest from "../../registry/cyber/recipes/manifest.json"
import type { SinkRecipe } from "./types"

export const sinkRecipes: SinkRecipe[] = manifest
export const sinkGroups = [...new Set(sinkRecipes.map(recipe => recipe.group))].sort()
