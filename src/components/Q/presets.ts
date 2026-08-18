import {
  defaultSchema,
  deriveDefaultConfig,
  type QConfig,
  type QSchema,
} from '@mieweb/q';

export const qTwilioAgentSchema = defaultSchema;

export const qAgentSchema: QSchema = {
  schemaType: 'mieforms-v1.0',
  title: 'Agent Configuration',
  fields: [
    {
      id: 'sec-basic',
      fieldType: 'section',
      title: 'Basic Info',
      fields: [
        {
          id: 'name',
          fieldType: 'text',
          question: 'Agent Name',
          answer: 'New Agent',
          required: false,
        },
        {
          id: 'instructions',
          fieldType: 'longtext',
          question: 'Instructions',
          answer: 'You are a helpful assistant.',
          required: false,
        },
      ],
    },
    {
      id: 'sec-generation',
      fieldType: 'section',
      title: 'Generation Settings',
      fields: [
        {
          id: 'temperature',
          fieldType: 'text',
          question: 'Temperature (0.0 - 1.0)',
          answer: '0.7',
          required: false,
          configType: 'number',
        },
      ],
    },
  ],
};

export const qLandingPageAgentConfig: QConfig = {
  ...deriveDefaultConfig(qAgentSchema),
  name: 'Landing Page Assistant',
  instructions:
    'You are a helpful assistant for a demo page that shows user profile information (name, address, zip code). When the user asks about their current information or details, call the appropriate tool.',
  temperature: 0.7,
};

export function createQAgentConfig() {
  return deriveDefaultConfig(qAgentSchema);
}

export function createQTwilioAgentConfig() {
  return deriveDefaultConfig(qTwilioAgentSchema);
}
