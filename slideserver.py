#!/usr/bin/python3

# Make sure your gevent version is >= 1.0
import gevent
from gevent.pywsgi import WSGIServer
from gevent.queue import Queue

from flask import Flask, request, redirect, url_for, render_template
from flask import Response

import time


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
subscriptions = []  #TODO remove global variables to allow multithreaded operations (redis ?)
lastmessage = ""

# Client code consumes like this.
@app.route("/")
def index():
    return render_template('example.html')

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

###
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://127.0.0.1:5001'
    response.headers['Access-Control-Allow-Origin'] = 'null' #for local operation
    if request.method == 'OPTIONS':
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, GET, POST, PUT'
        headers = request.headers.get('Access-Control-Request-Headers')
        if headers:
            response.headers['Access-Control-Allow-Headers'] = headers
    return response


if __name__ == "__main__":
    app.debug = True
    app.after_request(add_cors_headers)
    server = WSGIServer(("", 5001), app)
    print("Server ready.. Serving..")
    server.serve_forever()
    # Then visit http://localhost:5001 to subscribe
    # and send messages by visiting http://localhost:5001/s/action
