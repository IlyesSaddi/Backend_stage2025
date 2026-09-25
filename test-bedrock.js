const { askBedrock } = require("./services/bedrockService");

async function main() {
  try {
    const response = await askBedrock(
      "Explain what a GraphQL mutation is in one short paragraph."
    );

    console.log("\n===== BEDROCK RESPONSE =====\n");
    console.log(response);
    console.log("\n============================\n");

  } catch (error) {
    console.error("\n===== BEDROCK ERROR =====\n");
    console.error(error);
  }
}

main();