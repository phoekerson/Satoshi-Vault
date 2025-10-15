import sepolia from '../../deployments/sepolia.json';

type Deployments = typeof sepolia;

const env = {
  STAKING_VAULT: process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS,
  GAME_ENGINE: process.env.NEXT_PUBLIC_GAME_ENGINE_ADDRESS,
  PRIVACY_LAYER: process.env.NEXT_PUBLIC_PRIVACY_LAYER_ADDRESS,
  PAYMENT_ROUTER: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS,
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_ADDRESS,
};

const network = process.env.NEXT_PUBLIC_NETWORK || 'sepolia';

function getFromDeployments(deployments: Deployments) {
  return {
    STAKING_VAULT: deployments.staking_vault.address,
    GAME_ENGINE: deployments.game_engine.address,
    PRIVACY_LAYER: deployments.privacy_layer.address,
    PAYMENT_ROUTER: deployments.payment_router.address,
    ADMIN: deployments.admin,
  };
}

export const ADDRESSES = (() => {
  // Prefer env, fallback to deployments
  const fromEnv = {
    STAKING_VAULT: env.STAKING_VAULT,
    GAME_ENGINE: env.GAME_ENGINE,
    PRIVACY_LAYER: env.PRIVACY_LAYER,
    PAYMENT_ROUTER: env.PAYMENT_ROUTER,
    ADMIN: env.ADMIN,
  };

  const missing = Object.values(fromEnv).some((v) => !v);
  if (!missing) {
    return fromEnv as Required<typeof fromEnv>;
  }

  if (network === 'sepolia') {
    return getFromDeployments(sepolia as Deployments);
  }

  throw new Error('Missing contract addresses: set env vars or add deployments for network');
})();

export const NETWORK = network;

