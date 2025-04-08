#!/bin/bash

# Push to GitHub repository
# This script uses cached credentials or prompts for them

echo "Pushing to GitHub repository..."
echo "You might be prompted for your GitHub username and personal access token."

# Set the correct remote URL 
git remote remove origin
git remote add origin https://github.com/vbanmain/dating-app.git

# Push to the remote repository
git push -u origin main

echo "Push completed."