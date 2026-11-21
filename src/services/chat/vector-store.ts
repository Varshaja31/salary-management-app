import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';

import { env } from '../../config/env.js';
import { extractSchemaDocuments } from './schema-extractor.js';

interface EmbeddedDoc {
  text: string;
  vector: number[];
}

let embeddingsModel: GoogleGenerativeAIEmbeddings | null = null;
let embeddedDocs: EmbeddedDoc[] | null = null;
let initPromise: Promise<void> | null = null;

function getEmbeddings(): GoogleGenerativeAIEmbeddings {
  if (!embeddingsModel) {
    embeddingsModel = new GoogleGenerativeAIEmbeddings({
      apiKey: env.GEMINI_API_KEY,
      model: 'gemini-embedding-001',
    });
  }
  return embeddingsModel;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// One-time ingestion: extract schema docs, embed them, keep in memory.
// Re-runs only when the process restarts or refreshIndex() is called.
export async function initializeVectorStore(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const docs = await extractSchemaDocuments();
    const embeddings = getEmbeddings();
    const vectors = await embeddings.embedDocuments(docs.map((d) => d.text));

    embeddedDocs = docs.map((d, i) => ({ text: d.text, vector: vectors[i] }));
  })();

  return initPromise;
}

export async function refreshIndex(): Promise<void> {
  embeddedDocs = null;
  initPromise = null;
  await initializeVectorStore();
}

// Retrieve the top-K most relevant schema documents for a question.
export async function retrieveRelevantSchema(question: string, k = 6): Promise<Document[]> {
  await initializeVectorStore();

  if (!embeddedDocs || embeddedDocs.length === 0) return [];

  const queryVector = await getEmbeddings().embedQuery(question);

  return embeddedDocs
    .map((d) => ({ text: d.text, score: cosineSimilarity(d.vector, queryVector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((d) => new Document({ pageContent: d.text, metadata: { score: d.score } }));
}
