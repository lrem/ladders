import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { MatToolbarModule, MatSidenavModule, MatIconModule, MatDialogModule,
   MatProgressBarModule, MatCardModule, MatListModule, MatAutocompleteModule,
    MatInputModule, MatSnackBarModule } from '@angular/material';

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
    BrowserAnimationsModule,
    Ng2GoogleChartsModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatCardModule,
    MatListModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatToolbarModule,
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
