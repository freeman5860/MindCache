// Core document types
export interface Document {
  id: string;
  url: string;
  title: string;
  content: string;
  excerpt: string;
  savedAt: number;
  updatedAt: number;
}

// Chunk for vector storage
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
}

// Orama schema types
export interface OramaDocument {
  id: string;
  documentId: string;
  content: string;
  title: string;
  url: string;
  embedding: number[];
  savedAt: number;
}

// Search result
export interface SearchResult {
  id: string;
  documentId: string;
  title: string;
  url: string;
  content: string;
  score: number;
  savedAt: number;
}

// Worker message types
export type WorkerMessageType =
  | 'INIT'
  | 'EMBED_TEXT'
  | 'EMBED_BATCH'
  | 'MODEL_LOADED'
  | 'EMBEDDING_RESULT'
  | 'PROGRESS'
  | 'ERROR';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload?: unknown;
  id?: string;
}

export interface EmbedRequest {
  type: 'EMBED_TEXT' | 'EMBED_BATCH';
  id: string;
  payload: {
    texts: string[];
  };
}

export interface EmbedResponse {
  type: 'EMBEDDING_RESULT';
  id: string;
  payload: {
    embeddings: number[][];
  };
}

export interface ProgressMessage {
  type: 'PROGRESS';
  payload: {
    status: string;
    progress: number;
    file?: string;
  };
}
