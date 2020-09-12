import React from 'react';
import './GroupList.css';

export default class GroupList extends React.Component {

  static defaultState(that: GroupList) {
    return {
      groups: [],
      ready: false
    }
  }

  state
  constructor(props: any) {
    super(props)
    this.state = Object.assign(
      GroupList.defaultState(this),
      props
    )
    this.handleDiscoReady = this.handleDiscoReady.bind(this)
    this.handleChange = this.handleChange.bind(this)
    document.addEventListener('ready', this.handleDiscoReady)
  }

  handleDiscoReady() {
    this.state.ready = true
    this.listenForGroups()
  }

  listenForGroups() {
    window.disco.state.paths.groups
    .map()
    .once((groupO: any, groupHid: any) => {
      if(!groupO || groupO.type !== 'group') { return }
      const groups = this.state.groups || []
      groups.filter((e) => e.hid !== groupHid)
      groups.push({
        hid: groupHid,
        name: groupO.name,
        summary: groupO.name,
        membership: groupO.name,
        visibility: groupO.visibility
      })
      groups.sort((a: any, b: any) => a.timestamp > b.timestamp)
      this.setState({groups})
    })
  }

  handleChange(event) {
    this.setState({hid: event.target.value});
    this.dispatch('group_selected', event.target.value)
  }

  dispatch (e:any, p:any = null) {
    document.dispatchEvent(p ? new CustomEvent(e, { detail: p }) : new Event(e))
  }

  render() {
    return (
      <div className="group-list">
        <select size={5} onChange={this.handleChange}>
          {this.state.groups.map(function(group, index) {
            return <option key={index} value={group.hid}> {group.name}</option>;
          })}
        </select>
      </div>
    )
  }
}
