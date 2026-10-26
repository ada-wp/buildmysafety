import test from 'node:test';
import assert from 'node:assert/strict';
import { accountBack, publicReturn, signInDestination } from '../src/navigation.ts';

test('Account and Privacy back paths always escape their subflow, including refresh', () => {
  for (const bad of ['', '#/privacy', '#/account', '#/goodbye', '//outside.example', '#/app/list?email=private']) {
    assert.equal(accountBack(bad, true), '#/app/list');
    assert.equal(accountBack(bad, false), '#/welcome');
  }
  for (const route of ['#/app/list', '#/app/progress', '#/app/task/sick_shelf', '#/question/why'])
    assert.equal(accountBack(route, true), route);
});
test('email sign-in and cancellation preserve explicit intent, while onboarding returns to recap', () => {
  for (const route of ['#/privacy', '#/account', '#/app/list']) {
    assert.equal(signInDestination(route, false), route);
    assert.equal(signInDestination(route, true), '#/recap');
  }
  assert.equal(signInDestination('https://outside.example', false), '#/account');
  assert.equal(publicReturn('#/privacy?private=value'), '#/welcome');
});
