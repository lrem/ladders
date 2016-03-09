import {Component} from 'angular2/core';
import 'rxjs/Rx' ;
import {Http, Response, RequestOptions, Headers, Request, RequestMethod, HTTP_PROVIDERS} from 'angular2/http';
import {Math} from 'angular2/src/facade/math';


interface ladders {
  name: string;
  mu: number;
  sigma: number;
  tau: number;
  draw_probability: number;
  last_ranking: number;
}

interface players {
  name: string;
  ladder: string;
  mu: number;
  sigma: number;
}

interface games {
  id: number;
  ladder: string;
  timestamp: number;
}

interface participants {
  game: number;
  player: string;
  position: number;
}

@Component({
    selector: 'game',
    viewProviders: [HTTP_PROVIDERS],
    templateUrl: 'app/game.component.html'
})
export class GameComponent {
  public ladder = 'foo';
  public active = false;
  public math = Math;
  public teams_count = 2;
  public players_per_team = 1;
  public players = [[{name: ''}], [{name: ''}]];
  constructor(public http: Http) {
    this.http = http;
    /*http.get(`http://127.0.0.1:5000/${this.ladder}/ranking`).
      map(res => res.json()).
      subscribe(json => {
        this.ranking = json.ranking;
        this.ready = true});*/
  }
  onSubmit() {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    let result = JSON.stringify({'outcome': this.players});
    console.debug(result);
    this.http.post(`http://127.0.0.1:5000/${this.ladder}/game`,
              result, {headers: headers}).subscribe();
  }
}


@Component({
    selector: 'ladder',
    viewProviders: [HTTP_PROVIDERS],
    directives: [GameComponent],
    templateUrl: 'app/app.component.html'
})
export class AppComponent {
  public ranking = 'Loading ranking.';
  public ladder = 'foo';
  public ready = false;
  public math = Math;
  constructor(public http: Http) {
    http.get(`http://127.0.0.1:5000/${this.ladder}/ranking`).
      map(res => res.json()).
      subscribe(json => {
        this.ranking = json.ranking;
        this.ready = true});
  }
}

