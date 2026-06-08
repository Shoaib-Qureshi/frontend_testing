const config = require('./config');
const { runAudit } = require('./agent/audit');

async function main() {
  const rawTargetUrl = process.argv[2];

  if (!rawTargetUrl) {
    console.error('Usage: node index.js <url>');
    process.exit(1);
  }

  try {
    await runAudit(rawTargetUrl, config, {
      onProgress: (message) => console.log(message),
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
