from Pass_Go.blueprints.user.views import User_Blueprint
from Pass_Go.sql_models import (
    User,
    Base
)
import os
import json
from flask import Flask, send_from_directory
from sqlalchemy import create_engine
from Pass_Go.config import Config
import datetime
from sqlalchemy.orm import sessionmaker


config = Config.get_instance()

app = Flask(__name__, static_folder="static")

app.config['SECRET_KEY'] = config.SECRET_KEY
app.config['RTC_SERVICE_URL'] = config.RTC_SERVICE_URL
app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


#### SQLALCHEMY SETUP ####
db_engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], echo=True)
# create metadata
Base.metadata.create_all(db_engine)
# create session
Session = sessionmaker(bind=db_engine)
db_session = Session()
db_session.commit()

#### ADD ROUTING ####

app.register_blueprint(User_Blueprint, url_prefix='/')


@app.after_request
def after_request(response):
    return response


@app.route("/favicon.ico")
def favicon():
    """Sends the favicon to the client"""
    return send_from_directory(os.path.join(app.root_path, "static"), "./favicon.ico")
