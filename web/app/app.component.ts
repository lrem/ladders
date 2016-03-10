import {Component} from 'angular2/core';
import 'rxjs/Rx' ;
import {Http, Response, RequestOptions, Headers, Request, RequestMethod, HTTP_PROVIDERS} from 'angular2/http';
import {RouteConfig, Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS} from 'angular2/router';
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
    inputs: ['ladder'],
    viewProviders: [HTTP_PROVIDERS],
    templateUrl: 'app/game.component.html'
})
export class GameComponent {
  public ladder : string;
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
    providers: [ROUTER_PROVIDERS],
    viewProviders: [HTTP_PROVIDERS],
    directives: [GameComponent],
    templateUrl: 'app/app.component.html'
})
export class LadderComponent {
  public ranking = 'Loading ranking.';
  public ladder : string;
  public ready = false;
  public math = Math;
  constructor(private http: Http,
              private router:Router,
              private routeParams:RouteParams
             ) {}
  ngOnInit() {
    this.ladder = this.routeParams.get('ladder');
    this.http.get(`http://127.0.0.1:5000/${this.ladder}/ranking`).
      map(res => res.json()).
      subscribe(json => {
        this.ranking = json.ranking;
        this.ready = true});
  }
}

@Component({
    selector: 'ladders-main',
    providers: [ROUTER_PROVIDERS],
    directives: [ROUTER_DIRECTIVES],
    template: `<router-outlet></router-outlet>`,
    //templateUrl: 'app/app.component.html'
})
@RouteConfig([
  {path:'/ladder/:ladder', name:'Ladder', component:LadderComponent}
])
export class AppComponent { }
