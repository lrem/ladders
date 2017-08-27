import {promise,  browser, element, by, ExpectedConditions } from 'protractor';

const oneSecond = 1000;
// Short enough to not slow the test down too much,
// long enough to wait out Chrome's lags.
const shortSleep = 50;

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
    browser.wait(ExpectedConditions.presenceOf(element(by.partialButtonText('Report'))), 5 * oneSecond);
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[i].length; j++) {
        element(by.css(`input[name="name${i}.${j}"]`)).sendKeys(result[i][j]);
        browser.sleep(shortSleep);
      }
    }
    element(by.partialButtonText('Report')).click();
    browser.wait(ExpectedConditions.not(ExpectedConditions.presenceOf(
      element(by.tagName('app-game')))), 5 * oneSecond);
  }

  async getScore(name: string): Promise<number> {
    const text = await element(by.xpath(`//td[normalize-space(text())="${name}"]/../td[position()=2]`))
    .getText();
    return parseFloat(text);
  }

  async playerKnown(name: string): Promise<boolean> {
    return await element.all(by.xpath(`//td[normalize-space(text())="${name}"`)).count() > 0;
  }

  remove(position: number) {
    // This is stupidly likely to die on delays.
    browser.refresh();
    browser.sleep(oneSecond);
    element.all(by.css('button.remove')).get(position).click();
  }
}
