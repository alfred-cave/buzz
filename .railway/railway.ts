import {
  bucket,
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  redis,
  service,
} from "railway/iac";

const buzzSource = github("alfred-cave/buzz", {
  branch: "main",
});

const dockerBuild = {
  builder: "DOCKERFILE" as const,
  buildEnvironment: "V3" as const,
  dockerfilePath: "Dockerfile",
};

export default defineRailway(() => {
  const database = postgres("Postgres");
  const cache = redis("Redis");
  const media = bucket("Buzz Media", { region: "iad" });

  const pairingRelay = service("Pairing Relay", {
    source: buzzSource,
    build: dockerBuild,
    start: "/usr/local/bin/buzz-pair-relay",
    networking: {
      privateNetworkEndpoint: "pairing-relay",
      serviceDomains: {
        "pairing-relay-production-477f.up.railway.app": { port: 5000 },
      },
    },
    env: {
      BUZZ_PAIR_RELAY_BIND_ADDR: "0.0.0.0:5000",
      PORT: "5000",
    },
  });

  const relay = service("Buzz Relay", {
    source: buzzSource,
    build: dockerBuild,
    healthcheck: "/_readiness",
    healthcheckTimeout: 300,
    networking: {
      privateNetworkEndpoint: "buzz-relay",
      serviceDomains: {
        "buzz-relay-production-86ca.up.railway.app": { port: 3000 },
      },
    },
    env: {
      BUZZ_ALLOW_NIP_OA_AUTH: "true",
      BUZZ_AUTO_MIGRATE: "true",
      BUZZ_BIND_ADDR: "0.0.0.0:3000",
      BUZZ_CORS_ORIGINS: `tauri://localhost,http://tauri.localhost,https://\${{RAILWAY_PUBLIC_DOMAIN}}`,
      BUZZ_GIT_CONFORMANCE_PROBE: "true",
      BUZZ_GIT_HOOK_HMAC_SECRET: preserve(),
      BUZZ_MEDIA_BASE_URL: `https://\${{RAILWAY_PUBLIC_DOMAIN}}/media`,
      BUZZ_PAIRING_RELAY_URL: preserve(),
      BUZZ_RELAY_PRIVATE_KEY: preserve(),
      BUZZ_REQUIRE_AUTH_TOKEN: "true",
      BUZZ_REQUIRE_RELAY_MEMBERSHIP: "true",
      BUZZ_S3_ACCESS_KEY: preserve(),
      BUZZ_S3_ADDRESSING_STYLE: "virtual",
      BUZZ_S3_BUCKET: preserve(),
      BUZZ_S3_ENDPOINT: preserve(),
      BUZZ_S3_REGION: preserve(),
      BUZZ_S3_SECRET_KEY: preserve(),
      DATABASE_URL: database.env.DATABASE_URL,
      PORT: "3000",
      REDIS_URL: cache.env.REDIS_URL,
      RELAY_OWNER_PUBKEY:
        "e775e6bdb17b90b33ca43268f291e210552f4383c7d9ebb98f77dd44759f50cb",
      RELAY_URL: `wss://\${{RAILWAY_PUBLIC_DOMAIN}}`,
      RUST_LOG:
        "buzz_relay=info,buzz_db=info,buzz_auth=info,buzz_pubsub=info,tower_http=info",
    },
  });

  return project("buzz-self-hosted", {
    resources: [database, cache, media, pairingRelay, relay],
  });
});
