import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface TransformParams {
  dx: number;
  dy: number;
  scale: number;
}

async function imageElementToBase64(imageElement: HTMLImageElement): Promise<{base64: string, mimeType: string}> {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(imageElement, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    return {
      base64: dataUrl.split(',')[1],
      mimeType: 'image/png'
    };
}

async function canvasElementToBase64(canvas: HTMLCanvasElement): Promise<{base64: string, mimeType: string}> {
    const dataUrl = canvas.toDataURL('image/png');
    return {
      base64: dataUrl.split(',')[1],
      mimeType: 'image/png'
    };
}


async function callGeminiForImage(prompt: string, base64Image: string, mimeType: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: mimeType,
                    },
                },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    }
    
    const textResponse = response.text;
    if (textResponse) {
        throw new Error(`Image generation failed. Model responded with: "${textResponse}"`);
    }

    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
        // FIX: Correctly access the block reason from `promptFeedback`. `blockReason` is a string enum, not an object with a `reason` property.
        throw new Error(`Request was blocked due to safety settings: ${blockReason}`);
    }
    throw new Error('No image was generated. The model may have refused the request or returned an empty response.');
}


export async function editWithPrompt(
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  prompt: string
): Promise<string> {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = originalImage.naturalWidth;
  tempCanvas.height = originalImage.naturalHeight;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not create temporary canvas context');

  ctx.drawImage(originalImage, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0);

  const { base64: inpaintingImageBase64, mimeType } = await canvasElementToBase64(tempCanvas);

  const fullPrompt = `Carefully analyze the following image which has a transparent area. Your task is to inpaint this transparent area based on the user's request. The user wants you to fill it with: "${prompt}". Follow the user's request exactly and do not add any extra or unwanted creative edits. The filled area must be photorealistic and seamlessly blend with the surrounding image in terms of lighting, texture, and perspective. Do not alter any other part of the image.`;

  return callGeminiForImage(fullPrompt, inpaintingImageBase64, mimeType);
}

export async function magicErase(
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
): Promise<string> {
    const erasePrompt = "Carefully analyze the following image which has a transparent area. Your task is to inpaint this transparent area. The goal is to remove an unwanted object, so you must fill the area with content that seamlessly and realistically continues the surrounding background. Do not add any new objects or subjects. The filled area must match the lighting, texture, and perspective of the rest of the image."
    return editWithPrompt(originalImage, maskCanvas, erasePrompt);
}

export async function expandImage(
  originalImage: HTMLImageElement,
  margins: { top: number; right: number; bottom: number; left: number }
): Promise<string> {
    const newWidth = originalImage.naturalWidth + margins.left + margins.right;
    const newHeight = originalImage.naturalHeight + margins.top + margins.bottom;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create temporary canvas context');

    ctx.drawImage(originalImage, margins.left, margins.top);

    const { base64: expandedCanvasBase64, mimeType } = await canvasElementToBase64(tempCanvas);
    
    const prompt = "This image has transparent padding around it. Please fill in the transparent areas to naturally extend the existing image. The result should be a seamless, photorealistic expansion of the original content."
    
    return callGeminiForImage(prompt, expandedCanvasBase64, mimeType);
}

export async function removeBackground(
  originalImage: HTMLImageElement
): Promise<string> {
  const { base64, mimeType } = await imageElementToBase64(originalImage);
  const prompt = "Your task is to act as an expert background removal tool. Analyze the provided image and identify the main subject(s). Create a new version of the image where the background is completely removed and made transparent. The final output should be a PNG with an alpha channel, containing only the main subject(s) with clean, precise edges.";
  return callGeminiForImage(prompt, base64, mimeType);
}

export async function enhanceImage(
  originalImage: HTMLImageElement
): Promise<string> {
  const { base64, mimeType } = await imageElementToBase64(originalImage);
  const prompt = `Act as a professional photo editor. Your task is to perform a comprehensive, high-quality enhancement of the provided image. The goal is to make the image look more professional, vibrant, and natural, as if it were retouched by an expert.

Please apply the following adjustments holistically, ensuring they work together harmoniously:

1.  **Lighting & Contrast:** Correct the overall exposure. Balance brightness and contrast to create depth and impact. Recover details in shadows and highlights without making the image look unnatural or flat.
2.  **Color Correction:** Adjust the white balance for natural-looking colors. Enhance vibrance and saturation to make colors pop, but avoid oversaturation. Ensure skin tones are accurate and pleasing if portraits are detected.
3.  **Clarity & Sharpness:** Increase sharpness and local contrast to improve clarity and bring out fine details and textures. The sharpening should be subtle and not introduce halos or artifacts.
4.  **Noise Reduction:** If any digital noise is present, apply noise reduction carefully to clean up the image without sacrificing important details.
5.  **Portrait-Specific (if applicable):** If the image is a portrait, apply subtle skin smoothing to reduce minor blemishes while preserving natural skin texture. Enhance eye clarity.
6.  **Polishing:** Apply a final polish to the overall look and feel, ensuring all adjustments are blended seamlessly. The final result should be a significant but natural-looking improvement over the original.

Do not crop, resize, or add any elements to the image. Return only the enhanced image.`;
  return callGeminiForImage(prompt, base64, mimeType);
}

export async function retextureObject(
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  prompt: string
): Promise<string> {
  const { base64: imageBase64, mimeType } = await imageElementToBase64(originalImage);
  const { base64: maskBase64 } = await canvasElementToBase64(maskCanvas);

  const fullPrompt = `You are an expert photo editor. You are given an image and a corresponding mask image. Your task is to apply a modification to the original image ONLY in the area designated by the white pixels in the mask. The user's instruction for the modification is: "${prompt}". Follow this instruction literally and precisely. Do not add any extra elements, change the style, or make any other creative edits that were not explicitly requested. Do not change any part of the image outside the masked area. The final result should be photorealistic and seamlessly blended.`;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
          parts: [
              { text: fullPrompt },
              { inlineData: { data: imageBase64, mimeType: mimeType } },
              { inlineData: { data: maskBase64, mimeType: 'image/png' } },
          ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
  });

  const parts = response.candidates?.[0]?.content?.parts;

  if (parts) {
      for (const part of parts) {
          if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
  }

  const textResponse = response.text;
  if (textResponse) {
      throw new Error(`Image generation failed. Model responded with: "${textResponse}"`);
  }
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
      // FIX: Correctly access the block reason from `promptFeedback`. `blockReason` is a string enum, not an object with a `reason` property.
      throw new Error(`Request was blocked due to safety settings: ${blockReason}`);
  }
  throw new Error('No image was generated for retexturing. The model may have refused the request or returned an empty response.');
}

export async function transformObject(
  originalImage: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  transform: TransformParams,
): Promise<string> {
  const { dx, dy, scale } = transform;

  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!maskCtx) throw new Error('Could not get mask context');
  const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const data = imageData.data;
  let minX = maskCanvas.width, minY = maskCanvas.height, maxX = 0, maxY = 0;
  for (let y = 0; y < maskCanvas.height; y++) {
    for (let x = 0; x < maskCanvas.width; x++) {
      const alpha = data[(y * maskCanvas.width + x) * 4 + 3];
      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const originalWidth = maxX - minX;
  const originalHeight = maxY - minY;
  if (originalWidth <= 0 || originalHeight <= 0) {
    throw new Error('Invalid selection mask for transformation.');
  }

  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = originalImage.naturalWidth;
  compositeCanvas.height = originalImage.naturalHeight;
  const ctx = compositeCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not create composite canvas context');
  
  ctx.drawImage(originalImage, 0, 0);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  const objectCanvas = document.createElement('canvas');
  objectCanvas.width = originalImage.naturalWidth;
  objectCanvas.height = originalImage.naturalHeight;
  const objCtx = objectCanvas.getContext('2d');
  if (!objCtx) throw new Error('Could not create object canvas context');
  objCtx.drawImage(originalImage, 0, 0);
  objCtx.globalCompositeOperation = 'destination-in';
  objCtx.drawImage(maskCanvas, 0, 0);
  
  const newWidth = originalWidth * scale;
  const newHeight = originalHeight * scale;
  const newX = minX + dx;
  const newY = minY + dy;
  ctx.drawImage(objectCanvas, minX, minY, originalWidth, originalHeight, newX, newY, newWidth, newHeight);

  const { base64: compositeBase64, mimeType } = await canvasElementToBase64(compositeCanvas);

  const prompt = "This image has been edited. An object was moved, leaving a transparent area where it used to be. Please inpaint the transparent area to seamlessly match the background. At the same time, blend the moved object into its new location, ensuring lighting, shadows, and perspective are correct and photorealistic. The final image should have no transparent areas.";
  
  return callGeminiForImage(prompt, compositeBase64, mimeType);
}