#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Azure Container Apps deployment - uses ACR Tasks (no local Docker required)
#
# Prerequisites:
#   - az CLI installed and logged in  (az login)
#   - Environment variables already set on the Container App
#     (az containerapp secret set / --env-vars) - not managed by this script
#
# Usage:
#   ./deploy.sh            # builds in ACR and deploys with git SHA tag
#   ./deploy.sh --no-build # skips build (re-deploys last pushed image)
# ---------------------------------------------------------------------------

REGISTRY_NAME="acrappsupportportal"
REGISTRY="$REGISTRY_NAME.azurecr.io"
IMAGE_NAME="app-support-portal"
RESOURCE_GROUP="app-support-portal"
CONTAINER_APP="ca-dev-app-support-portal"

TAG=$(git rev-parse --short HEAD)
FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$TAG"

NO_BUILD=false
for arg in "$@"; do
  [[ "$arg" == "--no-build" ]] && NO_BUILD=true
done

if [[ "$NO_BUILD" == false ]]; then
  echo "Queuing build in ACR ($TAG) - no local Docker required..."

  # --no-wait avoids streaming logs (which crashes az CLI on Windows due to
  # unicode characters in Next.js build output). We poll status instead.
  az acr build \
    --registry "$REGISTRY_NAME" \
    --image "$IMAGE_NAME:$TAG" \
    --image "$IMAGE_NAME:latest" \
    --platform linux/amd64 \
    --no-wait \
    . 2>&1

  echo "Waiting for ACR build to complete..."
  while true; do
    STATUS=$(az acr task list-runs \
      --registry "$REGISTRY_NAME" \
      --top 1 \
      --query "[0].status" \
      --output tsv 2>/dev/null)

    echo "  Build status: $STATUS"

    if [[ "$STATUS" == "Succeeded" ]]; then
      echo "Build succeeded."
      break
    elif [[ "$STATUS" == "Failed" || "$STATUS" == "Error" || "$STATUS" == "Canceled" ]]; then
      echo "Build failed with status: $STATUS"
      echo "View logs: az acr task list-runs --registry $REGISTRY_NAME"
      exit 1
    fi

    sleep 15
  done
else
  echo "Skipping build -- deploying existing image: $FULL_IMAGE"
fi

echo "Updating Container App to $FULL_IMAGE ..."
az containerapp update \
  --name "$CONTAINER_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --image "$FULL_IMAGE" \
  --output none

echo ""
echo "Deployed $FULL_IMAGE to $CONTAINER_APP"
echo ""

az containerapp show \
  --name "$CONTAINER_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv | xargs -I{} echo "  App URL: https://{}"
