import React from 'react';
import './FriendsList.css';

export default class FriendsList extends React.Component {

  props: {
    mode: any
  }

  static defaultState(that: FriendsList) {
    return {
      friends: [],
      mounted: false
    }
  }

  state

  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      FriendsList.defaultState(this),
      props
    )
    window.disco.getFriends((err, usersObj) => {
      if(err || !usersObj || window.disco.state.paths.user.friends) { return }
      var friends = []
      window.disco.state.paths.user.friends.map().on((v, k) => {
        if(!v.participants) { return }
        if(this.props && this.props.mode && this.props.mode !== 'all') {
          if(this.props.mode !== v.status) { return }
        }
        friends = [{
          username: v.username,
          handle: v.handle,
          timestamp: v.timestamp
        }, ...friends]
      })
      if(!this.state.mounted) this.state.friends = friends
      else this.setState({friends})
    })
  }

  componentDidMount() {
    this.state.mounted = true
  }
  render() {
    return (
      <div className="friends-list">
        <select size={5}>
          {this.state.friends.map(function(friend, index) {
            return <option key={index} value={friend.participants[1]}>{friend.participants[1]}</option>;
          })}
        </select>
      </div>
    )
  }
}
