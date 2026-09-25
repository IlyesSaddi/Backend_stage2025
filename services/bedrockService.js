const {
  BedrockRuntimeClient,
  ConverseCommand
} = require("@aws-sdk/client-bedrock-runtime");

const AWS_REGION = process.env.AWS_REGION || "eu-west-1";
const hasAwsCredentials = Boolean(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);

const client = hasAwsCredentials
  ? new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
      }
    })
  : new BedrockRuntimeClient({ region: AWS_REGION });

const MODEL_ID = process.env.AWS_BEDROCK_MODEL || "eu.amazon.nova-micro-v1:0";

async function askBedrock(prompt) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS Bedrock credentials missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
  }

  const command = new ConverseCommand({
    modelId: MODEL_ID,

    messages: [
      {
        role: "user",
        content: [
          {
            text: prompt
          }
        ]
      }
    ],

    inferenceConfig: {
      maxTokens: 1000,
      temperature: 0.1
    }
  });

  const response = await client.send(command);

  return response.output.message.content
    .map(block => block.text || "")
    .join("");
}

module.exports = {
  askBedrock
};