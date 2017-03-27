create table ladders (
    name text primary key,
    mu float not null default 1200,
    sigma float not null default 200,
    tau float not null default 12,
    draw_probability float not null default 0,
    last_ranking integer not null default 0
);

create table players (
    name text primary key,
    ladder text not null,
    mu float not null,
    sigma not null,
    foreign key(ladder) references ladders(name)
);

create table games (
    id integer primary key,
    ladder text not null,
    timestamp integer not null default (cast(strftime('%s','now') as integer)),
    foreign key(ladder) references ladders(name)
);

create table participants (
    game integer not null,
    player text not null,
    position integer not null,
    foreign key(player) references players(name),
    foreign key(game) references games(id),
    primary key(game, player)
);