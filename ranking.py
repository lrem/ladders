"""Maintain ranking of a ladder."""

import logging
import sqlite3
from typing import Any, Dict, List, Tuple

import trueskill


class Ranking(object):
    """A class to calculate ladder's ranking.
    """

    def __init__(self, ladder: str, dbh: sqlite3.Connection) -> None:
        self.ladder = ladder
        self.dbh = dbh
        self.cursor = dbh.cursor()
        self.players: Dict[str, Player] = {}
        self.tsh: trueskill.TrueSkill = None
        self.last_ranking = 0

    def standings(self) -> List[Any]:
        """Return the list of players on the ladder sorted by skill."""
        self.cursor.execute('select name, mu, games_count, wins_count '
                            'from players where ladder=? '
                            'order by mu desc', [self.ladder])
        return self.cursor.fetchall()

    def recalculate(self) -> None:
        """Update the ranking with all matches since last recalculate."""
        self._get_ladder()
        self.cursor.execute('select id, timestamp from games '
                            'where ladder=? and timestamp>?',
                            [self.ladder, self.last_ranking])
        for game_id, timestamp in self.cursor.fetchall():
            logging.info('Processing game %d at timestamp %d',
                         game_id, timestamp)
            logging.info('%d %d %s', timestamp, self.last_ranking,
                         timestamp > self.last_ranking)
            self.last_ranking = max(self.last_ranking, timestamp)
            names, skills, positions = self._get_game(game_id)
            new_ranks = self.tsh.rate(skills, ranks=positions)
            for player, skill in zip(names, new_ranks):
                self.players[player].rating = skill[0]
                self._record_history(player, skill[0], timestamp)
        self._update_ladder()

    def _get_ladder(self) -> None:
        """Get a TrueSkill object and the timestamp of the last game."""
        self.cursor.execute('select mu, sigma, beta, tau, draw_probability, last_ranking '
                            'from ladders where name = ?', [self.ladder])
        conf = self.cursor.fetchone()
        self.tsh = trueskill.TrueSkill(mu=conf['mu'], sigma=conf['sigma'],
                                       beta=conf['beta'], tau=conf['tau'],
                                       draw_probability=conf['draw_probability'])
        self.last_ranking = conf['last_ranking']

    def _get_game(self, game_id: int)-> Tuple[List[str], List[List[float]], List[int]]:
        self.cursor.execute('select player, position from participants '
                            'where game = ?', [game_id])
        names, skills, positions = [], [], []
        for player, position in self.cursor.fetchall():
            logging.info('%d: %s', position, player)
            if player not in self.players:
                self.players[player] = Player(player, self)
                self.players[player].load(self.cursor)
            names.append(player)
            skills.append([self.players[player].rating])
            positions.append(position)
            self.players[player].games_count += 1
            if position == 0:
                self.players[player].wins_count += 1
        return names, skills, positions

    def _record_history(self, player: str, skill: trueskill.Rating, timestamp: int) -> None:
        self.cursor.execute('insert into history (ladder, player, timestamp, '
                            'mu) values (?,?,?,?)', [self.ladder, player, timestamp, skill.mu])

    def _update_ladder(self) -> None:
        """Update ladder with the newly computed ratings and last timestamp."""
        with self.dbh:  # Automatically commit/rollback.
            if self.last_ranking > 0:
                self.cursor.execute('update ladders set last_ranking = ? '
                                    'where name = ?', [self.last_ranking, self.ladder])
            for name in self.players:
                self.players[name].save(self.cursor)

class Player(object):
    """Representation of ranking properties of a single player."""

    def __init__(self, name: str, ranking: Ranking) -> None:
        self.rating: trueskill.Rating = None
        self.name = name
        self.games_count = 0
        self.wins_count = 0
        self.ranking = ranking

    def load(self, cursor: sqlite3.Cursor) -> None:
        """Load the properties from the provided database cursor."""
        cursor.execute('select mu, sigma, games_count, wins_count from players '
                       'where name=? and ladder=?', [self.name, self.ranking.ladder])
        loaded = cursor.fetchone()
        logging.info('Fetched player %s skill %s', self.name, loaded['mu'])
        self.rating = self.ranking.tsh.create_rating(loaded['mu'], loaded['sigma'])
        self.games_count = loaded['games_count']
        self.wins_count = loaded['wins_count']

    def save(self, cursor: sqlite3.Cursor) -> None:
        """Save the properties to the provided database cursor."""
        cursor.execute('update players set mu=?, sigma=?, games_count=?, '
                       'wins_count=? where name=? and ladder=?',
                       [self.rating.mu, self.rating.sigma, self.games_count,
                       self.wins_count, self.name, self.ranking.ladder])
