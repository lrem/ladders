import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Params }   from '@angular/router';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {Http, Response, RequestOptions, Headers, Request, RequestMethod} from '@angular/http';
import { Location } from '@angular/common';
import 'rxjs/add/operator/switchMap';
import 'rxjs/Rx' ;

@Component({
    selector: 'game',
    inputs: ['ladder'],
    templateUrl: './game.component.html',
    styleUrls: ['./app.component.css']
})
export class GameComponent {
  public ladder : string;
  @Output() onAdded: EventEmitter<any> = new EventEmitter();
  public active = false;
  public math = Math;
  public teams_count = 2;
  public players_per_team = 1;
  public players = [[{name: ''}], [{name: ''}]];
  constructor(public http: Http) {
    this.http = http;
  }
  onSubmit() {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    let result = JSON.stringify({'outcome': this.players});
    console.debug(result);
    this.http.post(`http://127.0.0.1:5000/${this.ladder}/game`,
              result, {headers: headers}).subscribe(() => {
                this.onAdded.emit();
              });
  }
}


@Component({
  selector: 'ranking',
  inputs: ['ranking', 'ready'],
  templateUrl: './ranking.component.html'
})
export class RankingComponent {
  public ranking : Object;
  public ready : boolean;
  public math = Math;
}

@Component({
    selector: 'ladder',
    templateUrl: './app.component.html'
})
export class LadderComponent {
  public ranking = 'Loading ranking.';
  public ladder : string;
  public ready = false;
  constructor(private http: Http,
              private route:ActivatedRoute,
              private location:Location,
             ) {}
  ngOnInit() {
    this.route.params.subscribe(params => this.ladder = params['ladder']);
    this.reload()
  }
  reload() {
    this.http.get(`http://127.0.0.1:5000/${this.ladder}/ranking`).
      map(res => res.json()).
      subscribe(json => {
        if(json.exists) {
          this.ranking = json.ranking;
          this.ready = true
        } else {
          console.debug(`${this.ladder} does not exist`);
          this.ready = true
        }
      });
  }
}

@Component({
    selector: 'app-root',
    template: `<router-outlet></router-outlet>`,
    //templateUrl: './app.component.html'
})
/*
@RouteConfig([
  {path:'/ladder/:ladder', name:'Ladder', component:LadderComponent}
])
*/
export class AppComponent { }
