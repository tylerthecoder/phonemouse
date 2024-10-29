#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist

# Build CLI for different platforms
echo "Building CLI for multiple platforms..."

# Linux amd64
GOOS=linux GOARCH=amd64 go build -o dist/phone-mouse-cli-linux-amd64 cli/main.go

# MacOS amd64
GOOS=darwin GOARCH=amd64 go build -o dist/phone-mouse-cli-darwin-amd64 cli/main.go

# MacOS arm64 (M1/M2)
GOOS=darwin GOARCH=arm64 go build -o dist/phone-mouse-cli-darwin-arm64 cli/main.go

# Windows amd64
GOOS=windows GOARCH=amd64 go build -o dist/phone-mouse-cli-windows-amd64.exe cli/main.go

echo "CLI builds completed! Binaries are in the dist/ directory:"
ls -l dist/

# Make the files executable
chmod +x dist/phone-mouse-cli-*