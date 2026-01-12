import { openai } from '@ai-sdk/openai';
import { wrapLanguageModel } from 'ai';

const baseModel = openai('gpt-4o-mini');

// Only use devtools in development - conditional require to avoid production errors
export const devToolsEnabledModel = process.env.NODE_ENV === 'development'
  ? wrapLanguageModel({
    model: baseModel,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    middleware: require('@ai-sdk/devtools').devToolsMiddleware(),
  })
  : baseModel;
