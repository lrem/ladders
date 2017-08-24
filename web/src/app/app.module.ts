import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { MaterialModule} from '@angular/material';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';

import { AppComponent, LadderComponent, GameDialogComponent, RankingComponent,
  MatchesComponent, CreateComponent, ToSComponent, LandingComponent,
  FinderComponent, OwnedListComponent, SuggestPlayersComponent, HistoryDialogComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    LadderComponent,
    GameDialogComponent,
    RankingComponent,
    MatchesComponent,
    CreateComponent,
    ToSComponent,
    LandingComponent,
    FinderComponent,
    OwnedListComponent,
    SuggestPlayersComponent,
    HistoryDialogComponent,
  ],
  entryComponents: [
    AppComponent,
    CreateComponent,
    GameDialogComponent,
    HistoryDialogComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    MaterialModule,
    BrowserAnimationsModule,
    Ng2GoogleChartsModule,
    RouterModule.forRoot([
      {path: 'ladder/:ladder', component: LadderComponent},
      {path: 'create', component: CreateComponent},
      {path: 'tos', component: ToSComponent},
      {path: '', component: LandingComponent},
    ]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
