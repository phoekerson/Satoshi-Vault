#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   RPC=https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
#   ACCOUNT=/home/caleb/satoshi_vault/account.json \
#   KEYSTORE=/home/caleb/satoshi_vault/key.json \
#   bash /home/caleb/satoshi_vault/scripts/deploy_starkli_sepolia.sh

ROOT_DIR="/home/caleb/satoshi_vault"
RPC="${RPC:-https://starknet-sepolia.public.blastapi.io/rpc/v0_7}"
ACCOUNT="${ACCOUNT:?Set ACCOUNT to your starkli account json path}"
KEYSTORE="${KEYSTORE:?Set KEYSTORE to your keystore json path}"

echo "==> Build all contract packages"
pushd "$ROOT_DIR/contracts/staking_vault" >/dev/null && scarb build && popd >/dev/null
pushd "$ROOT_DIR/contracts/game_engine" >/dev/null && scarb build && popd >/dev/null
pushd "$ROOT_DIR/contracts/privacy_layer" >/dev/null && scarb build && popd >/dev/null
pushd "$ROOT_DIR/contracts/payment_router" >/dev/null && scarb build && popd >/dev/null

echo "==> Resolve Sierra artifacts"
STAKING_SIERRA=$(find "$ROOT_DIR/contracts/staking_vault/target/dev" -maxdepth 1 -name "*.sierra.json" -print -quit)
GAME_SIERRA=$(find "$ROOT_DIR/contracts/game_engine/target/dev" -maxdepth 1 -name "*.sierra.json" -print -quit)
PRIV_SIERRA=$(find "$ROOT_DIR/contracts/privacy_layer/target/dev" -maxdepth 1 -name "*.sierra.json" -print -quit)
ROUTER_SIERRA=$(find "$ROOT_DIR/contracts/payment_router/target/dev" -maxdepth 1 -name "*.sierra.json" -print -quit)

for f in "$STAKING_SIERRA" "$GAME_SIERRA" "$PRIV_SIERRA" "$ROUTER_SIERRA"; do
  if [ -z "$f" ] || [ ! -f "$f" ]; then
    echo "Missing Sierra artifact: $f" >&2
    exit 1
  fi
done

echo "==> Declare classes"
parse_ch() { awk '/Class hash:/ {print $3}'; }
STAKING_CLASS_HASH=$(starkli declare "$STAKING_SIERRA" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_ch)
GAME_CLASS_HASH=$(starkli declare "$GAME_SIERRA" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_ch)
PRIV_CLASS_HASH=$(starkli declare "$PRIV_SIERRA" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_ch)
ROUTER_CLASS_HASH=$(starkli declare "$ROUTER_SIERRA" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_ch)

echo "STAKING_CLASS_HASH=$STAKING_CLASS_HASH"
echo "GAME_CLASS_HASH=$GAME_CLASS_HASH"
echo "PRIV_CLASS_HASH=$PRIV_CLASS_HASH"
echo "ROUTER_CLASS_HASH=$ROUTER_CLASS_HASH"

echo "==> Deploy contracts"
parse_addr() { awk '/Contract address:/ {print $3}'; }
ADMIN=$(starkli account address --account "$ACCOUNT")
APY=300
MIN_STAKE=1000
MAX_STAKE=21000000000000
NFT_ADDR=0

STAKING_ADDR=$(starkli deploy "$STAKING_CLASS_HASH" "$ADMIN" "$APY" "$MIN_STAKE" "$MAX_STAKE" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_addr)
GAME_ADDR=$(starkli deploy "$GAME_CLASS_HASH" "$ADMIN" "$STAKING_ADDR" "$NFT_ADDR" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_addr)
PRIV_ADDR=$(starkli deploy "$PRIV_CLASS_HASH" "$ADMIN" "$STAKING_ADDR" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_addr)
ROUTER_ADDR=$(starkli deploy "$ROUTER_CLASS_HASH" "$ADMIN" "$STAKING_ADDR" "$GAME_ADDR" "$PRIV_ADDR" --rpc "$RPC" --account "$ACCOUNT" --keystore "$KEYSTORE" | parse_addr)

echo "==> Deployed addresses"
echo "ADMIN=$ADMIN"
echo "STAKING_VAULT=$STAKING_ADDR"
echo "GAME_ENGINE=$GAME_ADDR"
echo "PRIVACY_LAYER=$PRIV_ADDR"
echo "PAYMENT_ROUTER=$ROUTER_ADDR"

echo "==> Save outputs"
mkdir -p "$ROOT_DIR/deployments" "$ROOT_DIR/frontend"
cat > "$ROOT_DIR/deployments/sepolia.json" <<JSON
{
  "network": "sepolia",
  "admin": "$ADMIN",
  "staking_vault": { "class_hash": "$STAKING_CLASS_HASH", "address": "$STAKING_ADDR" },
  "game_engine":   { "class_hash": "$GAME_CLASS_HASH",    "address": "$GAME_ADDR" },
  "privacy_layer": { "class_hash": "$PRIV_CLASS_HASH",    "address": "$PRIV_ADDR" },
  "payment_router":{ "class_hash": "$ROUTER_CLASS_HASH",  "address": "$ROUTER_ADDR" }
}
JSON

cat > "$ROOT_DIR/frontend/.env.local" <<ENV
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_STAKING_VAULT_ADDRESS=$STAKING_ADDR
NEXT_PUBLIC_GAME_ENGINE_ADDRESS=$GAME_ADDR
NEXT_PUBLIC_PRIVACY_LAYER_ADDRESS=$PRIV_ADDR
NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS=$ROUTER_ADDR
ENV

echo "==> Done. Addresses saved to $ROOT_DIR/deployments/sepolia.json and frontend/.env.local"


