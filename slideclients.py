#!/usr/bin/python3

from flask import Flask, request, redirect, url_for, render_template
from flask import Response

app = Flask(__name__,template_folder=".")

@app.route("/")
def index():
    return render_template('shells/mirror.html', url=url_for('view'))

@app.route("/stage")
def stage():
    return render_template('shells/onstage.html', url=url_for('view'))

@app.route("/phone")
def phone():
    return render_template('shells/phonestage.html', url=url_for('view'))

@app.route("/view")
def view():
    return render_template('template.html')

if __name__ == "__main__":
    app.debug = True
    app.run(host="0.0.0.0",port=5000)
    # Then visit http://localhost:5000
