#Use to create local host
import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
      ".js": "application/javascript",
      ".css": "text/css"
})

http = socketserver.TCPServer(("localhost", PORT), Handler)
print(f'listening on http://localhost:{PORT}')
http.serve_forever()