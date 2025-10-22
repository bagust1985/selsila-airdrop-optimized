import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import main app
const { app } = await import(join(__dirname, './src/index.ts'));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Selsila Airdrop API running on port ${port}`);
  console.log(`📚 Documentation: http://localhost:${port}/swagger`);
});
