import { Component, Input, Output, Inject, ViewChild, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Http, Response, RequestOptions, Headers, Request, RequestMethod } from '@angular/http';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA, MdSnackBar } from '@angular/material';
import { Location } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'rxjs/add/operator/switchMap';
import 'rxjs/Rx';

import { environment } from '../environments/environment'

@Component({
  selector: 'app-game',
  templateUrl: './game.html',
})
export class GameDialogComponent implements OnInit {
  public ladder: string;
  public submitting = false;
  public teams_count = 2;
  public players_per_team = 1;
  public players = [[{ name: '' }], [{ name: '' }]];
  constructor(public http: Http,
    public dialogRef: MdDialogRef<GameDialogComponent>,
    @Inject(MD_DIALOG_DATA) data: any) {
    this.http = http;
    this.ladder = data.ladder;
  }
  ngOnInit() {
    this.http.get(`${environment.backend}/${this.ladder}/match_shape`).
      map(res => res.json()).
      subscribe(json => {
        if (json.exists) {
          while (this.teams_count < json.teams_count) {
            this.addTeam();
            this.teams_count++;
          }
          while (this.players_per_team < json.players_per_team) {
            this.addPlayer();
            this.players_per_team++;
          }
        }
      });
      console.log(`${this.teams_count} teams x ${this.players_per_team} players.`);
  }
  addTeam() {
    const new_row = [];
    for (let i = 0; i < this.players_per_team; i++) {
      new_row.push({name: ''});
    }
    this.players.push(new_row);
  }
  addPlayer() {
    this.players.map(row => {row.push({name: ''})});
  }
  onSubmit() {
    this.submitting = true;
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const result = JSON.stringify({ 'outcome': this.players });
    // console.debug(result);
    this.http.post(`${environment.backend}/${this.ladder}/game`,
      result, { headers: headers }).subscribe(() => {
        this.dialogRef.close();
      });
  }
}


@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.html'
})
export class RankingComponent implements OnInit {
  @Input() public ladder: string;
  public ranking: Object;
  public ready = false;
  public math = Math;
  constructor(private http: Http,
  ) { }
  ngOnInit() {
    this.reload()
  }
  reload() {
    this.http.get(`${environment.backend}/${this.ladder}/ranking`).
      map(res => res.json()).
      subscribe(json => {
        if (json.exists) {
          this.ranking = json.ranking;
          this.ready = true
        } else {
          // console.debug(`${this.ladder} does not exist`);
          this.ready = true
        }
      });
  }
}

@Component({
  selector: 'app-matches',
  templateUrl: './matches.html',
})
export class MatchesComponent implements OnInit {
  @Input() public ladder: string;
  @Input() public owned: boolean;
  @Input() public id_token;
  public matchList: Array<any>;
  public teamsHeader: Array<any>;
  public ready = false;
  constructor(private http: Http,
  ) { }
  ngOnInit() {
    this.reload()
  }
  reload() {
    this.http.get(`${environment.backend}/${this.ladder}/matches`).
      map(res => res.json()).
      subscribe(json => {
        if (json.exists) {
          this.matchList = json.matches;
          let maxTeams = 0;
          this.matchList.forEach((match) => {
            if (match.outcome.length > maxTeams) {
              maxTeams = match.outcome.length;
            }
          });
          this.teamsHeader = new Array(maxTeams);
          this.ready = true
        } else {
          // console.debug(`${this.ladder} does not exist`);
          this.ready = true
        }
      });
  }
  remove(id) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.http.post(`${environment.backend}/${this.ladder}/remove`,
      { id: id, idtoken: this.id_token }, { headers: headers })
      .subscribe(() => { this.reload(); });
  }
}

@Component({
  selector: 'app-ladder',
  templateUrl: './ladder.html',
})
export class LadderComponent implements OnInit {
  @ViewChild(RankingComponent) ranking: RankingComponent;
  @ViewChild(MatchesComponent) matches: MatchesComponent;
  public ladder: string;
  public owned: boolean;
  public id_token;
  constructor(private http: Http,
    private route: ActivatedRoute,
    private location: Location,
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
    const dialogRef = this.gameDialog.open(GameDialogComponent,
      { data: { ladder: this.ladder } });
    dialogRef.afterClosed().subscribe(result => { this.reload(); });
  }
  onSignIn(googleUser) {
    const id_token = googleUser.getAuthResponse().id_token;
    this.id_token = id_token
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.http.post(`${environment.backend}/${this.ladder}/owned`,
      { idtoken: id_token }, { headers: headers })
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
  selector: 'app-create',
  templateUrl: './create.html',
  styleUrls: ['./create.css'],
})
export class CreateComponent {
  public id_token;
  public ladder: string;
  public mu = 1200;
  public sigma = 400;
  public beta = 200;
  public tau = 4;
  public teams_count = 2;
  public players_per_team = 1;
  public draw_probability = 0;
  public submitting = false;
  constructor(private http: Http,
    private ngZone: NgZone,
    private snackBar: MdSnackBar,
  ) {
    window['onSignIn'] =
      (googleUser) => ngZone.run(() => this.onSignIn(googleUser));
  }
  onSignIn(googleUser) {
    const id_token = googleUser.getAuthResponse().id_token;
    this.id_token = id_token
  }
  onSubmit() {
    this.submitting = true;
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const settings = JSON.stringify({
      name: this.ladder,
      mu: this.mu,
      sigma: this.sigma,
      beta: this.beta,
      tau: this.tau,
      teams_count: this.teams_count,
      players_per_team: this.players_per_team,
      draw_probability: this.draw_probability,
      idtoken: this.id_token,
    });
    this.http.post(`${environment.backend}/${this.ladder}/create`,
      settings, { headers: headers })
      .toPromise()
      .then(() => {
        window.location.assign(`/ladder/${this.ladder}`);
      })
      .catch((error: any) => {
        this.snackBar.open('Creation failed... Name already in use?',
          'Dismiss', { duration: 5000 });
        this.submitting = false;
      });
  }
}

@Component({
  selector: 'app-tos',
  templateUrl: './tos.html',
  styleUrls: ['./create.css'],
})
export class ToSComponent { }

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent { }
