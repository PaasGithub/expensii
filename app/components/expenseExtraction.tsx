const sendTextForExtraction = async (text: string) => {
    const apiKey = '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'; // Replace with your actual OpenAI API key
    const url = 'https://api.openai.com/v1/chat/completions';
  
    // Custom prompt for expense extraction
    const prompt = `
  Extract any expense-related data from the following text. Identify the item and its corresponding price. If no expense data is found, return a JSON response with a message indicating that. Return the data in JSON format with the following structure:
  
  {
    "expenses": [
      { "item": "item_name", "price": "item_price" },
      ...
    ]
  }
  
  If no expense data is found, return:
  {
    "expenses": [],
    "message": "No expense data found."
  }
  
  Text: ${text}
  `;
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Use GPT-3.5 Turbo or GPT-4
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts expense data from text and returns it in JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' }, // Ensure the response is in JSON format
        }),
      });
  
      const result = await response.json();
      console.log("Response from OpenAI for expense extraction:");
      console.log(result);
  
      // Extract the JSON content from the response
      const extractedData = result.choices[0]?.message?.content;
      if (extractedData) {
        return JSON.parse(extractedData); // Parse the JSON string into an object
      } else {
        return {
          expenses: [],
          message: "No expense data found.",
        };
      }
    } catch (error) {
      console.error("Failed to send text for expense extraction:", error);
      return {
        expenses: [],
        message: "An error occurred while processing the request.",
      };
    }
  };

  export default sendTextForExtraction;