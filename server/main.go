package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for demo
	},
}

type Client struct {
	ID   string
	Conn *websocket.Conn
}

var clients = make(map[string][]*websocket.Conn)
var clientsMutex sync.RWMutex

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	// Add client to the map
	clientsMutex.Lock()
	clients[id] = append(clients[id], conn)
	clientsMutex.Unlock()

	// Handle messages
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		// Broadcast message to all clients with the same ID
		clientsMutex.RLock()
		for _, client := range clients[id] {
			if client != conn { // Don't send back to sender
				err := client.WriteMessage(messageType, message)
				if err != nil {
					log.Println("Write error:", err)
				}
			}
		}
		clientsMutex.RUnlock()
	}

	// Remove client when disconnected
	clientsMutex.Lock()
	for i, c := range clients[id] {
		if c == conn {
			clients[id] = append(clients[id][:i], clients[id][i+1:]...)
			break
		}
	}
	clientsMutex.Unlock()
}

func main() {
	// Create a logging middleware
	loggingMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("%s %s %s\n", r.RemoteAddr, r.Method, r.URL)
			next.ServeHTTP(w, r)
		})
	}

	// Handle WebSocket connections
	http.Handle("/ws", loggingMiddleware(http.HandlerFunc(handleWebSocket)))

	staticDirPath := os.Getenv("STATIC_DIR")
	if staticDirPath == "" {
		staticDirPath = "../ui/dist"
	}
	staticDir := http.Dir(staticDirPath)
	indexPath := filepath.Join(string(staticDir), "index.html")
	log.Println("Serving index.html from", indexPath)
	absIndexPath, err := filepath.Abs(indexPath)
	if err != nil {
		log.Fatal("Failed to get index.html path:", err)
	}
	indexPath = absIndexPath
	log.Println("Absolute index.html path:", indexPath)

	// Serve static files from the UI dist directory
	fs := http.FileServer(staticDir)
	fileHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println("Serving file:", r.URL.Path)
		if r.URL.Path == "/" {
			log.Println("Serving index.html for", r.URL.Path)
			http.ServeFile(w, r, indexPath)
			return
		}
		// If the file doesn't exist, serve index.html
		if _, err := filepath.Rel(string(staticDir), filepath.Join(string(staticDir), r.URL.Path)); err != nil {
			log.Println("Serving index.html for", r.URL.Path)
			http.ServeFile(w, r, indexPath)
			return
		}
		fs.ServeHTTP(w, r)
	})
	http.Handle("/", loggingMiddleware(fileHandler))

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
