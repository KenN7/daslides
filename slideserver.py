#!/usr/bin/python3

# Make sure your gevent version is >= 1.0
import gevent
from gevent.pywsgi import WSGIServer
from gevent.queue import Queue

from flask import Flask, request, redirect, url_for, render_template
from flask import Response
from flask_cors import CORS

import time

def check_apikey(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if (request.headers.get('X-SLIDE-KEY', None) == '1234'):
            return f(*args, **kwargs)
        else:
            return abort(401)
    return wrapper

# SSE "protocol" is described here: http://mzl.la/UPFyxY
class ServerSentEvent(object):
    def __init__(self, data):
        self.data = data
        self.event = None
        self.id = None

    def encode(self):
        if not self.data:
            return ""
        val = "data: %s\n\nevent: %s\n\nid: %s\n\n" % (self.data, self.event, self.id)
        print(val)
        return val

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

subscriptions = []  #TODO remove global variables to allow multithreaded operations (redis ?)
lastmessage = ""

# Client code consumes like this.

@app.route("/debug")
def debug():
    return "Currently %d subscriptions" % len(subscriptions)

@app.route("/where")
def where():
    return lastmessage

@app.route("/s/<action>")
def publish(action):
    def notify():
        global lastmessage
        msg = str(action)
        lastmessage = msg #update for new clients
        for sub in subscriptions:
            sub.put(msg)

    gevent.spawn(notify)
    return "OK"

@app.route("/subscribe")
def subscribe():
    def gen():
        q = Queue()
        subscriptions.append(q)
        try:
            while True:
                result = q.get()
                ev = ServerSentEvent(str(result))
                yield ev.encode()
        except GeneratorExit: # Or maybe use flask signals
            subscriptions.remove(q)
    return Response(gen(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.debug = True
    server = WSGIServer(("0.0.0.0", 5001), app)
    print("Server ready.. Serving.. on port 5001")
    server.serve_forever()
    # Then visit http://localhost:5001 to subscribe
    # and send messages by visiting http://localhost:5001/s/action
