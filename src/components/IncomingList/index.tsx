import React from 'react';
import './IncomingList.css';

export default class IncomingList extends React.Component {

  static defaultState(that: IncomingList) {
    return {
      incoming: [],
      ready: false
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      IncomingList.defaultState(this),
      props
    )
    this.handleReady = this.handleReady.bind(this)
    this.handleChange = this.handleChange.bind(this)
    document.addEventListener('ready', () => this.handleReady())
  }

  handleReady() {
    this.state.ready = true
    const incoming = []
    this.listenForIncoming()
  }

  listenForIncoming() {
    window.disco.state.paths.user.incoming
    .map()
    .on((v:any, k:any) => {
      if(v.processed) { return }
      window.disco.state.paths.users
      .get(v.from)
      .once((vv, kk) => {
        const incoming = this.state.incoming || []
        incoming.push({
          type: v.type,
          hid: kk,
          username: vv.username,
          handle: vv.handle,
          timestamp: vv.timestamp
        })
        incoming.sort((a, b) => a > b)
        this.setState({incoming})
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
      <div className="incoming-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.incoming.map(function(incoming, index) {
            return <option key={index} value={incoming.hid}>{incoming.type} - {incoming.handle}</option>;
          })}
        </select>
      </div>
    )
  }
}
