import { Component, Input, Output, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute, Params }   from '@angular/router';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {Http, Response, RequestOptions, Headers, Request, RequestMethod} from '@angular/http';
import {MdDialog, MdDialogRef} from '@angular/material';
import { Location } from '@angular/common';
import 'rxjs/add/operator/switchMap';
import 'rxjs/Rx' ;

@Component({
    selector: 'game',
    templateUrl: './game.component.html',
})
export class GameDialog {
  public ladder : string;
  public submitting = false;
  public teams_count = 2;
  public players_per_team = 1;
  public players = [[{name: ''}], [{name: ''}]];
  constructor(public http: Http,
              public dialogRef: MdDialogRef<GameDialog>) {
    this.http = http;
    this.ladder = this.dialogRef.config.data.ladder;
  }
  onSubmit() {
    this.submitting = true;
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    let result = JSON.stringify({'outcome': this.players});
    console.debug(result);
    this.http.post(`http://127.0.0.1:5000/${this.ladder}/game`,
              result, {headers: headers}).subscribe(() => {
                this.dialogRef.close();
              });
  }
}


@Component({
  selector: 'ranking',
  inputs: ['ladder'],
  styleUrls: ['./app.component.css'],
  templateUrl: './ranking.component.html'
})
export class RankingComponent {
  public ladder : string;
  public ranking : Object;
  public ready : boolean = false;
  public math = Math;
  constructor(private http: Http,
             ) {}
  ngOnInit() {
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
  selector: 'matches',
  inputs: ['ladder', 'owned', 'id_token'],
  styleUrls: ['./app.component.css'],
  templateUrl: './matches.component.html',
})
export class MatchesComponent {
  public ladder : string;
  public matchList : Object;
  public ready : boolean = false;
  public id_token;
  constructor(private http: Http,
             ) {}
  ngOnInit() {
    this.reload()
  }
  reload() {
    this.http.get(`http://127.0.0.1:5000/${this.ladder}/matches`).
      map(res => res.json()).
      subscribe(json => {
        if(json.exists) {
          this.matchList = json.matches;
          this.ready = true
        } else {
          console.debug(`${this.ladder} does not exist`);
          this.ready = true
        }
      });
  }
  remove(id) {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.http.post(`http://127.0.0.1:5000/${this.ladder}/remove`,
                   {id: id, idtoken: this.id_token}, {headers: headers})
      .subscribe(() => {this.reload();});
  }
}

@Component({
    selector: 'ladder',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class LadderComponent {
  @ViewChild(RankingComponent) ranking: RankingComponent;
  @ViewChild(MatchesComponent) matches: MatchesComponent;
  public ladder : string;
  public owned: boolean;
  public id_token;
  constructor(private http: Http,
              private route:ActivatedRoute,
              private location:Location,
              private ngZone: NgZone,
              public gameDialog: MdDialog,
             ) {
    window['onSignIn'] =
      (googleUser) => ngZone.run(() => this.onSignIn(googleUser));
  }
  ngOnInit() {
    this.route.params.subscribe(params => this.ladder = params['ladder']);
  }
  openGameDialog() {
    let dialogRef = this.gameDialog.open(GameDialog,
                                         {data: {ladder: this.ladder}});
    dialogRef.afterClosed().subscribe(result => {this.reload();});
  }
  onSignIn(googleUser) {
    let id_token = googleUser.getAuthResponse().id_token;
    this.id_token = id_token
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.http.post(`http://127.0.0.1:5000/${this.ladder}/owned`,
                   {idtoken: id_token}, {headers: headers})
                   .map(res => res.json()).subscribe(json => {
                     this.owned = json;
                   });
  }
  reload() {
    this.ranking.reload();
    this.matches.reload();
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
