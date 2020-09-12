import React from 'react';
import './FriendsList.css';

export default class FriendsList extends React.Component {

  props: {
    mode: any
  }

  static defaultState(that: FriendsList) {
    return {
      friends: [],
      ready: false
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      FriendsList.defaultState(this),
      props
    )
    this.handleReady = this.handleReady.bind(this)
    this.handleChange = this.handleChange.bind(this)
    document.addEventListener('ready', () => this.handleReady())
  }

  handleReady() {
    this.state.ready = true
    const friends = []
    this.listenForMoreFriends()
  }

  listenForMoreFriends() {
    window.disco.state.paths.user.friends
    .map()
    .on((v:any, k:any) => {
      if(this.props.mode) {
        if(this.props.mode !== v.status) {
          return
        }
      }
      window.disco.state.paths.users
      .get(k)
      .once((vv, kk) => {
        if(!vv) {
          return
        }
        const friends = this.state.friends || []
        friends.filter((e) => e.hid !== kk)
        friends.push({
          hid: kk,
          username: vv.username,
          handle: vv.handle,
          timestamp: vv.timestamp
        })
        friends.sort((a, b) => a > b)
        this.setState({friends})
      })
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
      <div className="friends-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.friends.map(function(friend, index) {
            return <option key={index} value={friend.hid}>{friend.handle}</option>;
          })}
        </select>
      </div>
    )
  }
}
