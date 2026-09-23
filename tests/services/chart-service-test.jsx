/* eslint-disable */
import { expect } from 'chai';
import sinon from 'sinon';
import Altitude from '../../src/utils/altitude';
import chartService from '../../src/services/chart-service';
import FlightModel from '../../src/models/flight';
import SiteModel from '../../src/models/site';

describe('chartService.getFlightStatsForEachSite', () => {
  afterEach(() => {
    sinon.restore();
  });

  const flights = {
    1: { id: 1, siteId: 10, pilotId: 100, date: '2020-05-01', airtime: 60, altitude: 1000 },
    2: { id: 2, siteId: 10, pilotId: 100, date: '2021-06-02', airtime: 90, altitude: 1400 },
    3: { id: 3, siteId: 11, pilotId: 200, date: '2021-06-03', airtime: 30, altitude: 800 },
    4: { id: 4, siteId: 11, pilotId: null, date: '2022-07-04', airtime: 45, altitude: 900 }
  };
  const sites = [
    { id: 10, name: 'Alyaska', launchAltitude: 500 },
    { id: 11, name: 'El Tepual', launchAltitude: 600 }
  ];

  const stubData = () => {
    sinon.stub(Altitude, 'getAltitudeInPilotUnits').callsFake(alt => alt);
    sinon.stub(FlightModel, 'getStoreContent').returns(flights);
    sinon.stub(SiteModel, 'getList').returns(sites);
  };

  it('counts flights of all pilots when no pilot filter is given', () => {
    stubData();

    const stats = chartService.getFlightStatsForEachSite();

    expect(stats.years).to.deep.equal([2020, 2021, 2022]);
    const site10 = stats.bySite.find(s => s.siteId === 10);
    const site11 = stats.bySite.find(s => s.siteId === 11);
    expect(site10.totalFlightNum).to.equal(2);
    expect(site10.totalAirtime).to.equal(150);
    expect(site11.totalFlightNum).to.equal(2);
  });

  it('counts only the selected pilot flights when a pilot filter is given', () => {
    stubData();

    const stats = chartService.getFlightStatsForEachSite(100);

    expect(stats.years).to.deep.equal([2020, 2021]);
    const site10 = stats.bySite.find(s => s.siteId === 10);
    const site11 = stats.bySite.find(s => s.siteId === 11);
    expect(site10.totalFlightNum).to.equal(2);
    expect(site10.totalAirtime).to.equal(150);
    expect(site11.totalFlightNum).to.equal(0);
  });

  it('counts zero flights and no years for a pilot without flights', () => {
    stubData();

    const stats = chartService.getFlightStatsForEachSite(999);

    expect(stats.years).to.deep.equal([]);
    stats.bySite.forEach(site => {
      expect(site.totalFlightNum).to.equal(0);
      expect(site.totalAirtime).to.equal(0);
    });
  });
});