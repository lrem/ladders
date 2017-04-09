import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { MaterialModule} from '@angular/material';

import { AppComponent, LadderComponent, GameDialog, RankingComponent, MatchesComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    LadderComponent,
    GameDialog,
    RankingComponent,
    MatchesComponent,
  ],
  entryComponents: [
    AppComponent,
    GameDialog,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterialModule,
    RouterModule.forRoot([
      {
        path: 'ladder/:ladder', component:LadderComponent
      },
    ]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
