import * as FileSystem from 'expo-file-system';


const readImageFileAsBase64 = async (fileUri: string): Promise<string> => {
    try {
      const base64String = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64String;
    } catch (error) {
      console.error("Failed to read image file:", error);
      throw error;
    }
};

const sendImageForExtraction = async (imageURL: string) => {
    const apiKey = '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';

    const url = 'https://api.openai.com/v1/chat/completions';

    try {
        // Read the image file and convert it to a base64 string
        const imageBase64 = await readImageFileAsBase64(imageURL);
    
        // Custom prompt for expense extraction from the image
        const prompt = `Extract any expense-related data from the provided image. Identify the item and its corresponding price. If no expense data is found, return a JSON response with a message indicating that. Return the data in JSON format with the following structure: {"expenses":[{"item":"item_name","price":"item_price"},...]}. If no expense data is found, return: {"expenses":[],"message":"No expense data found."}`;
    
        // Send the image and prompt to the OpenAI Vision API
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4-vision-preview', // Use the Vision model
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that extracts expense data from images and returns it in JSON format.',
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`, // Send the image as base64
                    },
                  },
                ],
              },
            ],
            max_tokens: 300, // Adjust based on your needs
            response_format: { type: 'json_object' }, // Ensure the response is in JSON format
          }),
        });
    
        const result = await response.json();
        console.log("Response from OpenAI for image expense extraction:");
        console.log(result);
    
        // Extract the JSON content from the response
        const extractedData = result.choices[0]?.message?.content;
        if (extractedData) {
          return JSON.parse(extractedData); // Parse the JSON string into an object
        } else {
          return { expenses: [], message: "No expense data found." };
        }
      } catch (error) {
        console.error("Failed to send image for expense extraction:", error);
        return { expenses: [], message: "An error occurred while processing the request." };
      }
};

export default sendImageForExtraction;