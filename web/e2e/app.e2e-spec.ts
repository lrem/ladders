import { browser, ExpectedConditions, promise } from 'protractor';
import { Create, Ladder } from './app.po';

const oneSecond = 1000;

describe('base flow', async () => {
  const ladder: Ladder = new Ladder();
  const create: Create = new Create();

  it('should create a ladder with default settings', () => {
    create.navigateTo();
    create.setParameter('name', 'foo');
    create.submit();
    browser.wait(ExpectedConditions.urlContains('foo'), 5 * oneSecond);
  });

  it('should make a simple transitive ranking', async () => {
    ladder.navigateTo('foo');
    ladder.reportDuel('x', 'y');
    ladder.reportDuel('y', 'z');
    let x = await ladder.getScore('x');
    let y = await ladder.getScore('y');
    let z = await ladder.getScore('z');
    expect(x).toBeGreaterThan(y);
    expect(y).toBeGreaterThan(z);
  });

  it('should forget players after deleting their matches', async () => {
    ladder.navigateTo('foo');
    ladder.reportDuel('a', 'b');
    ladder.reportDuel('c', 'd');
    ladder.reportDuel('b', 'a');
    ladder.remove(1);  // The 'c' vs 'd' game.
    let a = await ladder.getScore('a');
    let b = await ladder.getScore('b');
    expect(b).toBeGreaterThan(a);
  });

});

describe('3v3 flow', () => {
  const ladder: Ladder = new Ladder();
  const create: Create = new Create();

  it('should create a ladder with default settings', () => {
    create.navigateTo();
    create.setParameter('name', 'bar');
    create.setParameter('teams_count', '3');
    create.setParameter('players_per_team', '3');
    create.submit();
    browser.wait(ExpectedConditions.urlContains('bar'), 5 * oneSecond);
  });

  it('distributes points evenly', async () => {
    ladder.navigateTo('bar');
    ladder.reportGame([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i']]);
    let scores: Array<number> = [];
    for(let name of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']) {
      scores.push(await ladder.getScore(name));
    }
    // Better teams get better scores.
      expect(scores[0]).toBeGreaterThan(scores[3]);
      expect(scores[3]).toBeGreaterThan(scores[6]);
      // Scores are equal within teams.
      expect(scores[0]).toEqual(scores[1]);
      expect(scores[0]).toEqual(scores[2]);
      expect(scores[3]).toEqual(scores[4]);
      expect(scores[3]).toEqual(scores[5]);
      expect(scores[6]).toEqual(scores[7]);
      expect(scores[6]).toEqual(scores[8]);
  });

  it('preserves predictable relations', async () => {
    ladder.navigateTo('bar');
    ladder.reportGame([
      ['a', 'd', 'g'],
      ['b', 'e', 'h'],
      ['c', 'f', 'i']]);
    let scores: Array<number> = [];
    for (let name of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']) {
      scores.push(await ladder.getScore(name));
    }
    for (let i = 0; i < 3; i++) {
      // Same before, better now.
      expect(scores[3 * i]).toBeGreaterThan(scores[3 * i + 1]);
      expect(scores[3 * i + 1]).toBeGreaterThan(scores[3 * i + 2]);
      // Better before, same now.
      expect(scores[i]).toBeGreaterThan(scores[i + 3]);
      expect(scores[i + 3]).toBeGreaterThan(scores[i + 6]);
    }
  })

})
