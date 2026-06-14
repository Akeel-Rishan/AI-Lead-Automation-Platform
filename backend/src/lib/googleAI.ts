import { env } from "../config/env";

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[];
  };
  error?: {
    message?: string;
  };
};

const GEMINI_MODEL = env.GOOGLE_GEMINI_MODEL;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const GEMINI_EMBEDDING_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;

export async function generateGeminiJson({
  systemPrompt,
  userPrompt,
  temperature = 0.3,
  maxOutputTokens = 500
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}) {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("Google API key is not configured");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType: "application/json"
      }
    })
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Google Gemini request failed");
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Google Gemini response was empty");
  }

  return text;
}

export async function generateGeminiText({
  systemPrompt,
  userPrompt,
  temperature = 0.4,
  maxOutputTokens = 1024
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}) {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("Google API key is not configured");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    })
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Google Gemini request failed");
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Google Gemini response was empty");
  }

  return text;
}

export async function generateGeminiEmbedding(text: string) {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("Google API key is not configured");
  }

  const response = await fetch(
    `${GEMINI_EMBEDDING_ENDPOINT}?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 1536
      })
    }
  );

  const data = (await response.json()) as GeminiEmbeddingResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Google Gemini embedding request failed");
  }

  const values = data.embedding?.values;

  if (!values?.length) {
    throw new Error("Google Gemini embedding response was empty");
  }

  return values;
}
