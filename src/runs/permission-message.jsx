import cs from 'classnames'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import errors from '../lib/errors'
import projectsStore from '../projects/projects-store'

const SUCCESS = 'SUCCESS'
const FAILURE = 'FAILURE'

@observer
class PermissionMessage extends Component {
  constructor (props) {
    super(props)

    this.state = {
      error: null,
      isSubmitting: false,
      result: null,
    }
  }

  render () {
    return (
      <div
        id='runs-list-page'
        className={cs('request-access', {
          'is-submitting': this.state.isSubmitting,
        })}
      >
        {this._message()}
      </div>
    )
  }

  _message () {
    const membershipRequested = projectsStore.wasMembershipRequested(this.props.project.id)

    if (this.state.result === SUCCESS || membershipRequested) {
      return this._success()
    } else if (this.state.result === FAILURE) {
      return this._failure()
    } else {
      return this._noResult()
    }
  }

  _button () {
    return (
      <button
        className='btn btn-primary'
        disabled={this.state.isSubmitting}
        onClick={this._requestAccess}
        >
        <span>
          <i className='fa fa-paper-plane'></i>{' '}
          Request Access
        </span>
        <i className='fa fa-spinner fa-spin'></i>
      </button>
    )
  }

  _success () {
    return (
      <div className='empty'>
        <h4>
          <i className='fa fa-check passed'></i>{' '}
          Request Sent
        </h4>
        <p>
          The project owner will be notified with your request.
        </p>
      </div>
    )
  }

  _failure () {
    const error = this.state.error

    // if they're denied or the request has already been made,
    // tell them it's all good
    if (errors.isDenied(error) || errors.isAlreadyRequested(error)) {
      return this._success()
    } else {
      return (
        <div className='empty'>
          <h4>
            <i className='fa fa-exclamation-triangle failed'></i>{' '}
            Request Failed
          </h4>
          <p>An unexpected error occurred while requesting access:</p>
          <pre className='alert alert-danger'>
            {this.state.error.message}
          </pre>
          <p>Try again.</p>
          {this._button()}
        </div>
      )
    }
  }

  _noResult () {
    return (
      <div className="empty">
        <h4>
          <i className='fa fa-lock'></i>{' '}
          Request access to see the runs
        </h4>
        <p>This is a private project created by someone else.</p>
        <p>The project owner must give you access to see the runs.</p>
        {this._button()}
      </div>
    )
  }

  _requestAccess = () => {
    this.setState({
      isSubmitting: true,
    })

    const id = this.props.project.id

    App.ipc("request:access", id)
    .then(() => {
      projectsStore.membershipRequested(id)
      this._setResult()
    })
    .catch((error) => {
      this._setResult(error)
    })
  }

  _setResult (error) {
    if (errors.isAlreadyMember(error)) {
      this.props.onRetry()
      return
    }

    this.setState({
      error,
      isSubmitting: false,
      result: error ? FAILURE : SUCCESS,
    })
  }
}

export default PermissionMessage