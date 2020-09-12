import React from 'react';
import './GroupPostList.css';

export default class GroupPostList extends React.Component {

  props: {
    hid: string
  }

  static defaultState(that: GroupPostList) {
    return {
      posts: [],
      ready: false,
      hid: null
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      GroupPostList.defaultState(this),
      props
    )
    this.handleDiscoReady = this.handleDiscoReady.bind(this)
    this.handleChange = this.handleChange.bind(this)
    document.addEventListener('ready', this.handleDiscoReady)
  }

  handleDiscoReady() {
    this.state.ready = true
    this.listenForPosts()
    document.addEventListener('group_selected',(e) => {
      this.state.hid = e.detail
      this.listenForPosts()
    })
  }

  listenForPosts() {
    if(!this.state.ready || !this.state.hid) {
      return
    }
    const theGroupNode = window.disco.state.paths.groups.get(this.state.hid)
    this.state.posts = []

    theGroupNode.once((groupO, groupHid) => {
      if(!groupO) {
        throw new Error('this group does not exist')
      }
      // TODO: check stuff here
      theGroupNode
      .get('posts')
      .map()
      .once((postO: any, postHid: any) => {
        if(!postO || postO.type !== 'post') { return }
        const posts = this.state.posts || []
        posts.filter((e) => e.hid !== postHid)
        posts.push({
          hid: postHid,
          type: 'post',
          timestamp: postO.timestamp,
          title: postO.title,
          url: postO.url,
          body: postO.body
        })
        posts.sort((a: any, b: any) => a.timestamp > b.timestamp)
        this.setState({posts})
      })
    })
  }

  handleChange(event) {
    this.setState({hid: event.target.value});
    this.dispatch('post_selected', event.target.value)
  }

  dispatch (e:any, p:any = null) {
    document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
  }

  render() {
    return (
      <div className="group-post-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.posts.map(function(post, index) {
            return <option key={index} value={post.hid}> {post.title}</option>;
          })}
        </select>
      </div>
    )
  }
}
