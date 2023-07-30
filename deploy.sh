echo "Packaging extension for submission to the Chrome Web Store."

zip -r ai4overleaf.zip ./* -x .git/**\* -x .gitignore -x deploy.sh -x README.md
