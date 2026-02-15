package websocket

// Hub manages active WebSocket connections for chat
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

// Client represents a WebSocket connection
type Client struct {
	conn *websocket.Conn
	send chan []byte
}

// NewHub creates a new chat hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {



















}	}		}			}				}					delete(h.clients, client)					close(client.send)				default:				case client.send <- message:				select {			for client := range h.clients {		case message := <-h.broadcast:			}				close(client.send)				delete(h.clients, client)			if _, ok := h.clients[client]; ok {		case client := <-h.unregister:			h.clients[client] = true		case client := <-h.register: