# Build UI stage
FROM node:18 AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm install
COPY ui/ ./
RUN npm run build

# Build Go stage
FROM golang:1.23 AS go-builder
WORKDIR /app
COPY go.* ./
COPY server/ ./server/
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o bin/server server/main.go

# Final stage
FROM alpine:latest
WORKDIR /app

ENV STATIC_DIR=/app/ui/dist

# Copy built artifacts
COPY --from=ui-builder /app/ui/dist ./ui/dist/
COPY --from=go-builder /app/bin/server ./server/

EXPOSE 8080

CMD ["./server/server"]
