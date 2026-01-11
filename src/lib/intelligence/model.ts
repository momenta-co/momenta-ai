import { devToolsMiddleware } from '@ai-sdk/devtools';
import { openai } from '@ai-sdk/openai';
import { wrapLanguageModel } from 'ai';

export const devToolsEnabledModel = wrapLanguageModel({
  model: openai('gpt-4o-mini'),
  middleware: devToolsMiddleware(),
});
