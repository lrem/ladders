"""Backend server of Ladders, exposing a JSON api."""
import os
import sqlite3
import logging
import typing
from collections import defaultdict

import flask  # type:ignore
import oauth2client.client
import oauth2client.crypt
import trueskill

app = flask.Flask(__name__)

ACCEPTED_OAUTH_CLIENTS = (
    # The web frontend:
    '151187347955-v66j53n6mavb5mahpaq77q4k8fk1g588.apps.googleusercontent.com',
)


@app.route('/api/<ladder>/create', methods=['POST'])
def create(ladder: str) -> flask.Response:
    """Create a new ladder."""
    req = flask.request
    if not require(['name']) or req.json['name'] != ladder:
        flask.abort(400)
    try:
        user_id = get_uid()
    except oauth2client.crypt.AppIdentityError:
        flask.abort(401)
    cursor = flask.g.dbh.cursor()
    with flask.g.dbh:
        cursor.execute('insert into ladders (name, mu, sigma, beta, tau, '
                       'teams_count, players_per_team, '
                       'draw_probability) values (?, ?, ?, ?, ?, ?, ?, ?)',
                       [req.json['name'],
                        req.json.get('mu', 1200),
                        req.json.get('sigma', 400),
                        req.json.get('beta', 200),
                        req.json.get('tau', 4),
                        req.json.get('teams_count', 2),
                        req.json.get('players_per_team', 1),
                        req.json.get('draw_probability', 0)])
        cursor.execute('insert into owners (user_id, ladder) values (?, ?)',
                       [user_id, ladder])
    return flask.jsonify({'result': 'ok'}), 201


@app.route('/api/<ladder>/settings', methods=['POST'])
def settings(ladder: str) -> flask.Response:
    """Change settings of a ladder."""
    req = flask.request
    if not require(['name']) or req.json['name'] != ladder:
        flask.abort(400)
    if not owned(ladder):
        flask.abort(401)
    cursor = flask.g.dbh.cursor()
    with flask.g.dbh:
        cursor.execute('update ladders set mu=?, sigma=?, tau=?, '
                       'teams_count=?, players_per_team=?, '
                       'draw_probability=?, last_ranking=? where name =?',
                       [
                           req.json.get('mu', 1200),
                           req.json.get('sigma', 400),
                           req.json.get('beta', 200),
                           req.json.get('tau', 4),
                           req.json.get('teams_count', 2),
                           req.json.get('players_per_team', 1),
                           req.json.get('draw_probability', 0),
                           0,
                           req.json['name']
                       ])
        cursor.execute(
            'update players set mu=?, sigma=? where ladder=?',
            [
                req.json.get('mu', 1200),
                req.json.get('sigma', 400),
                ladder
            ])
    return flask.jsonify({'result': 'ok'}), 201


@app.route('/api/<ladder>/game', methods=['POST'])
def submit(ladder: str) -> flask.Response:
    """Submit game results."""
    if not require(['outcome']):
        flask.abort(400)
    cursor = flask.g.dbh.cursor()
    cursor.execute('select mu, sigma, tau, draw_probability '
                   'from ladders where name=?', [ladder])
    conf = cursor.fetchone()
    with flask.g.dbh:  # Automatically commit/rollback.
        cursor.execute('insert into games (ladder) values (?)', [ladder])
        game = cursor.lastrowid
        print('Outcome:')
        for position, members in enumerate(flask.request.json['outcome']):
            print('Tier %d members: %s' % (position, members))
            for member in members:
                name = member['name']
                if not name:
                    flask.abort(400)
                cursor.execute('select count(*) from players where name=?'
                               ' and ladder=?', [name, ladder])
                if cursor.fetchone()[0] == 0:
                    cursor.execute(
                        'insert into players (name, ladder, mu, sigma) '
                        'values (?,?,?,?)',
                        [name, ladder, conf['mu'], conf['sigma']])
                cursor.execute(
                    'insert into participants (game, player, position) '
                    'values (?, ?, ?)', [game, name, position])
    return flask.jsonify({'result': 'ok'}), 201


@app.route('/api/<ladder>/remove', methods=['POST'])
def remove(ladder: str) -> flask.Response:
    """Remove a game from the history."""
    if not owned(ladder):
        flask.abort(401)
    if not require(['id']):
        flask.abort(400)
    gid = flask.request.json['id']
    with flask.g.dbh:  # Automatically commit/rollback.
        cursor = flask.g.dbh.cursor()
        cursor.execute('select ladder from games where id = ?', [gid])
        row = cursor.fetchone()
        if row['ladder'] != ladder:
            logging.info("Attempt to remove a game from another ladder "
                         "(id %d is %s in request %s in database).",
                         gid, ladder, row['game'])
            flask.abort(401)
        cursor.execute('delete from games where id = ?', [gid])
        cursor.execute('delete from participants where game = ?', [gid])
        cursor.execute('update ladders set last_ranking = 0 where name = ?',
                       [ladder])
        cursor.execute('delete from players where ladder = ? '
                       'and name not in (select player from participants)',
                       [ladder])
        cursor.execute('select mu, sigma from ladders where name = ?',
                       [ladder])
        conf = cursor.fetchone()
        cursor.execute('update players set mu = ?, sigma = ? '
                       'where ladder = ?',
                       [conf['mu'], conf['sigma'], ladder])
    return flask.jsonify()


@app.route('/api/<ladder>/ranking', methods=['GET'])
def ranking(ladder: str) -> flask.Response:
    """Get the players ranked by their skill."""
    if not ladder_exists(ladder):
        return flask.jsonify({'exists': False})
    recalculate(ladder)
    cursor = flask.g.dbh.cursor()
    cursor.execute('select name, mu from players where ladder = ? '
                   'order by mu desc', [ladder])
    result = {
        'exists': True,
        'ranking': [dict(player) for player in cursor.fetchall()]
    }
    return flask.jsonify(result)


@app.route('/api/<ladder>/matches', methods=['GET'])
@app.route('/api/<ladder>/matches/<count>', methods=['GET'])
@app.route('/api/<ladder>/matches/<count>/<offset>', methods=['GET'])
def matches(ladder: str, count=42, offset=0) -> flask.Response:
    """Get the most recent matches."""
    if not ladder_exists(ladder):
        return flask.jsonify({'exists': False})
    cursor = flask.g.dbh.cursor()
    cursor.execute('select id, timestamp from games where ladder = ? '
                   'order by timestamp desc limit ? offset ?',
                   [ladder, count, offset])
    result = []
    for game in cursor.fetchall():
        gid, timestamp = game
        outcome: defaultdict[int, typing.List[str]] = defaultdict(list)
        cursor.execute('select position, player from participants '
                       'where game = ?', [gid])
        for entry in cursor.fetchall():
            outcome[entry[0]].append(entry[1])
        result.append({'timestamp': timestamp,
                       'id': gid,
                       'outcome': [outcome[i]
                                   for i in sorted(outcome.keys())]})
    return flask.jsonify({'exists': True, 'matches': result})


@app.route('/api/<ladder>/owned', methods=['POST'])
def ladder_owned(ladder: str) -> flask.Response:
    """Return whether the user is logged in and is the owner of the ladder."""
    return flask.jsonify(owned(ladder))


def owned(ladder: str) -> bool:
    """Return whether the user is logged in and is the owner of the ladder."""
    try:
        user_id = get_uid()
        cursor = flask.g.dbh.cursor()
        cursor.execute(
            'select count(*) from owners where user_id = ? and ladder = ?',
            [user_id, ladder])
        result = cursor.fetchone()[0] == 1
    except oauth2client.crypt.AppIdentityError as exception:
        logging.info('Auth exception: ' + str(exception))
        result = False
    return result


@app.route('/api/user/owned_by', methods=['POST'])
def owned_ladders():
    """Return a list of names of ladders owned by the user."""
    try:
        user_id = get_uid()
        cursor = flask.g.dbh.cursor()
        cursor.execute(
            'select ladder from owners where user_id = ?',
            [user_id])
        result = [row[0] for row in cursor.fetchall()]
    except oauth2client.crypt.AppIdentityError as exception:
        logging.info('Auth exception: ' + str(exception))
        result = []
    return flask.jsonify(result)


@app.route('/api/<ladder>/match_shape', methods=['GET'])
def match_shape(ladder: str) -> flask.Response:
    """Return the default team shape as stored in ladder settings."""
    if not ladder_exists(ladder):
        return flask.jsonify({'exists': False})
    cursor = flask.g.dbh.cursor()
    cursor.execute(
        'select teams_count, players_per_team from ladders where name=?',
        [ladder])
    shape = cursor.fetchone()
    return flask.jsonify({'exists': True,
                          'teams_count': shape['teams_count'],
                          'players_per_team': shape['players_per_team'],
                         })


@app.before_request
def before_request() -> None:
    """Hook to set up SQLite connection."""
    flask.g.dbh = sqlite3.connect('ladders.db')
    flask.g.dbh.row_factory = sqlite3.Row


@app.after_request
def allow_cross_domain(response: flask.Response):
    """Hook to set up response headers."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'content-type'
    return response


@app.teardown_request
def teardown_request(_exception: typing.Any) -> None:
    """Hook to close the SQLite connection."""
    flask.g.dbh.close()


def get_uid() -> str:
    """Extract user id from token received by POST."""
    if 'INTEGRATION_TEST' in os.environ:
        return "dummy_test_uid"
    if not 'idtoken' in flask.request.json:
        raise oauth2client.crypt.AppIdentityError('No OAauth2 token.')
    token = flask.request.json['idtoken']
    idinfo = oauth2client.client.verify_id_token(token, None)
    if idinfo['aud'] not in ACCEPTED_OAUTH_CLIENTS:
        raise oauth2client.crypt.AppIdentityError('Unrecognized client.')
    if idinfo['iss'] not in ['accounts.google.com',
                             'https://accounts.google.com']:
        raise oauth2client.crypt.AppIdentityError('Wrong issuer.')
    return idinfo['sub']


def require(fields: typing.Iterable[str]) -> bool:
    """Verify that request contains json with specified fields."""
    return flask.request.get_json(True) and all(
        field in flask.request.json for field in fields)


@app.route('/api/<ladder>/exists', methods=['GET'])
def exists_endpoint(ladder: str) -> flask.Response:
    """Return whether the ladder exists."""
    return flask.jsonify(ladder_exists(ladder))

def ladder_exists(ladder: str) -> bool:
    """Check whether a ladder already exists."""
    return flask.g.dbh.execute('select count(*) from ladders where name = ?',
                               [ladder]).fetchone()[0] > 0


def recalculate(ladder: str) -> None:
    """Update the ranking with all matches since last recalculate."""
    cursor = flask.g.dbh.cursor()
    cursor.execute('select mu, sigma, beta, tau, draw_probability, last_ranking '
                   'from ladders where name = ?', [ladder])
    conf = cursor.fetchone()
    tsh = trueskill.TrueSkill(mu=conf['mu'], sigma=conf['sigma'],
                              beta=conf['beta'], tau=conf['tau'],
                              draw_probability=conf['draw_probability'])
    cursor.execute('select id, timestamp from games '
                   'where ladder=? and timestamp>?',
                   [ladder, conf['last_ranking']])
    players: typing.Dict[str, trueskill.Rating] = {}
    max_timestamp = 0
    for game, timestamp in cursor.fetchall():
        logging.info('Processing game %d at timestamp %d', game, timestamp)
        logging.info('%d %d %s', timestamp, conf['last_ranking'],
                     timestamp > conf['last_ranking'])
        max_timestamp = max(max_timestamp, timestamp)
        cursor.execute('select player, position from participants '
                       'where game = ?', [game])
        names, skills, positions = [], [], []
        for player, position in cursor.fetchall():
            logging.info('%d: %s', position, player)
            if player not in players:
                cursor.execute('select mu, sigma from players '
                               'where name=? and ladder=?', [player, ladder])
                skill = cursor.fetchone()
                logging.info('Fetched player %s skill %s', player, skill)
                players[player] = tsh.create_rating(
                    skill['mu'], skill['sigma'])
            names.append(player)
            skills.append([players[player]])
            positions.append(position)
        new_ranks = tsh.rate(skills, ranks=positions)
        for player, skill in zip(names, new_ranks):
            players[player] = skill[0]
    with flask.g.dbh:  # Automatically commit/rollback.
        if max_timestamp > 0:
            cursor.execute('update ladders set last_ranking = ? '
                           'where name = ?', [max_timestamp, ladder])
        for name in players:
            cursor.execute('update players set mu = ?, sigma = ? '
                           'where name=? and ladder=?',
                           [players[name].mu, players[name].sigma, name,
                            ladder])


def main():
    """Main, a separate function for scoping."""
    logging.basicConfig(level=logging.INFO)
    if 'INTEGRATION_TEST' in os.environ:
        # Try to clean up a local debugging instance, ignore errors.
        try:
            os.remove('ladders.db')
        except (FileNotFoundError, PermissionError):
            pass
    if not os.path.exists('ladders.db'):
        dbh = sqlite3.connect('ladders.db')
        dbh.execute('PRAGMA foreign_keys = ON')
        with open('ladders.sql') as schema:
            dbh.cursor().executescript(schema.read())
    app.run(debug=True)


if __name__ == '__main__':
    main()
