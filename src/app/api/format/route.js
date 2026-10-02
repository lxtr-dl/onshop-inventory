import { GoogleGenAI } from '@google/genai';

// 1. Tell Vercel to allow up to 60 seconds for this AI request (default is only 15s!)
export const maxDuration = 60; 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { rawText } = await req.json();
    if (!rawText) return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });

    const prompt = `
      You are an expert inventory formatting assistant.
      Analyze the raw inventory input and format it into three distinct styles.
      
      PRICE DETECTION RULE:
      - If the raw text includes prices, include them in both the listing and the spreadsheet.
      - If no prices are present, leave prices out.

      OUTPUT FORMATS:
      1. "listingFormat":
         - Group numbered variants (#1, #2) cleanly under their main title.
         - If an item has a quantity greater than 1 (e.g., "(3)", "3pcs"), you MUST append the exact string " - (Xpcs avail)" at the end of the line, where X is the quantity.
         - Format Example (with price): "Point Red Clear (rare bit w/ code) - 150 - (10pcs avail)"
         - Format Example (no price): "Point Red Clear - - (10pcs avail)"
         - If the quantity is 1 or unspecified, omit the "(Xpcs avail)" part (e.g., "Item Name - 150").

      2. "spreadsheetFormat":
         - Expand quantities into individual rows (e.g., if an item has (3), output it on 3 separate rows).
         - Separate the Item Name and Price using the exact string ___TAB___. Do NOT use actual tab characters.

      3. "reverseCountFormat":
         - This is a CONSOLIDATED HIERARCHICAL INVENTORY, not a countdown.
         - Group variants under their main item name.
         - MAIN ITEM ROW:
           * Col 1: Leave blank.
           * Col 2: Main Item Name (e.g., "SharkEdge", "CloMi").
           * Col 3: Total combined remaining count in parentheses (e.g., "(5)") or blank if 1 pc.
         - VARIANT ROWS (listed directly under their main item):
           * Col 1: Numbering starting from #1 for each new main item (e.g., "#1", "#2").
           * Col 2: Variant details (condition, color, HB/TT, etc.).
           * Col 3: Variant specific count in parentheses (e.g., "(3)") or blank if 1 pc.
         - Separate columns using ONLY the exact string ___TAB___. Do NOT use actual tab characters.
         
         EXAMPLE REVERSE COUNT OUTPUT:
         ___TAB___CloMi___TAB___
         #1___TAB___Black Bnew___TAB___(3)
         #2___TAB___Pink Bnew___TAB___
         #3___TAB___Green Bnew___TAB___(3)
         ___TAB___SharkEdge___TAB___
         #1___TAB___Black Bnew HB___TAB___(2)

      Return a JSON object with EXACTLY the keys "listingFormat", "spreadsheetFormat", and "reverseCountFormat".
      CRITICAL: Output ONLY the raw JSON object. Do not add any conversational text before or after the JSON.
      
      Raw text:
      ${rawText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    let rawJson = response.text;
    
    // 2. BULLETPROOF JSON EXTRACTION: Strip out any accidental text the AI adds outside the { } brackets
    const firstBrace = rawJson.indexOf('{');
    const lastBrace = rawJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawJson = rawJson.slice(firstBrace, lastBrace + 1);
    }

    const parsedData = JSON.parse(rawJson);

    parsedData.spreadsheetFormat = parsedData.spreadsheetFormat.replace(/___TAB___/g, '\t');
    parsedData.reverseCountFormat = parsedData.reverseCountFormat.replace(/___TAB___/g, '\t');

    return new Response(JSON.stringify(parsedData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Backend Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}