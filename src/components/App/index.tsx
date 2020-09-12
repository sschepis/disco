import React from 'react'
import UserList from '../UserList';
import AnnounceList from '../AnnounceList';
import FriendsList from '../FriendsList';
import IncomingList from '../IncomingList';
import DiscoPeer from '../../services/disco'
import { Container, Row, Col } from 'react-bootstrap'
import ChatSessionsList from '../ChatSessionsList'
import ChatSession from '../ChatSession'
import FeedPostList from '../FeedPostList'
import GroupList from '../GroupList'
import GroupPostList from '../GroupPostList'

// dispatch an event throgh the document
function dispatch (e:any, p:any = null) {
  document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
}


export default class App extends React.Component {
  static defaults(that: any) {
    return {
      disco: null,
      selectedUser: null,
      selectedGroup: null,
      sessionHid: null,
      groupHid: null,
      postTitle: '',
      postUrl: '',
      postContent: ''
    }
  }
  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(App.defaults(this), props)
    this.addFriend = this.addFriend.bind(this)
    this.confirmFriend = this.confirmFriend.bind(this)
    this.removeFriend = this.removeFriend.bind(this)
    this.chatWith = this.chatWith.bind(this)
    this.addFeedPost = this.addFeedPost.bind(this)
    this.addGroup = this.addGroup.bind(this)
    this.addGroupPost = this.addGroupPost.bind(this)
    this.handlePostTitleChange = this.handlePostTitleChange.bind(this)
    this.handlePostUrlChange = this.handlePostUrlChange.bind(this)
    this.handlePostContentChange = this.handlePostContentChange.bind(this)

    this.state.disco = window.disco = new DiscoPeer({
      rootNode: ']2hln98hosfdafadfc',
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

  groupSelected(group:any) {
    this.setState({selectedGroup: group})
  }

  addFriend(e:any) {
    window.disco.addFriend(this.state.selectedUser, () => {
      console.log('addFriend', `friend added: ${this.state.selectedUser}`)
    })
  }

  addFeedPost(e:any, callback: any) {
    if(!this.state.postTitle || !this.state.postUrl || !this.state.postContent) {
      return
    }
    const feedNode = window.disco.state.paths.user.feed

    feedNode.set({
      timestamp: Date.now(),
      type: 'post',
      owner: window.disco.state.auth.hid,
      title: this.state.postTitle,
      summary: this.state.postContent
    })
    .once((newPostO: any, newPostKey: any) => {

      feedNode.get(newPostKey)
      .get('content')
      .set({
        timestamp: Date.now(),
        link: this.state.postUrl,
        content: this.state.postContent
      }, () => {
        if(callback) {
          newPostO.hid = newPostKey
          callback (null, newPostO)
        }
      })

    })
  }

  addGroup(e:any, callback: any) {
    if(!this.state.postTitle || !this.state.postUrl || !this.state.postContent) {
      return
    }
    const groupsNode = window.disco.state.paths.groups
    groupsNode.set({
      timestamp: Date.now(),
      type: 'group',
      owner: window.disco.state.auth.hid,
      name: this.state.postTitle,
      summary: this.state.postContent,
      membership: 'open',
      visibility: 'public'
    })
    .once((newGroupO: any, newGroupKey: any) => {

      groupsNode.get(newGroupKey)
      .get('members')
      .set(window.disco.state.auth.hid)

      groupsNode.get(newGroupKey)
      .get('mods')
      .set(window.disco.state.auth.hid, () => {
        if(callback) {
          newGroupO.hid = newGroupKey
          callback (null, newGroupO)
        }
      })

    })
  }

  addGroupPost(e:any, callback:any) {
    if(!this.state.postTitle
      || !this.state.postUrl
      || !this.state.postContent
      || !this.state.selectedGroup) {
      return
    }
    const groupNode = window.disco.state.paths.groups.get(this.state.selectedGroup)
    groupNode.once((groupO, groupKey) => {
      if(!groupO) {
        return callback(new Error('Group does not exist!'))
      }

      groupNode.get('posts').set({
        timestamp: Date.now(),
        type: 'post',
        owner: window.disco.state.auth.hid,
        title: this.state.postTitle,
        summary: this.state.postContent
      })
      .once((newPostO: any, newPostKey: any) => {

        groupNode.get('posts').get(newPostKey)
        .get('content')
        .set({
          timestamp: Date.now(),
          link: this.state.postUrl,
          content: this.state.postContent
        }, () => {
          if(callback) {
            newPostO.hid = newPostKey
            callback (null, newPostO)
          }
        })

      })

    })
  }

  confirmFriend() {
    window.disco.approveFriend(this.state.selectedUser, () => {
      console.log('approveFriend', `friend added: ${this.state.selectedUser}`)
    })
  }

  removeFriend() {}

  chatWith() {
    window.disco.chatWith(this.state.selectedUser, 'hello', () => {
      console.log('chatWith', `chat initiated with: ${this.state.selectedUser}`)
    })
  }

  handlePostTitleChange(e: any) {
    this.state.postTitle = e.target.value
  }

  handlePostUrlChange(e: any) {
    this.state.postUrl = e.target.value
  }

  handlePostContentChange(e: any) {
    this.state.postContent = e.target.value
  }


  render() {
    var user = window.disco.state.auth ? window.disco.state.auth.handle: 'nobody'
    var hid = window.disco.state.auth ? window.disco.state.auth.hid: 'nobody'
    return (
    <div className="App">
      <Container fluid>
        <Row>
          <Col><h1>logged in as {user} ({hid})</h1></Col>
        </Row>
        <Row>
          <Col><div className={'anntext'}>With <span className='anntext'>{this.state.selectedUser}</span></div></Col>
          <Col xs={9}>
            <div style={{width:'100%', margin:'10px'}}>
            <button onClick={this.addFriend}>Add Friend</button>
            <button onClick={this.removeFriend}>Remove Friend</button>
            <button onClick={this.confirmFriend}>Confirm Friend</button>
            <button onClick={this.chatWith}>Chat with</button>
            <button onClick={this.addFeedPost}>Add Feed Post</button>
            <button onClick={this.addGroup}>Add Group</button>
            <button onClick={this.addGroupPost}>Add Group Post</button>
            </div>
          </Col>
        </Row>
        <Row>
          <Col><h2>Users</h2><UserList></UserList></Col>
          <Col><h2>Announces</h2><AnnounceList /></Col>
          <Col><h2>Confirmed Friends</h2><FriendsList mode={'friend'} /></Col>
          <Col><h2>Pending Friends</h2><FriendsList mode={'pending'}/></Col>
        </Row>
        <Row>
          <Col><h2>Incoming Notifies</h2><IncomingList /></Col>
          <Col><h2>Chat sessions</h2><ChatSessionsList /></Col>
          <Col><h2>Chat session</h2><ChatSession sessionHid={this.state.sessionHid} /></Col>
        </Row>
        <Row>
          <Col><h2>Feed Posts</h2><FeedPostList /></Col>
          <Col><h2>Groups</h2><GroupList /></Col>
          <Col><h2>Group Posts</h2><GroupPostList hid={this.state.selectedGroup} /></Col>
        </Row>
        <Row><Col>&nbsp;</Col></Row>
        <Row><form>
          <Col><input type="text" onChange={this.handlePostTitleChange} placeholder="Post Title goes here"/></Col>
          <Col><input type="text" onChange={this.handlePostUrlChange} placeholder="Post URL goes here"/></Col>
          <Col><input type="text" onChange={this.handlePostContentChange} placeholder="Post body goes here"/></Col>
          </form></Row>
      </Container>
    </div>
    )
  }
}
