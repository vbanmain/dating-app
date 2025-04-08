#!/bin/bash

# Push to GitHub repository using access token
# Usage: ./push-to-github.sh <github_username> <personal_access_token>

if [ "$#" -ne 2 ]; then
    echo "Usage: ./push-to-github.sh <github_username> <personal_access_token>"
    exit 1
fi

USERNAME=$1
TOKEN=$2

echo "Pushing to GitHub repository..."

# Set the correct remote URL with embedded credentials
git remote remove origin
git remote add origin https://${USERNAME}:${TOKEN}@github.com/vbanmain/dating-app.git

# Push to the remote repository
git push -u origin main

# Remove the sensitive remote (with token) and replace with a clean one
git remote remove origin
git remote add origin https://github.com/vbanmain/dating-app.git

echo "Push completed."