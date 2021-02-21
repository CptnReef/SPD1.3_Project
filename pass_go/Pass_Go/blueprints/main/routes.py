from flask import Blueprint, render_template, url_for
import os, json

Main_Blueprint = Blueprint('main', __name__, template_folder='templates')


@Main_Blueprint.route('/', methods=['GET'])
def home():
    return render_template("home.html")


@Main_Blueprint.route('/go', methods=['GET'])
def go():

    # Get Game Title List
    gameDirectoryList = os.listdir("./Pass_Go/static/games")
    games = []

    for game in gameDirectoryList:
        games.append({
            "title": game,
            "imageUrl": f"/games/{game}/title-image.png"
        })

    context = {"games": games}

    return render_template("video_chat.html", **context)


@Main_Blueprint.route('/get_game_url/<gameindex>', methods=['GET'])
def get_game_url(gameindex):

    gameDirectoryList = os.listdir("./Pass_Go/static/games")
    game = gameDirectoryList[int(gameindex)]
    game_url = json.dumps(
        {"url": url_for("static", filename=f"games/{game}/game.html")})

    return game_url
