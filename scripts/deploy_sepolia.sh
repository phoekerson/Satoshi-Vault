#!/usr/bin/env bash
set -euo pipefail

# Config
PROFILE="sepolia"
DEPLOY_OUT_DIR="/home/caleb/satoshi_vault/deployments"
FRONT_ENV="/home/caleb/satoshi_vault/frontend/.env.local"
mkdir -p "$DEPLOY_OUT_DIR"

echo "==> Building contracts"
pushd /home/caleb/satoshi_vault/contracts/staking_vault >/dev/null
scarb build
STAKING_SIERRA="$(ls target/dev/*_staking_vault.sierra.json | head -n1 || true)"
STAKING_CLASS="$(ls target/dev/*_staking_vault.contract_class.json | head -n1 || true)"
popd >/dev/null

pushd /home/caleb/satoshi_vault/contracts/game_engine >/dev/null
scarb build
GAME_SIERRA="$(ls target/dev/*_game_engine.sierra.json | head -n1 || true)"
GAME_CLASS="$(ls target/dev/*_game_engine.contract_class.json | head -n1 || true)"
popd >/dev/null

pushd /home/caleb/satoshi_vault/contracts/privacy_layer >/dev/null
scarb build
PRIV_SIERRA="$(ls target/dev/*_privacy_layer.sierra.json | head -n1 || true)"
PRIV_CLASS="$(ls target/dev/*_privacy_layer.contract_class.json | head -n1 || true)"
popd >/dev/null

pushd /home/caleb/satoshi_vault/contracts/payment_router >/dev/null
scarb build
ROUTER_SIERRA="$(ls target/dev/*_payment_router.sierra.json | head -n1 || true)"
ROUTER_CLASS="$(ls target/dev/*_payment_router.contract_class.json | head -n1 || true)"
popd >/dev/null

for f in "$STAKING_SIERRA" "$GAME_SIERRA" "$PRIV_SIERRA" "$ROUTER_SIERRA"; do
  if [ -z "$f" ] || [ ! -f "$f" ]; then
    echo "Missing Sierra artifact for one of the contracts. Aborting." >&2
    exit 1
  fi
done

echo "==> Declare classes"
STAKING_CLASS_HASH=$(sncast --profile "$PROFILE" declare --contract "$STAKING_SIERRA" --max-fee auto | awk '/class_hash/ {print $2}')
GAME_CLASS_HASH=$(sncast --profile "$PROFILE" declare --contract "$GAME_SIERRA" --max-fee auto | awk '/class_hash/ {print $2}')
PRIV_CLASS_HASH=$(sncast --profile "$PROFILE" declare --contract "$PRIV_SIERRA" --max-fee auto | awk '/class_hash/ {print $2}')
ROUTER_CLASS_HASH=$(sncast --profile "$PROFILE" declare --contract "$ROUTER_SIERRA" --max-fee auto | awk '/class_hash/ {print $2}')

echo "==> Deploy Staking Vault"
ADMIN="$(sncast --profile "$PROFILE" account address)"
APY=300  # 3.00% APY in basis points
MIN_STAKE=1000
MAX_STAKE=21000000000000
STAKING_ADDR=$(sncast --profile "$PROFILE" deploy --class-hash "$STAKING_CLASS_HASH" \
  --constructor-calldata "$ADMIN" "$APY" "$MIN_STAKE" "$MAX_STAKE" --max-fee auto | awk '/contract_address/ {print $2}')

echo "==> Deploy Game Engine"
NFT_ADDR=0x0
GAME_ADDR=$(sncast --profile "$PROFILE" deploy --class-hash "$GAME_CLASS_HASH" \
  --constructor-calldata "$ADMIN" "$STAKING_ADDR" "$NFT_ADDR" --max-fee auto | awk '/contract_address/ {print $2}')

echo "==> Deploy Privacy Layer"
PRIV_ADDR=$(sncast --profile "$PROFILE" deploy --class-hash "$PRIV_CLASS_HASH" \
  --constructor-calldata "$ADMIN" "$STAKING_ADDR" --max-fee auto | awk '/contract_address/ {print $2}')

echo "==> Deploy Payment Router"
ROUTER_ADDR=$(sncast --profile "$PROFILE" deploy --class-hash "$ROUTER_CLASS_HASH" \
  --constructor-calldata "$ADMIN" "$STAKING_ADDR" "$GAME_ADDR" "$PRIV_ADDR" --max-fee auto | awk '/contract_address/ {print $2}')

echo "==> Save deployment outputs"
cat > "$DEPLOY_OUT_DIR/sepolia.json" <<JSON
{
  "network": "sepolia",
  "admin": "$ADMIN",
  "staking_vault": {
    "class_hash": "$STAKING_CLASS_HASH",
    "address": "$STAKING_ADDR"
  },
  "game_engine": {
    "class_hash": "$GAME_CLASS_HASH",
    "address": "$GAME_ADDR"
  },
  "privacy_layer": {
    "class_hash": "$PRIV_CLASS_HASH",
    "address": "$PRIV_ADDR"
  },
  "payment_router": {
    "class_hash": "$ROUTER_CLASS_HASH",
    "address": "$ROUTER_ADDR"
  }
}
JSON

mkdir -p "/home/caleb/satoshi_vault/frontend"
cat > "$FRONT_ENV" <<ENV
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_STAKING_VAULT_ADDRESS=$STAKING_ADDR
NEXT_PUBLIC_GAME_ENGINE_ADDRESS=$GAME_ADDR
NEXT_PUBLIC_PRIVACY_LAYER_ADDRESS=$PRIV_ADDR
NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS=$ROUTER_ADDR
ENV

echo "==> Done. Addresses saved to $DEPLOY_OUT_DIR/sepolia.json and $FRONT_ENV"

