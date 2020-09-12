import React from 'react';
import './UserList.css';

export default class UserList extends React.Component {

  static defaultState(that: UserList) {
    return {
      users: [],
      ready: false
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      UserList.defaultState(this),
      props
    )
    this.handleDiscoReady = this.handleDiscoReady.bind(this)
    this.handleChange = this.handleChange.bind(this)
    document.addEventListener('ready', this.handleDiscoReady)
  }

  handleDiscoReady() {
    this.state.ready = true
    this.listenForUsers()
  }

  listenForUsers() {
    window.disco.state.paths.users
    .map()
    .once((v: any, k: any) => {
      if(!v.username) { return }
      const users = this.state.users || []
      users.filter((e) => e.hid !== k)
      users.push({
        hid: k,
        username: v.username,
        handle: v.handle,
        timestamp: v.timestamp
      })
      users.sort((a: any, b: any) => a.timestamp > b.timestamp)
      this.setState({users})
    })
  }

  handleChange(event) {
    this.setState({hid: event.target.value});
    this.dispatch('user_selected', event.target.value)
  }

  dispatch (e:any, p:any = null) {
    document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
  }

  render() {
    return (
      <div className="user-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.users.map(function(user, index) {
            return <option key={index} value={user.hid}> {user.handle}</option>;
          })}
        </select>
      </div>
    )
  }
}
