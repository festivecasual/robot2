import os
import json
import socket

import falcon


class SlotsResource:
    def on_get(self, req, resp):
        if not os.path.exists('/home/pi/data/slots'):
            with open('/home/pi/data/slots', 'w') as f:
                json.dump([
                    {'name': 'Slot 1', 'data': ''},
                    {'name': 'Slot 2', 'data': ''},
                    {'name': 'Slot 3', 'data': ''},
                    {'name': 'Slot 4', 'data': ''},
                    {'name': 'Slot 5', 'data': ''},
                    ], f)
        resp.stream = open('/home/pi/data/slots')
    
    def on_post(self, req, resp):
        with open('/home/pi/data/slots', 'w') as f:
            f.write(req.stream.read().decode())

class ProgramResource:
    def on_post(self, req, resp):
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.connect('/tmp/robot-control')

        data = json.loads(req.stream.read().decode())
        if data.get('stop'):
            sock.send('STOP\n'.encode())
            return

        program = data['program'].encode()
        sock.send('RUN\n'.encode())
        sock.send((str(len(program)) + '\n').encode())
        sock.send(program)
        sock.close()

def create_app():
    app = falcon.App()
    
    app.add_route('/api/slots', SlotsResource())
    app.add_route('/api/program', ProgramResource())

    return app
