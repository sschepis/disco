import React from 'react';
import './UserList.css';

export default class UserList extends React.Component {

  static defaultState(that: UserList) {
    return {
      users: [],
      mounted: false
    }
  }

  state

  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      UserList.defaultState(this),
      props
    )
    window.disco.getUsers((err, usersObj) => {
      if(err || !usersObj) {
        return
      }
      var usersKeys = Object.keys(usersObj)
      var users = []
      const uSize = usersKeys.length
      window.disco.state.paths.users.map().on((v, k) => {
        if(!v.username) {
          return
        }
        users = [...users, {
          hid: v.hid,
          username: v.username,
          handle: v.handle,
          timestamp: v.timestamp
        }]
      })
      if(!this.state.mounted) this.state.users = users
      else this.setState({users})
    })
  }

  componentDidMount() {
    this.state.mounted = true
  }
  render() {
    return (
      <div className="user-list">
        <select size={5}>
          {this.state.users.map(function(user, index) {
            return <option key={ index } value={ user.hid }> {user.handle }</option>;
          })}
        </select>
      </div>
    )
  }
}
