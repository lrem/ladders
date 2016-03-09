insert into ladders (name) values ('foo');
insert into players (name, ladder, mu, sigma) 
             values ('bo', 'foo', 1200, 200);
insert into players (name, ladder, mu, sigma) 
             values ('ra', 'foo', 1200, 200);
insert into players (name, ladder, mu, sigma) 
             values ('tu', 'foo', 1200, 200);
insert into players (name, ladder, mu, sigma) 
             values ('fi', 'foo', 1200, 200);
insert into games (ladder) values ('foo');
insert into participants (game, player, position) values (1, 'bo', 0);
insert into participants (game, player, position) values (1, 'ra', 0);
insert into participants (game, player, position) values (1, 'tu', 1);
insert into participants (game, player, position) values (1, 'fi', 1);
insert into games (ladder) values ('foo');
insert into participants (game, player, position) values (2, 'ra', 1);
insert into participants (game, player, position) values (2, 'tu', 0);
insert into games (ladder) values ('foo');
insert into participants (game, player, position) values (3, 'tu', 0);
insert into participants (game, player, position) values (3, 'bo', 1);
