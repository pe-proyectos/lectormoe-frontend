import { Elysia } from 'elysia';

// All organizations are now served under capibaratraductor.com/{slug}
// This redirecter is kept as a stub in case it's needed in the future

const app = new Elysia()
  .listen(process.env.PORT || 3001);

console.log(`🚀 Redirecter server is running on port ${process.env.PORT || 3001}`);
