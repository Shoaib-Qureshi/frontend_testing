const config = require('./config');
const { createServerApp } = require('./lib/server-app');

async function main() {
  const { server } = await createServerApp();

  server.listen(config.serverPort, () => {
    console.log(`Frontend dashboard ready at ${config.appUrl}`);
  });
}

main().catch((error) => {
  console.error(`Server failed to start: ${error.message}`);
  process.exit(1);
});
