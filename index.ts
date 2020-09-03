import DiscoPeer from './src/services/disco'

const disco = window.disco = new DiscoPeer({
  rootNode: 'OBEY',
  events: {
    onReady: () => {},
    onObserving: (path) => {

    },
    onAnnounce: () => {
      disco.addFriend(id, () => {
        console.log('friend added')
      })
    }
  }
})

var id, okeys
new Promise((resolve, reject) => {
  disco.getUsers(function(err, result) {okeys = Object.keys(result)
    console.log(okeys[1])
    id = okeys[1]
    resolve()
  })
}).then()

