import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ });

export async function POST(req) {
    try {
        const { prompt, ingredients } = await req.json();

        const messages = [
            {
                role: 'system',
                content: `You are provided with:
                    1. Detected Ingredients: ${ingredients.join(', ')}
                    2. User Prompt: ${prompt}
                    
                    Generate at least 3 or more recipes based on the provided information, the ingredients should be the main part of the dish.
                    All information MUST be filled. Your response must be a valid JSON object with the following structure:
                    "recipes": [
                        {
                          "title": "Recipe Name",
                          "ingredients": ["ingredient 1", "ingredient 2", ...],
                          "steps": ["step 1", "step 2", ...],
                          "time_to_make": "30 minutes",
                          "nutrition": {
                            "calories": "350 kcal",
                            "protein": "15g",
                            "carbs": "40g",
                            "fat": "10g"
                          }
                        },
                        { … },
                        { … }
                     ]`
            },
            { role: 'user', content: prompt }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.1-8b-instant',
            response_format: { type: "json_object" },
            temperature: 0.7
        });

        let responseContent = completion.choices[0].message.content;

        const jsonMatch = responseContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
            responseContent = jsonMatch[1];
        }

        try {
            const parsedContent = JSON.parse(responseContent);
            return NextResponse.json({ result: parsedContent });
        } catch (parseError) {
            console.error('Failed to parse model response:', parseError);
            console.log('Raw response:', responseContent);
            return NextResponse.json(
                { error: 'Invalid response format from the model' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recipe' },
            { status: 500 }
        );
    }
}