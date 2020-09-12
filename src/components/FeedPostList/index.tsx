import React from 'react';
import './FeedPostList.css';

export default class FeedPostList extends React.Component {

  static defaultState(that: FeedPostList) {
    return {
      posts: [],
      ready: false
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      FeedPostList.defaultState(this),
      props
    )
    this.handleDiscoReady = this.handleDiscoReady.bind(this)
    this.handleChange = this.handleChange.bind(this)
    document.addEventListener('ready', this.handleDiscoReady)
  }

  handleDiscoReady() {
    this.state.ready = true
    this.listenForPosts()
  }

  listenForPosts() {
    window.disco.state.paths.user.feed
    .map()
    .once((post:any, postHid: any) => {
      const posts = this.state.posts || []
      if(!post || post.type !== 'post') { return }
      posts.filter((e) => e.hid !== postHid)
      posts.push({
        hid: postHid,
        type: 'post',
        timestamp: post.timestamp,
        title: post.title,
        url: post.url,
        body: post.body
      })
      posts.sort((a: any, b: any) => a.timestamp > b.timestamp)
      this.setState({posts})
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
      <div className="feed-post-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.posts.map(function(post, index) {
            return <option key={index} value={post.hid}> {post.title}</option>;
          })}
        </select>
      </div>
    )
  }
}
