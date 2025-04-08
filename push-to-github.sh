#!/bin/bash

# Push to GitHub repository
# This script uses cached credentials or prompts for them

echo "Pushing to GitHub repository..."
echo "You might be prompted for your GitHub username and personal access token."

git push origin main

echo "Push completed."