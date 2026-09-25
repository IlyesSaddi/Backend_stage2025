const { generateTestSpec } = require("./services/testSpecGenerator");

async function main() {

  const context = `
INTENT:
{
  "action": "create",
  "entity": "user",
  "attributes": [],
  "keywords": ["create", "user"]
}

MAIN WORKFLOW:
createUser

POST-CREATION CONFIRMATION:
confirmUser

ALTERNATIVE WORKFLOW:
resendConfirmationEmail

UNRELATED FUNCTIONS:
login
users

EMAIL_TEST_MECHANISM_PROVIDED:
NO

IMPORTANT:
The test must not call login, users, or resendConfirmationEmail.

The createUser mutation is responsible for creating a new user.

The frontend Login.jsx contains the createUser mutation.

The available context does NOT provide any Playwright selectors.

The available context does NOT provide any URL.

The available context does NOT provide any success-message selector.
`;

  try {

    const result = await generateTestSpec(context);

    console.log("\n===== GENERATED TEST SPEC =====\n");
    console.log(JSON.stringify(result, null, 2));
    console.log("\n================================\n");

  } catch (error) {

    console.error("\n===== ERROR =====\n");
    console.error(error.message);

  }
}

main();