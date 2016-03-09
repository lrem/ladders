import {bootstrap}    from 'angular2/platform/browser'
import {AppComponent, GameComponent} from './app.component'
import {Http, Response, RequestOptions, Headers, Request, RequestMethod, HTTP_PROVIDERS} from 'angular2/http';


bootstrap(GameComponent, [HTTP_PROVIDERS]);
bootstrap(AppComponent, [HTTP_PROVIDERS]);
