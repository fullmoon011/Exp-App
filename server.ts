import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Categories for prompt grounding
const CATEGORY_NAMES = [
  "Rent / housing installment (کرێی خانوو یان قیست)",
  "Electricity & generator (کارەبا و مۆلیدە)",
  "Water (ئاو)",
  "Gas & heating fuel (گاز و نەوت)",
  "Internet (ئینتەرنێت)",
  "Mobile & credit (مۆبایل و کارت)",
  "Groceries (خواردن و بازاڕ)",
  "Bread & bakery (نان و نانەوایی)",
  "Meat & poultry (گۆشت و مریشک)",
  "Fruit & vegetables (میوە و سەوزە)",
  "Restaurants & cafes (ڕێستۆران و کافێ)",
  "Car fuel (بەنزین)",
  "Transport & taxi (گواستنەوە و تاکسی)",
  "Car maintenance (چاککردنەوەی ئوتومبێل)",
  "Car installment (قیستی ئوتومبێل)",
  "Medicine & doctor (دەرمان و دکتۆر)",
  "Clothing (جلوبەرگ)",
  "Household supplies (پێداویستی ماڵ)",
  "Furniture & appliances (کەلوپەل و کارەبایی)",
  "Home repairs (چاککردنەوەی ماڵ)",
  "School & tuition (قوتابخانە و خوێندن)",
  "Children (منداڵان)",
  "Gifts & occasions (هەدیە و بۆنەکان)",
  "Family support (یارمەتی کەسوکار)",
  "Charity & zakat (زەکات و خێر)",
  "Travel & picnics (گەشت و سەیران)",
  "Entertainment (خۆشی و یاری)",
  "Personal care & barber (جوانکاری و سەرتاشین)",
  "Insurance (بیمە)",
  "Debt repayment (قەرزدانەوە)",
  "Rotating savings circle (کۆمەڵە / جەمعیە)",
  "Other (خەرجی تر)"
];

// Endpoint: Receipt Scanner
app.post('/api/scan-receipt', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const { image, mimeType = 'image/jpeg' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Missing image data.' });
    }

    // Clean base64 data
    const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;

    const prompt = `You are an expert OCR and financial document parser specializing in receipts and invoices from Iraq and the Kurdistan Region.
The text on the receipt may be written in Kurdish (Sorani/Badini), Arabic, or English.
Numbers might be Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) or standard European digits (0-9). Convert all numbers to regular integers or decimals.
Examine the receipt image and extract:
1. "total": The final total amount paid (numeric value only, e.g. 25000 or 15.5).
2. "currency": Either "IQD" or "USD". Default to "IQD" unless "$" or "USD" is clearly indicated.
3. "date": Date in "YYYY-MM-DD" format if visible, otherwise null.
4. "merchant": The store, market, restaurant, or vendor name (short string).
5. "category": An integer index (0 to 31) that best matches the items bought, chosen strictly from:
${CATEGORY_NAMES.map((c, i) => `${i}: ${c}`).join('\n')}
6. "note": A concise summary of items purchased or merchant name (under 70 characters).

Return ONLY a valid JSON object matching this schema:
{
  "total": number,
  "currency": "IQD" | "USD",
  "date": string | null,
  "merchant": string,
  "category": number,
  "note": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error scanning receipt:', err);
    return res.status(500).json({ error: err.message || 'Failed to scan receipt' });
  }
});

// Endpoint: Quick Text Entry Parser
app.post('/api/parse-quick-entry', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text content.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Today's date is ${today}.
Parse this natural language household expense entry note into a structured expense.
The input can be in Kurdish Sorani, Kurdish Badini, Arabic, Persian, Turkish, or English.
Handle common local phrasing:
- "هەزار", "k", "ألف", "هه‌زار", "thousand" means multiplied by 1,000 (e.g., "٤٥ هەزار" or "45 hezar" = 45000).
- "دۆلار", "$", "USD", "ورق" means USD.
- Digits can be Arabic-Indic (٠-٩) or 0-9.
Category must be an integer index (0 to 31) strictly from:
${CATEGORY_NAMES.map((c, i) => `${i}: ${c}`).join('\n')}

Input text: "${text}"

Respond with ONLY valid JSON:
{
  "total": number,
  "currency": "IQD" | "USD",
  "date": string | null,
  "category": number,
  "note": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error parsing quick entry:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse expense note' });
  }
});

// Endpoint: AI Budget & Spending Advisor
app.post('/api/month-analysis', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const { data, language = 'Kurdish Sorani' } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Missing budget data.' });
    }

    const prompt = `You are a supportive, insightful personal finance and household budgeting coach.
Language to respond in: ${language}.
Here is the household financial data for the month:
${JSON.stringify(data, null, 2)}

Provide:
1. Three concise, encouraging observations comparing spending vs previous month and budget limits.
2. Three practical, realistic money-saving tips tailored to these specific categories.
Keep the tone respectful, clear, and direct. Keep it under 200 words. Format with clean bullet points.
Do not output robotic disclaimers; this is a helpful household budget breakdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    return res.json({ analysis: response.text || '' });
  } catch (err: any) {
    console.error('Error in month analysis:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate month analysis' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
