# k6 Load Tests for RealWorld Backends

This package contains a k6 script to perform load testing on various RealWorld backend implementations found in the `examples` directory of the `rest-zod-openapi` project, or your custom `node-openapi` implementation.

## Prerequisites

1.  **Install k6**: You need to have k6 installed on your system. Follow the official installation guide: [https://k6.io/docs/getting-started/installation/](https://k6.io/docs/getting-started/installation/)
2.  **Running Backend Services**: Ensure the specific backend service you want to test is running. Each example application (e.g., `base-express`, `koa`) will have its own way to start, typically involving `pnpm install` and `pnpm dev` (or `pnpm start`) from its respective directory (e.g., `examples/base-express`). Refer to the README of each example.

## Test Script

A single, generic test script `scripts/realworld.k6.js` is used. It simulates common user workflows like registration, login, creating articles, listing articles, etc.

This script **requires** the target API endpoint to be set via the `BASE_URL` environment variable.

## Running Tests

Navigate to this package directory (`packages/k6-tests`) or run from the workspace root.

To run the test script, you **must** provide the `BASE_URL` of the target backend via an environment variable passed to the `k6 run` command.

### Using pnpm:

```bash
# From the root of the rest-zod-openapi workspace
# Example for base-express (assuming it runs on http://localhost:3000/api)
BASE_URL='http://localhost:3000/api' pnpm --filter k6-tests test

# Example for your node-openapi implementation on port 8080
BASE_URL='http://localhost:8080/api' pnpm --filter k6-tests test
```

### Running Directly with k6:

```bash
# Example for base-express (if it were on port 3000)
k6 run -e BASE_URL='http://localhost:3000/api' packages/k6-tests/scripts/realworld.k6.js

# Example for your custom node-openapi service on port 8080
k6 run -e BASE_URL='http://localhost:8080/api' packages/k6-tests/scripts/realworld.k6.js
```

**Important:** The script has a default `BASE_URL` of `http://localhost:3000/api` if the environment variable is not set, but relying on this is discouraged. Always explicitly set `BASE_URL` for clarity and correctness.

### Customizing Load

The k6 script (`scripts/realworld.k6.js`) defines a default load scenario in the `options` export. You can modify these options to change the number of virtual users (VUs), duration, stages, etc.

```javascript
// Example options in scripts/realworld.k6.js
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m', target: 20 }, // stay at 20 users
    { duration: '10s', target: 0 }, // ramp down to 0 users
  ],
};
```

Refer to the k6 documentation for more on options: [https://k6.io/docs/using-k6/options/](https://k6.io/docs/using-k6/options/)

## Comparing `base-express` with `node-openapi`

To compare `base-express` with your `node-openapi` implementation:

1.  Ensure your `base-express` example app is running (typically on `http://localhost:3000/api`).
2.  Ensure your `node-openapi` backend is running on its specific port (e.g., `http://localhost:YOUR_PORT/api`).
3.  Run the tests for both, ensuring you set the correct `BASE_URL` for each run:

    ```bash
    # Test base-express
    k6 run -e BASE_URL='http://localhost:3000/api' packages/k6-tests/scripts/realworld.k6.js

    # Test node-openapi (replace YOUR_PORT with the actual port)
    k6 run -e BASE_URL='http://localhost:YOUR_PORT/api' packages/k6-tests/scripts/realworld.k6.js
    ```

4.  Compare the output metrics (request rates, response times, error rates) from k6 for each test run.
