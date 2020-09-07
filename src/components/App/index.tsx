import React from 'react'
import UserList from '../UserList';
import AnnounceList from '../AnnounceList';
import FriendsList from '../FriendsList';
import IncomingList from '../IncomingList';
import DiscoPeer from '../../services/disco'
import { Container, Row, Col } from 'react-bootstrap'

// dispatch an event throgh the document
function dispatch (e:any, p:any = null) {
  document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
}


export default class App extends React.Component {
  static defaults(that: any) {
    return {
      disco: null,
      selectedUser: null
    }
  }
  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(App.defaults(this), props)
    this.addFriend = this.addFriend.bind(this)
    this.confirmFriend = this.confirmFriend.bind(this)

    this.state.disco = window.disco = new DiscoPeer({
      rootNode: '76jjjlfdwkefds',
      events: {
        onReady: () => {},
        onObserving: (path) => {},
        onAnnounce: () => {}
      }
    })
  }

  componentDidMount() {
    document.addEventListener('user_selected',(e) => {
      this.userSelected(e.detail)
    })
  }

  userSelected(user:any) {
    this.setState({selectedUser: user})
  }

  addFriend(e:any) {
    window.disco.addFriend(this.state.selectedUser, () => {
      console.log('addFriend', `friend added: ${this.state.selectedUser}`)
    })
  }

  confirmFriend() {
    window.disco.approveFriend(this.state.selectedUser, () => {
      console.log('approveFriend', `friend added: ${this.state.selectedUser}`)
    })
  }

  removeFriend() {}

  render() {
    var user = window.disco.state.auth ? window.disco.state.auth.handle: 'nobody'
    return (
    <div className="App">
      <Container fluid>
        <Row>
          <Col><h1>logged in as {user}</h1></Col>
        </Row>
        <Row>
          <Col><h2>Users</h2><UserList></UserList></Col>
          <Col><h2>Announces</h2><AnnounceList /></Col>
          <Col><h2>Confirmed Friends</h2><FriendsList mode={'friend'} /></Col>
          <Col><h2>Pending Friends</h2><FriendsList mode={'pending'}/></Col>
        </Row>
        <Row>
          <Col><h2>Incoming Notifies</h2><IncomingList></IncomingList></Col>
          <Col></Col>
          <Col></Col>
          <Col></Col>
        </Row>
        <Row>
          <Col><div className={'anntext'}>With <span className='anntext'>{this.state.selectedUser}</span></div></Col>
          <Col xs={9}>
            <div style={{width:'100%', margin:'10px'}}>
            <button onClick={this.addFriend}>Add Friend</button>
            <button onClick={this.removeFriend}>Remove Friend</button>
            <button onClick={this.confirmFriend}>Confirm Friend</button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
    )
  }
}
