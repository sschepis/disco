import React from 'react';
import './AnnounceList.css';

export default class AnnounceList extends React.Component {

  static defaultState(that: AnnounceList) {
    return {
      announce: [],
      mounted: false,
      selected: null
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
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount() {
    this.state.mounted = true
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
      <div className="announce-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.announce.map(function(user, index){
            return <option value={ user.hid }> {user.handle }</option>
          })}
        </select>
      </div>
    )
  }
}
