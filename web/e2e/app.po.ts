import {promise,  browser, element, by, ExpectedConditions } from 'protractor';

const oneSecond = 1000;

export class Create {
  navigateTo() {
    return browser.get('/create');
  }

  setParameter(name: string, value: string) {
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
    element(by.css(".app-action button")).click();
    browser.wait(ExpectedConditions.presenceOf(element(by.partialButtonText('Report'))), oneSecond);
    element(by.css('input[ng-reflect-name="name0.0"]')).sendKeys(winner);
    element(by.css('input[ng-reflect-name="name1.0"]')).sendKeys(loser);
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