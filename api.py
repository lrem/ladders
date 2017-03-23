import flask # type:ignore
import os
import sqlite3
import trueskill
import typing
import logging
import collections
app = flask.Flask(__name__)

@app.route("/<ladder>/settings", methods=["POST"])
def settings(ladder:str) -> flask.Response:
    """Create a new ladder or change its settings."""
    if not require(["name"]):
        flask.abort(400)
    r = flask.request
    c = flask.g.dbh.cursor()
    c.execute("replace into ladders (name, mu, sigma, tau, "
            "draw_probability) values (?, ?, ?, ?, ?)", 
            [r["name"], r.get("mu", 1200), r.get("sigma", 200),
                r.get("tau", 12), r.get("draw_probability", 0)])
    return flask.jsonify({'result': 'ok'}), 201

@app.route("/<ladder>/game", methods=['POST'])
def submit(ladder:str) -> flask.Response:
    """Submit game results."""
    if not require(["outcome"]):
        flask.abort(400)
    c = flask.g.dbh.cursor()
    c.execute("select mu, sigma, tau, draw_probability "
            "from ladders where name=?", [ladder])
    settings = c.fetchone()
    with flask.g.dbh:  # Automatically commit/rollback.
        c.execute("insert into games (ladder) values (?)", [ladder])
        game = c.lastrowid
        print("Outcome:")
        for position, members in enumerate(flask.request.json["outcome"]):
            print("Tier %d members: %s" % (position, members))
            for member in members:
                name = member["name"]
                c.execute("select count(*) from players where name = ?",
                        [name])
                if c.fetchone()[0] == 0:
                   c.execute("insert into players (name, ladder, mu, sigma) "
                             "values (?,?,?,?)", [name, ladder,
                                 settings["mu"], settings["sigma"]])
                c.execute("insert into participants (game, player, position) "
                        "values (?, ?, ?)", [game, name, position])
    return flask.jsonify({'result': 'ok'}), 201

@app.route("/<ladder>/ranking", methods=['GET'])
def ranking(ladder:str) -> flask.Response:
    """Get the players ranked by their skill."""
    if not ladder_exists(ladder):
        return flask.jsonify({"exists": False})
    recalculate(ladder)
    c = flask.g.dbh.cursor()
    c.execute("select name, mu from players where ladder = ? "
            "order by mu desc", [ladder])
    result = {
        "exists": True,
        "ranking": [dict(player) for player in c.fetchall()]
        }
    return flask.jsonify(result)

@app.before_request
def before_request() -> None:
    flask.g.dbh = sqlite3.connect("ladders.db")
    flask.g.dbh.row_factory = sqlite3.Row

@app.after_request
def allow_cross_domain(response:flask.Response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'content-type'
    return response

@app.teardown_request
def teardown_request(exception:typing.Any) -> None:
    flask.g.dbh.close()

def require(fields:typing.Iterable[str]) -> bool:
    """Verify that request contains json with specified fields."""
    return flask.request.get_json(True) and all(
            field in flask.request.json for field in fields)

def ladder_exists(ladder:str) -> bool:
    """Check whether a ladder already exists."""
    return flask.g.dbh.execute('select count(*) from ladders where name = ?',
                               [ladder]).fetchone()[0] > 0

def recalculate(ladder:str) -> None:
    c = flask.g.dbh.cursor()
    c.execute("select mu, sigma, tau, draw_probability, last_ranking "
              "from ladders where name = ?", [ladder])
    l = c.fetchone()
    ts = trueskill.TrueSkill(mu=l["mu"], sigma=l["sigma"], tau=l["tau"],
                             draw_probability=l["draw_probability"])
    c.execute("select id, timestamp from games "
              "where ladder=? and timestamp>?",
              [ladder, l["last_ranking"]])
    players = {}  # type: Dict[str, trueskill.Rating]
    max_timestamp = 0
    for game, timestamp in c.fetchall():
        logging.info("Processing game %d at timestamp %d", game, timestamp)
        logging.info("%d %d %s", timestamp, l["last_ranking"],
                timestamp > l["last_ranking"])
        max_timestamp = max(max_timestamp, timestamp)
        c.execute("select player, position from participants "
                  "where game = ?", [game])
        names, skills, positions = [], [], []
        for player, position in c.fetchall():
            logging.info("%d: %s" % (position, player))
            if player not in players:
                c.execute("select mu, sigma from players "
                          "where name = ?", [player])
                p = c.fetchone()
                logging.info("Fetched player %s skill %s", player, p)
                players[player] = ts.create_rating(p["mu"], p["sigma"])
            names.append(player)
            skills.append([players[player]])
            positions.append(position)
        new_ranks = ts.rate(skills, ranks=positions)
        for player, skill in zip(names, new_ranks):
            players[player] = skill[0]
    with flask.g.dbh:  # Automatically commit/rollback.
        if max_timestamp > 0:
            c.execute('update ladders set last_ranking = ? where name = ?',
                      [max_timestamp, ladder])
        for name in players:
            c.execute('update players set mu = ?, sigma = ? where name = ?',
                      [players[name].mu, players[name].sigma, name])

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if not os.path.exists("ladders.db"):
        dbh = sqlite3.connect("ladders.db")
        with open("ladders.sql") as schema:
            dbh.cursor().executescript(schema.read())
    app.run(debug=True)
