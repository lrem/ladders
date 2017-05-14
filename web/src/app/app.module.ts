import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { MaterialModule} from '@angular/material';

import { AppComponent, LadderComponent, GameDialog, RankingComponent,
  MatchesComponent, CreateComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    LadderComponent,
    GameDialog,
    RankingComponent,
    MatchesComponent,
    CreateComponent,
  ],
  entryComponents: [
    AppComponent,
    CreateComponent,
    GameDialog,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterialModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {path: 'ladder/:ladder', component: LadderComponent},
      {path: 'create', component: CreateComponent},
    ]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
