// Loaded by Jest before any test module, because ConfigModule.forRoot()
// validates the environment as soon as AppModule is imported.
process.env['NODE_ENV'] = 'test';
process.env['SUPABASE_URL'] = 'https://project.supabase.test';
process.env['SUPABASE_ANON_KEY'] = 'anon-key-for-tests-0000000000';
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'service-role-key-for-tests-0000';
process.env['CORS_ORIGINS'] = 'http://localhost:8080';
// Effectively disables throttling so tests are not order-dependent.
process.env['RATE_LIMIT_LIMIT'] = '10000';
