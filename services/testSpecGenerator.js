const { askBedrock } = require("./bedrockService");

async function generateTestSpec(context) {

  const prompt = `
You are an AI assistant specialized in automated regression testing.

Generate a test specification from the application context below.

STRICT RULES:

1. Use ONLY information explicitly present in the context.
2. NEVER invent selectors.
3. NEVER invent URLs.
4. NEVER invent API endpoints.
5. NEVER invent tokens.
6. NEVER invent button names.
7. NEVER invent success messages.
8. If a required UI element is not present in the context, use:
   "NOT_PROVIDED"
9. Do not assume that a selector exists.
10. Return ONLY valid JSON.
11. Do not use markdown.
12. The test must follow the MAIN WORKFLOW.
13. Do not use unrelated workflows.

APPLICATION CONTEXT:
${context}

Return exactly this JSON structure:

{
  "testName": "",
  "description": "",
  "workflow": "",
  "preconditions": [],
  "steps": [
    {
      "action": "",
      "target": "",
      "value": "",
      "expectedResult": ""
    }
  ],
  "finalExpectedResult": ""
}
`;

  const response = await askBedrock(prompt);

  // Remove possible markdown fences
  const cleaned = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let testSpec;

  try {
    testSpec = JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      "Nova returned invalid JSON:\n" + response
    );
  }

  return testSpec;
}

module.exports = {
  generateTestSpec
};