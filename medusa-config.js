import { loadEnv, Modules, defineConfig } from "@medusajs/utils";
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  MEILISEARCH_ADMIN_KEY,
  MEILISEARCH_HOST,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_FILE_URL,
  S3_REGION,
  S3_SECRET_KEY,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
} from "lib/constants";

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard"],
      },
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: Modules.FILE,
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: S3_FILE_URL,
              access_key_id: S3_ACCESS_KEY,
              secret_access_key: S3_SECRET_KEY,
              region: S3_REGION,
              bucket: S3_BUCKET,
              endpoint: S3_ENDPOINT,
            },
          },
        ],
      },
    },
    ...(REDIS_URL
      ? [
          {
            key: Modules.EVENT_BUS,
            resolve: "@medusajs/event-bus-redis",
            options: {
              redisUrl: REDIS_URL,
            },
          },
          {
            key: Modules.WORKFLOW_ENGINE,
            resolve: "@medusajs/workflow-engine-redis",
            options: {
              redis: {
                url: REDIS_URL,
              },
            },
          },
        ]
      : []),
    ...(RESEND_API_KEY && RESEND_FROM_EMAIL
      ? [
          {
            key: Modules.NOTIFICATION,
            resolve: "@medusajs/notification",
            options: {
              providers: [
                {
                  resolve: "./src/modules/email-notifications",
                  id: "resend",
                  options: {
                    channels: ["email"],
                    api_key: RESEND_API_KEY,
                    from: RESEND_FROM_EMAIL,
                  },
                },
              ],
            },
          },
        ]
      : []),
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET
      ? [
          {
            key: Modules.PAYMENT,
            resolve: "@medusajs/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: STRIPE_API_KEY,
                    webhookSecret: STRIPE_WEBHOOK_SECRET,
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
  plugins: [
    ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY
      ? [
          {
            resolve: "@rokmohar/medusa-plugin-meilisearch",
            options: {
              config: {
                host: MEILISEARCH_HOST,
                apiKey: MEILISEARCH_ADMIN_KEY,
              },
              settings: {
                products: {
                  type: "products",
                  enabled: true,
                  fields: [
                    "id",
                    "title",
                    "description",
                    "handle",
                    "variant_sku",
                    "thumbnail",
                  ],
                  indexSettings: {
                    searchableAttributes: [
                      "title",
                      "description",
                      "variant_sku",
                    ],
                    displayedAttributes: [
                      "id",
                      "handle",
                      "title",
                      "description",
                      "variant_sku",
                      "thumbnail",
                    ],
                    filterableAttributes: ["id", "handle"],
                  },
                  primaryKey: "id",
                },
              },
            },
          },
        ]
      : []),
  ],
};

console.log(JSON.stringify(medusaConfig, null, 2));
export default defineConfig(medusaConfig);
