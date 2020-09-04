import React from 'react';
import './AnnounceList.css';

export default class AnnounceList extends React.Component {

  static defaultState(that: AnnounceList) {
    return {
      announce: [],
      mounted: false
    }
  }
  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      AnnounceList.defaultState(this),
      props
    )
    window.disco.state.paths.announce.map().on((ann, k) => {
      var announce = this.state.announce
      announce = [{
        username: ann.username,
        hid: ann.hid,
        handle: ann.handle,
        timestamp: ann.timestamp
      }, ...announce]
      if(announce.length > 10) {
        announce.pop()
      }
      if(this.state.mounted)
        this.setState({announce})
      else
        this.state.announce = announce
    })
  }

  componentDidMount() {
    this.state.mounted = true
  }

  render() {
    return (
      <div className="announce-list">
        <select size={5}>
          {this.state.announce.map(function(user, index){
            return <option key={ index } value={ user.hid }> {user.handle }</option>;
          })}
        </select>
      </div>
    )
  }
}
