from http.server import HTTPServer, SimpleHTTPRequestHandler
from os import curdir, sep

class Serv(SimpleHTTPRequestHandler):
    extensions = {
        "html": "text/html",
        "css": "text/css",
        "js": "text/javascript",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "json": "application/json"
    }

    # Class variable to store the POST data
    post_data = None

    def do_GET(self):
        try:
            print("Requested path:", self.path)
            if self.path == '/':
                self.path = '/templates/CrudWorld.html'

            if self.path == '/favicon.ico':
                # Ignore requests for favicon.ico
                return

            if self.path == '/response':
                # Handle the GET request for the '/response' endpoint
                print("Stored POST data:", Serv.post_data)  # Print the value of Serv.post_data
                if Serv.post_data is not None:
                    # If there is POST data stored, echo it in the response
                    print("Echoing POST data in GET response:", Serv.post_data.decode('utf-8'))
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(Serv.post_data)
                else:
                    # If there is no POST data stored, respond with a message indicating that
                    response_data = b"No POST data available"
                    self.send_response(200)
                    self.send_header('Content-type', 'text/plain')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(response_data)
                return

            if self.path.endswith(tuple(self.extensions.keys())):
                # Serve HTML, CSS, JavaScript, and image files
                file_to_open = open(curdir + sep + self.path, 'rb')
                self.send_response(200)
                self.send_header('Content-type', self.get_content_type())
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(file_to_open.read())
                file_to_open.close()
                return
            else:
                raise IOError
        except IOError:
            self.send_error(404, 'File Not Found: %s' % self.path)

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            Serv.post_data = self.rfile.read(content_length)
            print("POST request data:", Serv.post_data.decode('utf-8'))

            # Respond with a 303 See Other redirect to the '/response' endpoint
            self.send_response(303)
            self.send_header('Location', '/response')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        except Exception as e:
            print("Error processing POST request:", e)
            self.send_error(500, 'Internal Server Error')

    def get_content_type(self):
        extension = self.path.split(".")[-1]
        return self.extensions.get(extension, "text/plain")

httpd = HTTPServer(('localhost', 8080), Serv)
print("Server started hosting at http://localhost:8080")
httpd.serve_forever()





