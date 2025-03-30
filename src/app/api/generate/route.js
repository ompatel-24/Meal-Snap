import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: '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' });

export async function POST(req) {
    try {
        const { prompt, ingredients } = await req.json();

        const messages = [
            {
                role: 'system',
                content: `You are provided with:
1. Detected Ingredients: ${ingredients.join(', ')}
2. User Prompt: ${prompt}

Generate a few recipe based on the provided information. Follow these steps for each one:
1. Name of the recipe.
2. Create a list of ingredients.
3. Provide a detailed list of preparation steps.
4. Specify the time to make the recipe.
5. Include nutrition details.
Output the result as valid JSON with the following keys:
- ingredients: array of ingredients used,
- steps: array of steps required to prepare the recipe,
- time_to_make: string indicating preparation time,
- nutrition: object containing key nutritional details.`
            },
            { role: 'user', content: prompt }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama3-70b-8192',
            response_format: { type: "json_object" }
        });

        return NextResponse.json({ result: completion.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate' },
            { status: 500 }
        );
    }
}