import React from 'react';
import Button from '../common/buttons/button';
import CompactContainer from '../common/compact-container';
import dataService from '../../services/data-service';
import dataServiceConstants from '../../constants/data-service-constants';
import Description from '../common/section/description';
import DesktopBottomGrid from '../common/grids/desktop-bottom-grid';
import errorTypes from '../../errors/error-types';
import KoiflyError from '../../errors/error';
import MobileButton from '../common/buttons/mobile-button';
import MobileTopMenu from '../common/menu/mobile-top-menu';
import navigationService from '../../services/navigation-service';
import Notice from '../common/notice/notice';
import PilotModel from '../../models/pilot';
import PubSub from '../../utils/pubsub';
import Section from '../common/section/section';
import SectionRow from '../common/section/section-row';
import SectionTitle from '../common/section/section-title';
import TextInput from '../common/inputs/text-input';
import Util from '../../utils/util';


export default class InitiateResetPassword extends React.Component {
  constructor() {
    super();
    this.state = {
      email: PilotModel.getEmailAddress() || '',
      error: null,
      isInputInFocus: false,
      isSending: false,
      lastSentEmailAddress: null
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
  }

  componentDidMount() {
    PubSub.on(dataServiceConstants.STORE_MODIFIED_EVENT, this.handleStoreModified, this);
    this.handleStoreModified();
  }

  componentWillUnmount() {
    PubSub.removeListener(dataServiceConstants.STORE_MODIFIED_EVENT, this.handleStoreModified, this);
  }

  handleStoreModified() {
    if (PilotModel.isLoggedIn()) {
      navigationService.goToFlightLog();
    }
  }

  handleInputChange(inputName, inputValue) {
    this.setState({ [inputName]: inputValue });
  }

  handleInputFocus() {
    this.setState({ isInputInFocus: true });
  }

  handleInputBlur() {
    this.setState({ isInputInFocus: false });
  }

  handleSubmit(event) {
    if (event) {
      event.preventDefault();
    }

    if (Util.isEmptyString(this.state.email)) {
      this.updateError(new KoiflyError(errorTypes.VALIDATION_ERROR, 'Enter your email address'));
      return;
    }

    this.setState({
      isSending: true,
      error: null
    });

    const EmailAddress = this.state.email;
    dataService
      .sendInitiateResetPasswordEmail(EmailAddress)
      .then(() => {
        this.setState({
          isSending: false,
          lastSentEmailAddress: EmailAddress
        });
      })
      .catch(error => {
        this.updateError(error);
      });
  }

  handleCancelEdit() {
    if (PilotModel.isLoggedIn()) {
      navigationService.goToPilotView();
    } else {
      navigationService.goToLogin();
    }
  }

  updateError(error) {
    this.setState({
      error: error,
      isSending: false
    });
  }

  renderMobileTopMenu() {
    return (
      <MobileTopMenu
        header='Koifly'
        leftButtonCaption='Back'
        rightButtonCaption='Sign Up'
        onLeftClick={this.handleCancelEdit}
        onRightClick={navigationService.goToSignup}
        isPositionFixed={!this.state.isInputInFocus}
      />
    );
  }

  renderNotice() {
    if (this.state.lastSentEmailAddress) {
      const noticeText = 'Email with reset password link was successfully sent to ' + this.state.lastSentEmailAddress;
      return <Notice isPadded={true} text={noticeText}/>;
    }
  }

  renderError() {
    if (this.state.error) {
      return <Notice isPadded={true} type='error' text={this.state.error.message}/>;
    }
  }

  renderDesktopButtons() {
    return (
      <DesktopBottomGrid
        leftElements={[
          this.renderSendButton(),
          this.renderCancelButton()
        ]}
      />
    );
  }

  renderSendButton() {
    return (
      <Button
        caption={this.state.isSending ? 'Sending...' : 'Send'}
        type='submit'
        buttonStyle='primary'
        onClick={this.handleSubmit}
        isEnabled={!this.state.isSending}
      />
    );
  }

  renderCancelButton() {
    return (
      <Button
        caption='Cancel'
        buttonStyle='secondary'
        onClick={this.handleCancelEdit}
        isEnabled={!this.state.isSending}
      />
    );
  }

  renderMobileButtons() {
    return (
      <MobileButton
        caption={this.state.isSending ? 'Sending...' : 'Send'}
        type='submit'
        buttonStyle='primary'
        onClick={this.handleSubmit}
        isEnabled={!this.state.isSending}
      />
    );
  }

  render() {
    return (
      <div>
        {this.renderMobileTopMenu()}
        {this.renderNotice()}
        {this.renderError()}

        <CompactContainer>
          <form>
            <Section>

              <SectionTitle>Reset Password</SectionTitle>

              <SectionRow>
                <TextInput
                  inputValue={this.state.email}
                  labelText='Email:'
                  inputName='email'
                  isEmail={true}
                  onChange={this.handleInputChange}
                  onFocus={this.handleInputFocus}
                  onBlur={this.handleInputBlur}
                />
              </SectionRow>

              <SectionRow isLast={true}>
                <Description>
                  We will send you an email with a link to password reset page
                </Description>
              </SectionRow>

              {this.renderDesktopButtons()}
            </Section>

            {this.renderMobileButtons()}
          </form>
        </CompactContainer>
      </div>
    );
  }
}
