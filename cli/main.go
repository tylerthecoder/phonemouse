package main

import (
	"fmt"
	"log"
	"os/exec"
	"time"

	"github.com/go-vgo/robotgo"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type MouseCommand struct {
	Type string  `json:"type"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
}


func main() {
	// Generate unique ID for this session
	sessionID := uuid.New().String()
	baseURL := "6068-23-93-71-96.ngrok-free.app"

	websocketURL := fmt.Sprintf("wss://%s/ws?id=%s", baseURL, sessionID)
	webappURL := fmt.Sprintf("http://%s?id=%s", baseURL, sessionID)

	fmt.Println(websocketURL)

	// Create QR code with the webapp URL
	cmd := exec.Command("qrencode", "-t", "ansiutf8", webappURL)

	output, err := cmd.Output()
	if err != nil {
		fmt.Printf("Error generating QR code: %v\n", err)
		fmt.Println("Make sure qrencode is installed on your system.")
		return
	}

	// Print the QR code and instructions
	fmt.Printf("Scan this QR code with your phone:\n%s\n", output)
	fmt.Printf("Or visit: %s\n", webappURL)
	fmt.Println("Program will exit after 1 minute")

	// Connect to WebSocket server
	c, _, err := websocket.DefaultDialer.Dial(websocketURL, nil)
	if err != nil {
		log.Fatal("WebSocket dial error:", err)
	}
	defer c.Close()

	// Create timer to exit after 1 minute
	timer := time.NewTimer(1 * time.Minute)
	done := make(chan bool)

	// Listen for commands in a goroutine
	go func() {
		for {
			var cmd MouseCommand
			err := c.ReadJSON(&cmd)
			if err != nil {
				log.Println("read error:", err)
				done <- true
				return
			}

			// Execute mouse movement
			if cmd.Type == "move" {
				robotgo.MoveRelative(int(cmd.X), int(cmd.Y))
			}
		}
	}()

	// Wait for either timer or websocket error
	select {
	case <-timer.C:
		fmt.Println("Time's up! Exiting...")
		return
	case <-done:
		return
	}
}
