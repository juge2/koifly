/* eslint-disable */
import { expect } from 'chai';
import sinon from 'sinon';
import StatsView from '../../src/components/stats-views/stats-view';
import BuddyModel from '../../src/models/buddy';
import dataService from '../../src/services/data-service';

describe('StatsView pilot filter', () => {
  afterEach(() => {
    sinon.restore();
  });

  const newView = () => new StatsView({});

  it('returns null options when there are no accepted buddies', () => {
    sinon.stub(BuddyModel, 'getListOutput').returns({ accepted: [] });

    const view = newView();

    expect(view.getPilotOptions()).to.equal(null);
  });

  it('returns own pilot and accepted buddies as options', () => {
    sinon.stub(BuddyModel, 'getListOutput').returns({
      accepted: [
        { otherPilot: { id: 2, userName: 'Pilot Two', email: 'two@example.com' } }
      ]
    });
    sinon.stub(dataService, 'store').value({ pilot: { id: 1, userName: null, email: 'one@example.com' } });

    const view = newView();
    const options = view.getPilotOptions();

    expect(options).to.deep.equal([
      { value: 1, text: 'one@example.com' },
      { value: 2, text: 'Pilot Two' }
    ]);
  });
});