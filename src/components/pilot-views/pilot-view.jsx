import React from 'react';
import AppLink from '../common/app-link';
import Button from '../common/buttons/button';
import DaysSinceLastFlight from '../common/days-since-last-flight';
import ErrorBox from '../common/notice/error-box';
import SectionLoader from '../common/section/section-loader';
import MobileButton from '../common/buttons/mobile-button';
import MobileTopMenu from '../common/menu/mobile-top-menu';
import NavigationMenu from '../common/menu/navigation-menu';
import navigationService from '../../services/navigation-service';
import BuddyModel from '../../models/buddy';
import PilotModel from '../../models/pilot';
import RowContent from '../common/section/row-content';
import Section from '../common/section/section';
import SectionRow from '../common/section/section-row';
import SectionTitle from '../common/section/section-title';
import Util from '../../utils/util';
import Validation from '../../utils/validation';
import View from '../common/view';


export default class PilotView extends React.Component {
  constructor() {
    super();
    this.state = {
      pilot: null,
      loadingError: null,
      buddies: null,
      inviteEmail: '',
      inviteError: null,
      inviteSending: false
    };

    this.handleStoreModified = this.handleStoreModified.bind(this);
  }

  handleEditPilotInfo() {
    navigationService.goToPilotEdit();
  }

  handleChangePassword() {
    navigationService.goToPilotChangePassword();
  }

  handleLogout() {
    PilotModel
      .logout()
      .then(() => navigationService.goToLogin)
      .catch(() => window.alert('Server error. Could not log out.'));
  }

  handleStoreModified() {
    const pilot = PilotModel.getPilotOutput();
    if (pilot && pilot.error) {
      this.setState({ loadingError: pilot.error });
    } else {
      const buddies = BuddyModel.getListOutput();
      this.setState({
        pilot: pilot,
        buddies: buddies && !buddies.error ? buddies : null,
        loadingError: null
      });
    }
  }

  handleInviteEmailChange(value) {
    this.setState({ inviteEmail: value, inviteError: null });
  }

  handleSendInvite() {
    const email = this.state.inviteEmail.trim();
    const errors = Validation.getValidationErrors(
      { email: { method: 'text', rules: { field: 'Email', maxLength: 254 } } },
      { email: email }
    );
    if (errors) {
      this.setState({ inviteError: errors.email });
      return;
    }

    this.setState({ inviteSending: true, inviteError: null });
    BuddyModel
      .inviteBuddy(email)
      .then(() => {
        this.setState({ inviteEmail: '', inviteSending: false });
        this.handleStoreModified();
      })
      .catch(error => {
        this.setState({
          inviteSending: false,
          inviteError: error.message || 'Failed to send invite'
        });
      });
  }

  handleAcceptInvite(buddyId) {
    BuddyModel.respondToInvite(buddyId, 'accepted')
      .then(() => this.handleStoreModified());
  }

  handleRejectInvite(buddyId) {
    BuddyModel.respondToInvite(buddyId, 'rejected')
      .then(() => this.handleStoreModified());
  }

  handleRemoveBuddy(buddyId) {
    if (window.confirm('Remove this buddy?')) {
      BuddyModel.removeBuddy(buddyId)
        .then(() => this.handleStoreModified());
    }
  }

  handleCancelInvite(buddyId) {
    BuddyModel.removeBuddy(buddyId)
      .then(() => this.handleStoreModified());
  }

  renderMobileTopMenu() {
    return (
      <MobileTopMenu
        header='Pilot'
        rightButtonCaption='Edit'
        onRightClick={this.handleEditPilotInfo}
      />
    );
  }

  renderNavigationMenu() {
    return <NavigationMenu currentView={PilotModel.getModelKey()}/>;
  }

  renderSimpleLayout(children) {
    return (
      <View onStoreModified={this.handleStoreModified} error={this.state.loadingError}>
        <MobileTopMenu header='Pilot'/>
        {this.renderNavigationMenu()}
        {children}
      </View>
    );
  }

  renderError() {
    return this.renderSimpleLayout(
      <ErrorBox error={this.state.loadingError} onTryAgain={this.handleStoreModified}/>
    );
  }

  renderLoader() {
    return this.renderSimpleLayout(<SectionLoader/>);
  }

  renderBuddyList(title, buddies, actionButtons) {
    if (!buddies || buddies.length === 0) return null;

    return (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
        {buddies.map(b => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #eee'
            }}
          >
            <span style={{ flex: 1 }}>{b.otherPilot.userName || b.otherPilot.email}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {actionButtons(b)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderBuddiesSection() {
    const buddiesState = this.state.buddies;
    if (!buddiesState) return null;

    const hasAny = buddiesState.accepted.length || buddiesState.incoming.length || buddiesState.outgoing.length;

    const inviteRow = (
      <SectionRow>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <input
            type='email'
            placeholder='Invite by email'
            value={this.state.inviteEmail}
            onChange={e => this.handleInviteEmailChange(e.target.value)}
            style={{ flex: 1, height: '40px', padding: '0 8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <Button
            caption='Send Invite'
            onClick={() => this.handleSendInvite()}
            disabled={this.state.inviteSending || !this.state.inviteEmail.trim()}
            isFitContent={true}
            isAllScreens={true}
          />
        </div>
        {this.state.inviteError && (
          <div style={{ color: 'red', paddingTop: '8px' }}>{this.state.inviteError}</div>
        )}
      </SectionRow>
    );

    const acceptedItems = this.renderBuddyList('Accepted', buddiesState.accepted, b => (
        <Button
          caption='Remove'
          buttonStyle='warning'
          onClick={() => this.handleRemoveBuddy(b.id)}
          isFitContent={true}
          isAllScreens={true}
        />
    ));

    const incomingItems = this.renderBuddyList('Incoming', buddiesState.incoming, b => (
      <React.Fragment>
        <Button
          caption='Accept'
          onClick={() => this.handleAcceptInvite(b.id)}
          isFitContent={true}
          isAllScreens={true}
        />
        <Button
          caption='Reject'
          buttonStyle='warning'
          onClick={() => this.handleRejectInvite(b.id)}
          isFitContent={true}
          isAllScreens={true}
        />
      </React.Fragment>
    ));

    const outgoingItems = this.renderBuddyList('Sent', buddiesState.outgoing, b => (
      <Button
        caption='Cancel'
        buttonStyle='warning'
        onClick={() => this.handleCancelInvite(b.id)}
        isFitContent={true}
        isAllScreens={true}
      />
    ));

    return (
      <Section>
        <SectionTitle>Buddies</SectionTitle>
        {inviteRow}
        {acceptedItems && (
          <SectionRow>
            {acceptedItems}
          </SectionRow>
        )}
        {incomingItems && (
          <SectionRow>
            {incomingItems}
          </SectionRow>
        )}
        {outgoingItems && (
          <SectionRow>
            {outgoingItems}
          </SectionRow>
        )}
        {!hasAny && (
          <SectionRow isLast={true}>
            <div>No buddies yet. Invite another pilot by email.</div>
          </SectionRow>
        )}
      </Section>
    );
  }

  renderMobileButtons() {
    return (
      <div>
        <MobileButton
          caption='Change Password'
          onClick={this.handleChangePassword}
        />

        <MobileButton
          caption='Log Out'
          buttonStyle='warning'
          onClick={this.handleLogout}
        />
      </div>
    );
  }

  render() {
    if (this.state.loadingError) {
      return this.renderError();
    }

    if (this.state.pilot === null) {
      return this.renderLoader();
    }

    let { flightNumTotal } = this.state.pilot;
    if (this.state.pilot.flightNumThisYear) {
      flightNumTotal += `, incl. this year: ${this.state.pilot.flightNumThisYear}`;
    }

    return (
      <View onStoreModified={this.handleStoreModified}>
        {this.renderMobileTopMenu()}
        {this.renderNavigationMenu()}

        <Section onEditClick={this.handleEditPilotInfo}>
          <SectionTitle>
            <div>{this.state.pilot.userName}</div>
            <div>{this.state.pilot.email}</div>
          </SectionTitle>

          <SectionRow>
            <RowContent
              label='Flights:'
              value={flightNumTotal}
            />
          </SectionRow>

          <SectionRow>
            <RowContent
              label='Airtime:'
              value={Util.formatTime(this.state.pilot.airtimeTotal)}
            />
          </SectionRow>

          <SectionRow>
            <RowContent
              label='Sites flown:'
              value={this.state.pilot.siteNum}
            />
          </SectionRow>

          <SectionRow>
            <RowContent
              label='Gliders used:'
              value={this.state.pilot.gliderNum}
            />
          </SectionRow>

          <SectionRow isLast={true}>
            <DaysSinceLastFlight days={this.state.pilot.daysSinceLastFlight}/>
          </SectionRow>
        </Section>

        {this.renderBuddiesSection()}

        <Section>
          <SectionTitle>Settings</SectionTitle>

          <SectionRow>
            <RowContent
              label='Altitude units:'
              value={this.state.pilot.altitudeUnit}
            />
          </SectionRow>

          <SectionRow isLast={true}>
            <RowContent
              label='Distance units:'
              value={this.state.pilot.distanceUnit}
            />
          </SectionRow>

          <SectionRow isDesktopOnly={true} isLast={true}>
            <RowContent
              label='Account password:'
              value={<AppLink onClick={this.handleChangePassword}> Change password </AppLink>}
            />
          </SectionRow>
        </Section>

        {this.renderMobileButtons()}
      </View>
    );
  }
}
