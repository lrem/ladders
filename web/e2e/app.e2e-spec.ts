import { browser, ExpectedConditions, promise } from 'protractor';
import { Create, Ladder } from './app.po';

describe('base flow', () => {
  const ladder: Ladder = new Ladder();
  const create: Create = new Create();
  const oneSecond = 1000;

  it('should create a ladder with default settings', () => {
    create.navigateTo();
    create.setParameter('name', 'foo');
    create.submit();
    browser.wait(ExpectedConditions.urlContains('foo'), oneSecond);
  });

  it('should make a simple transitive ranking', () => {
    ladder.navigateTo('foo');
    ladder.reportDuel('x', 'y');
    ladder.reportDuel('y', 'z');
    const scorePromises = [
      ladder.getScore('x'),
      ladder.getScore('y'),
      ladder.getScore('z'),
    ];
    promise.all(scorePromises).then((scores) => {
      expect(scores[0]).toBeGreaterThan(scores[1]);
      expect(scores[1]).toBeGreaterThan(scores[2]);
    });
  });
});
