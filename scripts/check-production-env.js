
// Check if we are in production build
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

if (isProduction) {
  const testKey = 'sk-kooqclttpgqfvetifmnzxkvedqamviujdjpxajkcmbwriaze';
  const currentKey = process.env.NEXT_PUBLIC_API_KEY;

  if (currentKey === testKey) {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Test API Key detected in production build!');
    console.error('The test key "sk-kooqcl...riaze" must not be used in production.');
    console.error('Please remove NEXT_PUBLIC_API_KEY from your production environment variables.');
    process.exit(1);
  } else {
      console.log('Environment check passed: No test API key detected.');
  }
} else {
    console.log('Not in production mode, skipping strict env check.');
}
