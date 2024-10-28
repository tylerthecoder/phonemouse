.PHONY: install run-server run-cli serve-web all clean build-ui

# Install required Go packages and UI dependencies
install:
	go mod tidy
	@echo "Installing qrencode..."
	@if command -v apt-get >/dev/null; then \
		sudo apt-get install -y qrencode; \
	elif command -v brew >/dev/null; then \
		brew install qrencode; \
	else \
		echo "Please install qrencode manually for your system"; \
	fi
	@echo "Installing UI dependencies..."
	cd ui && npm install

# Build the UI
build-ui:
	@echo "Building UI..."
	cd ui && npm run build

# Run the WebSocket server
run-server: build-ui
	@echo "Starting server on :8080..."
	go run server/main.go

# Run the CLI application
run-cli:
	@echo "Starting CLI application..."
	go run cli/main.go

# Serve the web interface using Python's HTTP server
serve-web:
	@echo "Starting web server on :8000..."
	python3 -m http.server 8000

# Build the applications
build: build-ui
	go build -o bin/server server/main.go
	go build -o bin/cli cli/main.go

# Clean built binaries and UI dist
clean:
	rm -rf bin/
	rm -rf ui/dist/

# Show help
help:
	@echo "Available commands:"
	@echo "  make install    - Install required dependencies"
	@echo "  make run-server - Start the server (builds UI first)"
	@echo "  make run-cli    - Start the CLI application"
	@echo "  make build      - Build the applications and UI"
	@echo "  make clean      - Remove built binaries and UI dist"

# Default target
all: install build
