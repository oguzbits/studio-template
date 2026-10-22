export type CompleteParams = {
  model: string;
  system?: string;
  prompt: string;
  jsonSchema: Record<string, unknown>;
};

export type CompleteResult = {
  // JSON string of the structured result
  text: string;
  tokensIn: number;
  tokensOut: number;
};
