const app = require("./app");
const env = require("./config/env");
const { connectToDatabase, getConnectionMode } = require("./config/db");

async function startServer() {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.info(
      `Lead Saathi API running on port ${env.port} with ${getConnectionMode()} storage and ${env.voiceProvider} voice provider.`
    );
  });
}

startServer();
