"use client";
import { useState } from 'react';
import { FiUpload, FiSearch, FiChevronDown, FiChevronUp, FiClock } from 'react-icons/fi';

const RecipeBlock = ({ recipe }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
      <div
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl my-4 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
      >
        <div
            className="flex justify-between items-center p-5 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-xl font-medium text-gray-800 dark:text-white">{recipe.title}</h3>
          <div className="flex items-center space-x-2">
          <span className="flex items-center text-gray-500 dark:text-gray-300 text-sm">
            <FiClock className="mr-1" /> {recipe.time_to_make}
          </span>
            {isExpanded ?
                <FiChevronUp className="text-blue-500" /> :
                <FiChevronDown className="text-blue-500" />
            }
          </div>
        </div>

        {isExpanded && (
            <div className="p-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-lg mb-3 text-gray-700 dark:text-gray-200">Ingredients</h4>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                          <span className="text-gray-600 dark:text-gray-400">{ingredient}</span>
                        </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-lg mb-3 text-gray-700 dark:text-gray-200">Nutrition</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Calories</div>
                      <div className="font-medium text-gray-800 dark:text-white">{recipe.nutrition.calories}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Protein</div>
                      <div className="font-medium text-gray-800 dark:text-white">{recipe.nutrition.protein}</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Fat</div>
                      <div className="font-medium text-gray-800 dark:text-white">{recipe.nutrition.fat}</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Carbs</div>
                      <div className="font-medium text-gray-800 dark:text-white">{recipe.nutrition.carbohydrates || recipe.nutrition.carbs}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-lg mb-3 text-gray-700 dark:text-gray-200">Preparation Steps</h4>
                <ol className="space-y-3">
                  {recipe.steps.map((step, index) => (
                      <li key={index} className="flex">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-500 text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                        <span className="text-gray-600 dark:text-gray-400">{step}</span>
                      </li>
                  ))}
                </ol>
              </div>
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900 text-gray-800 dark:text-white">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Meal Snap</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Upload an image of ingredients and let AI suggest delicious recipes</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex flex-col items-center">
                {preview ? (
                    <div className="mb-6 relative group">
                      <img
                          src={preview}
                          alt="Uploaded ingredients"
                          className="max-h-64 rounded-lg object-contain border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900"
                      />
                      <label
                          htmlFor="file-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity cursor-pointer"
                      >
                    <span className="text-white flex items-center">
                      <FiUpload className="mr-2" /> Change image
                    </span>
                      </label>
                    </div>
                ) : (
                    <div className="mb-6 w-full">
                      <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG (MAX. 10MB)</p>
                        </div>
                      </label>
                    </div>
                )}

                <form onSubmit={handleGenerate} className="w-full">
                  <div className="relative flex items-center mb-6">
                    <input
                        type="text"
                        placeholder="What would you like to cook today?"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="w-full py-4 pl-4 pr-16 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 inset-y-2 flex items-center justify-center w-12 h-12 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-colors"
                    >
                      {loading ?
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> :
                          <FiSearch className="w-5 h-5" />
                      }
                    </button>
                  </div>
                  <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                  />
                </form>

                {error && (
                    <div className="w-full mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                      {error}
                    </div>
                )}

                {loading && (
                    <div className="w-full mt-6 flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-4">
                        Analyzing ingredients and generating recipes...
                      </p>
                    </div>
                )}
              </div>
            </div>

            {textOutput?.recipes && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-center mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Delicious Recipe Suggestions
                </span>
                  </h2>
                  <div>
                    {textOutput.recipes.map((recipe, index) => (
                        <RecipeBlock key={index} recipe={recipe} />
                    ))}
                  </div>
                </div>
            )}
          </div>
        </main>
      </div>
  );
}