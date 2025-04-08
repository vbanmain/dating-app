#!/bin/bash

# Push to GitHub repository using access token
# Usage: ./push-to-github.sh <github_username> <personal_access_token> [--force]

if [ "$#" -lt 2 ]; then
    echo "Usage: ./push-to-github.sh <github_username> <personal_access_token> [--force]"
    echo "Add --force as a third parameter to force push (USE WITH CAUTION)"
    exit 1
fi

USERNAME=$1
TOKEN=$2
FORCE_PUSH=false

if [ "$#" -eq 3 ] && [ "$3" == "--force" ]; then
    FORCE_PUSH=true
    echo "Force push enabled - this will overwrite remote changes!"
fi

echo "Pushing to GitHub repository..."

# Set the correct remote URL with embedded credentials
git remote remove origin
git remote add origin https://${USERNAME}:${TOKEN}@github.com/vbanmain/dating-app.git

# Try to fetch first to see what's on the remote
git fetch origin

# Push to the remote repository
if [ "$FORCE_PUSH" = true ]; then
    echo "Force pushing to repository..."
    git push -u origin main --force
else
    echo "Regular pushing to repository..."
    git push -u origin main
fi

# Remove the sensitive remote (with token) and replace with a clean one
git remote remove origin
git remote add origin https://github.com/vbanmain/dating-app.git

echo "Push completed."