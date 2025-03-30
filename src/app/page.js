"use client";
import { useState } from 'react';

const RecipeBlock = ({ recipe }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
      <div
          className="border border-gray-300 rounded-lg my-2 p-4 shadow-sm cursor-pointer transition-colors duration-300 hover:bg-gray-800"
          onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>{recipe.title}</span>
          <span>{recipe.time_to_make}</span>
        </div>
        {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium mb-2">Ingredients:</h4>
              <ul className="list-disc pl-5 mb-4">
                {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-gray-600">{ingredient}</li>
                ))}
              </ul>

              <h4 className="font-medium mb-2">Nutrition:</h4>
              <ul className="list-disc pl-5 mb-4">
                <li className="text-gray-600">Calories: {recipe.nutrition.calories}</li>
                <li className="text-gray-600">Protein: {recipe.nutrition.protein}g</li>
                <li className="text-gray-600">Fat: {recipe.nutrition.fat}g</li>
                <li className="text-gray-600">Carbohydrates: {recipe.nutrition.carbohydrates}g</li>
              </ul>

              <h4 className="font-medium mb-2">Steps:</h4>
              <ol className="list-decimal pl-5">
                {recipe.steps.map((step, index) => (
                    <li key={index} className="text-gray-600 mb-2">{step}</li>
                ))}
              </ol>
            </div>
        )}
      </div>
  );
};

export default function Home() {
  const [preview, setPreview] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setTextOutput(null);

    if (!preview) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);

    try {
      let detectedIngredients = [];
      // Process image with Roboflow if not already processed
      if (!results) {
        const base64Data = preview.split(',')[1];
        try {
          const callRoboflowAPI = async (retries = 2) => {
            try {
              const response = await fetch(
                  'https://detect.roboflow.com/infer/workflows/dataquest-ijnlj/custom-workflow-2',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      api_key: 'juNeHsnILSxkBrDBAi5j',
                      inputs: { image: { type: "base64", value: base64Data } }
                    }),
                    signal: AbortSignal.timeout(45000) // 45 second timeout
                  }
              );

              if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`Roboflow API failed: ${response.status} - ${errorText}`);
              }

              return await response.json();
            } catch (err) {
              if (retries > 0 && (err.name === 'AbortError' || err.message.includes('500') || err.message.includes('429'))) {
                console.log(`Retrying Roboflow API call, ${retries} attempts left`);
                await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
                return callRoboflowAPI(retries - 1);
              }
              throw err;
            }
          };

          const result = await callRoboflowAPI();
          setResults(result);

          if (result?.outputs?.[0]?.predictions?.predictions) {
            detectedIngredients = result.outputs[0].predictions.predictions.map(p => p.class);
          } else {
            console.warn("Unexpected Roboflow result format:", result);
            detectedIngredients = [];
          }
        } catch (err) {
          console.error("Error with Roboflow API:", err);
          throw new Error(`Failed to process image: ${err.message}`);
        }
      } else {
        detectedIngredients = results?.outputs?.[0]?.predictions?.predictions?.map(p => p.class) || [];
      }

      // Implement improved retry logic for generate API
      const callGenerateAPI = async (retries = 3) => {
        try {
          const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: textInput,
              ingredients: detectedIngredients
            }),
            signal: AbortSignal.timeout(60000) // 60 second timeout
          });

          if (!generateResponse.ok) {
            const errorData = await generateResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Generation failed with status ${generateResponse.status}`);
          }

          const data = await generateResponse.json();

          try {
            const parsedResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            setTextOutput(parsedResult);
          } catch (parseErr) {
            console.error("Error parsing result:", parseErr);
            throw new Error("Failed to parse the generated recipe. Please try again.");
          }
        } catch (err) {
          if (retries > 0 && (
              err.name === 'AbortError' ||
              err.message.includes('500') ||
              err.message.includes('429') ||
              err.message.includes('timeout')
          )) {
            console.log(`Retrying generation API call, ${retries} attempts left`);
            await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000));
            return callGenerateAPI(retries - 1);
          }
          throw err;
        }
      };

      await callGenerateAPI();

    } catch (err) {
      setError(`${err.message || "An unexpected error occurred. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {preview && (
            <div className="mt-4">
              <img
                  src={preview}
                  alt="Preview"
                  className="max-w-xs max-h-48 object-contain"
              />
            </div>
        )}

        <br />

        <form onSubmit={handleGenerate} className="flex items-center">
          <div className="relative">
            <input
                type="text"
                placeholder="Enter your text prompt"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="pl-24 pr-2 py-2 border rounded-l w-80 focus:outline-none"
                disabled={loading}
            />
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className="absolute left-0 top-0 bottom-0 flex items-center px-3 border-r border-gray-300 cursor-pointer rounded-l"
            >
              Upload
            </label>
          </div>
          <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Search'}
          </button>
        </form>

        {error && <div className="text-red-500 mt-4">Error: {error}</div>}

        {textOutput?.recipes && (
            <div className="w-full max-w-2xl mt-6 px-4">
              <h2 className="text-2xl font-bold mb-4 text-center">Generated Recipes</h2>
              <div className="space-y-4">
                {textOutput.recipes.map((recipe, index) => (
                    <RecipeBlock key={index} recipe={recipe} />
                ))}
              </div>
            </div>
        )}
      </div>
  );
}