import React from 'react'
import UserList from '../UserList';
import AnnounceList from '../AnnounceList';
import DiscoPeer from '../../services/disco'

export default class App extends React.Component {
  static defaults(that: any) {
    return {
      disco: null
    }
  }
  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(App.defaults(this), props)

    this.discoAnnounce = this.discoAnnounce.bind(this)
    this.discoObserving = this.discoObserving.bind(this)
    this.discoReady = this.discoReady.bind(this)

    this.state.disco = window.disco = new DiscoPeer({
      rootNode: '76jke',
      events: {
        onReady: () => this.discoReady(),
        onObserving: (path) => this.discoObserving(path),
        onAnnounce: () => this.discoAnnounce()
      }
    })
  }

  discoReady() {

  }

  discoObserving(path:any) {

  }

  discoAnnounce() {

  }

  render() {
    var user = ''
    return (
    <div className="App">
      <div style={{width:'100%', height:'50px', textAlign:'center'}}>logged in as {window.disco.state.auth ? window.disco.state.auth.handle: 'nobody'}</div>
      <UserList /><AnnounceList />
    </div>
    )
  }
}
