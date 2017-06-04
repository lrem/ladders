import {promise,  browser, element, by, ExpectedConditions } from 'protractor';

const oneSecond = 1000;

export class Create {
  navigateTo() {
    return browser.get('/create');
  }

  setParameter(name: string, value: string) {
    element(by.name(name)).clear();
    element(by.name(name)).sendKeys(value);
  }

  submit() {
    element(by.partialButtonText('Create')).click();
  }
}

export class Ladder {
  navigateTo(ladder: string) {
    return browser.get(`/ladder/${ladder}`)
  }

  reportDuel(winner: string, loser: string) {
    this.reportGame([[winner], [loser]]);
  }

  reportGame(result: Array<Array<string>>) {
    element(by.css('.app-action button')).click();
    browser.wait(ExpectedConditions.presenceOf(element(by.partialButtonText('Report'))), oneSecond);
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[i].length; j++) {
        element(by.css(`input[ng-reflect-name="name${i}.${j}"]`)).sendKeys(result[i][j]);
      }
    }
    element(by.partialButtonText('Report')).click();
    browser.wait(ExpectedConditions.not(ExpectedConditions.presenceOf(
      element(by.tagName('app-game')))), oneSecond);
  }

  getScore(name: string): promise.Promise<number> {
    return element(by.xpath(`//td[normalize-space(text())="${name}"]/../td[last()]`))
      .getText().then((value: string) => {
        return parseFloat(value);
      });
  }
}
