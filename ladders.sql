create table ladders (
    name text primary key,
    mu float not null default 1200,
    sigma float not null default 400,
    beta float not null default 200,
    tau float not null default 4,
    draw_probability float not null default 0,
    teams_count integer not null,
    players_per_team integer not null,
    last_ranking integer not null default 0
);

create table players (
    name text not null,
    ladder text not null,
    mu float not null,
    sigma not null,
    foreign key(ladder) references ladders(name),
    primary key(name, ladder)
);

create table games (
    id integer primary key,
    ladder text not null,
    timestamp integer not null default (cast(strftime('%s','now') as integer)),
    foreign key(ladder) references ladders(name)
);

alter table games add column reporter_uid text;
alter table games add column reporter_ip text;

create table participants (
    game integer not null,
    player text not null,
    position integer not null,
    foreign key(player) references players(name),
    foreign key(game) references games(id),
    primary key(game, player)
);

create table owners (
    user_id text,
    ladder text,
    foreign key(ladder) references ladders(name),
    primary key(user_id, ladder)
);
 
