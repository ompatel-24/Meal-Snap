"use client";
import { useState } from 'react';

export default function Home() {
  const [preview, setPreview] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState('');

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
    setTextOutput('');

    if (!preview) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);

    try {
      let detectedIngredients = [];
      if (!results) {
        const base64Data = preview.split(',')[1];
        const response = await fetch(
            'https://detect.roboflow.com/infer/workflows/dataquest-ijnlj/custom-workflow-2',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: 'juNeHsnILSxkBrDBAi5j',
                inputs: { image: { type: "base64", value: base64Data } }
              }),
            }
        );

        if (!response.ok) throw new Error(`API failed: ${response.status}`);

        const result = await response.json();
        setResults(result);
        detectedIngredients = result?.outputs?.[0]?.predictions?.predictions?.map(p => p.class) || [];
      } else {
        detectedIngredients = results?.outputs?.[0]?.predictions?.predictions?.map(p => p.class) || [];
      }

      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textInput,
          ingredients: detectedIngredients
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await generateResponse.json();
      setTextOutput(data.result);
    } catch (err) {
      setError(err.message);
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

        <br></br>

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

        {textOutput && (
            <div className="border p-4 mt-4">
              <h2 className="text-xl font-semibold mb-2">Result:</h2>
              <pre className="whitespace-pre-wrap">{textOutput}</pre>
            </div>
        )}
      </div>
  );
}